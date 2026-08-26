/**
 * 考研打卡计时器 - ESP32 固件（BLE 蓝牙回传）
 *
 * 功能：双按键计时器，通过 BLE GATT 通知手机 App「开始 / 结束」事件，
 * 具体秒数由手机端用 Date.now() 差分计算（与 App 内 handleStop 逻辑一致），
 * 避免两端计时漂移。
 *
 * 接线：
 *   OLED(I2C)  3V3→VCC  GND→GND  GPIO21→SDA  GPIO22→SCL
 *   按键1(开始) 一端接 GPIO12，另一端接 GND（INPUT_PULLUP，按下为 LOW）
 *   按键2(结束) 一端接 GPIO14，另一端接 GND（INPUT_PULLUP，按下为 LOW）
 *   蜂鸣器(无源)  裸无源蜂鸣器：正极→GPIO13 + 负极→GND；或 3 脚无源模块 I/O→GPIO13
 *                 无源需 PWM 方波驱动，见下方 LEDC 配置；换频率即可改变音调
 *
 * 依赖库（Arduino IDE -> 库管理器安装）：
 *   - ESP32 Board Package
 *   - Adafruit SSD1306（OLED 显示）
 *   - Adafruit GFX（SSD1306 依赖）
 */

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <Wire.h>
#include <Adafruit_SSD1306.h>

/* ── 常量配置 ── */
// 自定义 GATT 服务 / 特征 UUID（与 App 侧 src/lib/bleTimer.ts 保持一致）
#define SERVICE_UUID        "0000180f-0000-1000-8000-00805f9b34fb"
#define CHAR_STATE_UUID     "2a19"   // 状态 Notify：0x31('1') 开始 / 0x30('0') 结束
#define CHAR_SUBJECT_UUID   "2a1f"   // 科目 Notify（预留，UTF-8 字符串）

// 引脚
#define PIN_START_BTN  12
#define PIN_STOP_BTN   14
#define PIN_BUZZER     13

// 蜂鸣器：无源（压电/电磁）— 需用 PWM 方波驱动，频率可变
// 配 3 脚无源蜂鸣器模块时接 I/O→GPIO13；配裸无源蜂鸣器时一端接 GPIO13、另一端接 GND
#define BEEP_PIN     PIN_BUZZER   // 复用 GPIO13
#define BEEP_CHANNEL 0            // ESP32 LEDC 通道（core 2.x 用）
#define BEEP_FREQ    2000         // 提示音默认频率(Hz)，音调越细越尖
#define BEEP_RES     8            // LEDC 分辨率(bit)

// LEDC API 兼容：ESP32 Arduino core 2.x 用 ledcSetup/ledcAttachPin + 通道句柄，
// core 3.x 起改为 ledcAttach + 引脚句柄（ledcWrite 参数从通道变为引脚）。
// 用 ESP_ARDUINO_VERSION_MAJOR 判断（core 2.0.4+ 起已定义）。
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  #define LEDC_HANDLE BEEP_PIN       // 3.x：以引脚为句柄
#else
  #define LEDC_HANDLE BEEP_CHANNEL   // 2.x：以通道为句柄
#endif

// 统一入口：按当前 core 版本初始化/设频/写占空比
void ledcInitBuzzer() {
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcAttach(BEEP_PIN, BEEP_FREQ, BEEP_RES);
  ledcWrite(BEEP_PIN, 0);
#else
  ledcSetup(BEEP_CHANNEL, BEEP_FREQ, BEEP_RES);
  ledcAttachPin(BEEP_PIN, BEEP_CHANNEL);
  ledcWrite(BEEP_CHANNEL, 0);
#endif
}
void ledcBuzzerFreq(uint16_t freq) {
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcChangeFrequency(BEEP_PIN, freq, BEEP_RES);
#else
  ledcChangeFrequency(BEEP_CHANNEL, freq, BEEP_RES);
#endif
}
void ledcBuzzerWrite(uint32_t duty) {
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcWrite(BEEP_PIN, duty);
#else
  ledcWrite(BEEP_CHANNEL, duty);
#endif
}

// 屏幕
#define SCREEN_WIDTH   128
#define SCREEN_HEIGHT  64
#define OLED_ADDR      0x3C

/* ── 全局状态 ── */
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

BLECharacteristic *stateChar = NULL;
BLECharacteristic *subjChar = NULL;

bool running = false;
unsigned long startMs = 0;     // 本次计时起始时间（ESP32 内部 millis）
unsigned long lastTickMs = 0;  // 上次刷新 OLED 的时间
bool deviceConnected = false;

/* 连接状态回调：有中心设备连接时避免睡眠 */
class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *server) { deviceConnected = true; }
  void onDisconnect(BLEServer *server) {
    deviceConnected = false;
    // 断开后重新广播，方便再次连接
    server->getAdvertising()->start();
  }
};

/** 通知状态给手机：on=1 开始 / on=0 结束 */
void notifyState(bool on) {
  if (!deviceConnected) return;
  const char *payload = on ? "1" : "0";
  stateChar->setValue((uint8_t *)payload, 1);
  stateChar->notify();
}

/** 无源蜂鸣器提示音：以指定频率响 ms 毫秒后静音 */
void beep(uint16_t freq = BEEP_FREQ, unsigned long ms = 200) {
  ledcBuzzerFreq(freq);
  ledcBuzzerWrite(128);      // 50% 占空比，方波即有音量
  delay(ms);
  ledcBuzzerWrite(0);        // 停响
}

/** 更新 OLED 显示（mm:ss 或 hh:mm:ss） */
void renderScreen() {
  display.clearDisplay();
  display.setTextSize(3);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(8, 20);

  unsigned long totalSec = 0;
  if (running) {
    totalSec = (millis() - startMs) / 1000;
  }
  char buf[16];
  unsigned long h = totalSec / 3600;
  unsigned long m = (totalSec % 3600) / 60;
  unsigned long s = totalSec % 60;
  if (h > 0) {
    snprintf(buf, sizeof(buf), "%02lu:%02lu:%02lu", h, m, s);
  } else {
    snprintf(buf, sizeof(buf), "%02lu:%02lu", m, s);
  }
  display.print(buf);
  display.setTextSize(1);
  display.setCursor(20, 54);
  display.print(running ? "STUDYING..." : "READY");
  display.display();
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_START_BTN, INPUT_PULLUP);
  pinMode(PIN_STOP_BTN, INPUT_PULLUP);

  // 无源蜂鸣器：LEDC PWM 配置，默认先静音（占空比 0）
  ledcInitBuzzer();

  // OLED 初始化
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    Serial.println("OLED init failed");
  }
  display.clearDisplay();
  renderScreen();

  // BLE 初始化
  BLEDevice::init("DiveDeep");
  BLEServer *server = BLEDevice::createServer();
  server->setCallbacks(new MyServerCallbacks());

  BLEService *svc = server->createService(SERVICE_UUID);
  stateChar = svc->createCharacteristic(
      CHAR_STATE_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  subjChar = svc->createCharacteristic(
      CHAR_SUBJECT_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  svc->start();

  // 广播，便于手机扫描
  BLEAdvertising *ad = server->getAdvertising();
  ad->addServiceUUID(SERVICE_UUID);
  ad->setScanResponse(true);
  ad->setMinPreferred(0x06);
  ad->setMinPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("DiveDeep BLE ready");
}

void loop() {
  // 开始按键（边沿触发）
  if (digitalRead(PIN_START_BTN) == LOW && !running) {
    delay(50);  // 简单消抖
    if (digitalRead(PIN_START_BTN) == LOW) {
      running = true;
      startMs = millis();
      notifyState(true);
      renderScreen();
      while (digitalRead(PIN_START_BTN) == LOW) { delay(10); }  // 等待松开
    }
  }

  // 结束按键（边沿触发）
  if (digitalRead(PIN_STOP_BTN) == LOW && running) {
    delay(50);
    if (digitalRead(PIN_STOP_BTN) == LOW) {
      running = false;
      notifyState(false);
      // 结束提示音：短鸣两次（每次 160ms）
      beep(2000, 160);
      beep(2000, 160);
      renderScreen();
      while (digitalRead(PIN_STOP_BTN) == LOW) { delay(10); }
    }
  }

  // 计时中每秒刷新 OLED
  if (running && millis() - lastTickMs >= 1000) {
    lastTickMs = millis();
    renderScreen();
  }

  delay(20);
}
