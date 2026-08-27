/**
 * 打卡计时器 - ESP32 固件（BLE 蓝牙回传）v2.0
 *
 * 功能：5 键硬件计时器，OLED 菜单在设备上选择科目（先选科目再计时）。
 *       科目列表由 App 通过蓝牙推送（支持自定义科目），OLED 用 U8g2 中文字库显示中文。
 *
 * 按键（按下为 LOW，INPUT_PULLUP）：
 *   ▲ GPIO32        待机：上翻选择科目
 *   ▼ GPIO33        待机：下翻选择科目
 *   OK GPIO25       待机：确认选中当前科目（发送 SEL 事件，App 端记录所选科目）
 *                   计时中：暂停 / 继续
 *   开始 GPIO12     待机：用当前高亮科目直接开始计时；计时中：无操作
 *   结束 GPIO14     任意：停止计时并通知 App（时长由 App 用 Date.now() 差分计算）
 *
 * 蜂鸣器 GPIO13（无源，PWM 驱动）：切换短滴 / 开始一声 / 暂停一声 / 结束两声
 *
 * BLE GATT（UUID 与 App 侧 src/lib/bleTimer.ts 保持一致）：
 *   SERVICE_UUID  "0000180f-0000-1000-8000-00805f9b34fb"
 *   stateChar "2a19" Notify：'1' 开始 / '0' 结束 / '2' 暂停 / '3' 继续
 *   subjChar  "2a1f" Notify：'SEL:<科目名>' 选中的科目（UTF-8）
 *   cmdChar   "2a1d" Write：App 推送科目列表
 *              'C' 清空列表；'S:<科目名>' 追加一条；'E' 推送结束
 *
 * 接线：
 *   OLED(I2C)  3V3→VCC  GND→GND  GPIO21→SDA  GPIO22→SCL（0x3C）
 *   上翻▲      一端接 GPIO32，另一端接 GND
 *   下翻▼      一端接 GPIO33，另一端接 GND
 *   确认/暂停  一端接 GPIO25，另一端接 GND
 *   开始       一端接 GPIO12，另一端接 GND
 *   结束       一端接 GPIO14，另一端接 GND
 *   蜂鸣器(无源) 正极→GPIO13 + 负极→GND；或 3 脚模块 I/O→GPIO13
 *
 * 依赖库（Arduino IDE -> 库管理器安装）：
 *   - ESP32 Board Package
 *   - U8g2（OLED 显示，含中文字库 u8g2_font_wqy12_t_gb2312）
 *   - Wire（内置）
 */

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>   // BLE2902（CCCD 描述符 0x2902）类型定义
#include <Wire.h>
#include <U8g2lib.h>

/* ── 常量配置 ── */
// 自定义 GATT 服务 / 特征 UUID（与 App 侧 src/lib/bleTimer.ts 保持一致）
#define SERVICE_UUID        "0000180f-0000-1000-8000-00805f9b34fb"
#define CHAR_STATE_UUID     "2a19"   // 状态 Notify：'1'开始 / '0'结束 / '2'暂停 / '3'继续
#define CHAR_SUBJECT_UUID   "2a1f"   // 科目 Notify：'SEL:<科目名>'
#define CHAR_CMD_UUID       "2a1d"   // 命令 Write：App 推送科目列表 'C'/'S:..'/'E'

// 引脚
#define PIN_UP_BTN     32   // 上翻▲
#define PIN_DOWN_BTN   33   // 下翻▼
#define PIN_OK_BTN     25   // 确认/暂停
#define PIN_START_BTN  12   // 开始
#define PIN_STOP_BTN   14   // 结束
#define PIN_BUZZER     13

// 蜂鸣器：无源（压电/电磁）— 需用 PWM 方波驱动，频率可变
#define BEEP_PIN     PIN_BUZZER
#define BEEP_CHANNEL 0            // ESP32 LEDC 通道（core 2.x 用）
#define BEEP_FREQ    2000         // 提示音默认频率(Hz)
#define BEEP_RES     8            // LEDC 分辨率(bit)

// 科目列表（由 App 通过蓝牙推送）
#define MAX_SUBJECTS 24
#define MAX_NAME_LEN 24           // 字节（UTF-8，最多约 8 个汉字）
char subjects[MAX_SUBJECTS][MAX_NAME_LEN];
int subjectCount = 0;
int cursor = 0;                   // 当前高亮科目下标

// LEDC API 兼容：ESP32 Arduino core 2.x 用 ledcSetup/ledcAttachPin + 通道句柄，
// core 3.x 起改为 ledcAttach + 引脚句柄（ledcWrite 参数从通道变为引脚）。
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  #define LEDC_HANDLE BEEP_PIN       // 3.x：以引脚为句柄
#else
  #define LEDC_HANDLE BEEP_CHANNEL   // 2.x：以通道为句柄
#endif

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

/* ── 屏幕（U8g2 中文字库） ── */
U8G2_SSD1306_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0, U8X8_PIN_NONE);

/* ── 全局状态 ── */
typedef enum { ST_MENU, ST_RUNNING, ST_PAUSED } TimerState_t;
TimerState_t tstate = ST_MENU;
unsigned long startMs = 0;        // 本次计时起始（ESP32 millis）
unsigned long pauseAccumMs = 0;   // 已暂停累计时长
unsigned long pausedAtMs = 0;     // 当前暂停的起始时刻
unsigned long lastTickMs = 0;     // 上次刷新 OLED 的时间
bool deviceConnected = false;
unsigned long lastAdKeepMs = 0;   // 广播保活

BLECharacteristic *stateChar = NULL;
BLECharacteristic *subjChar = NULL;
BLECharacteristic *cmdChar = NULL;

/* 连接状态回调 */
class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *server) {
    deviceConnected = true;
    Serial.println("[BLE] 手机已连接");
  }
  void onDisconnect(BLEServer *server) {
    deviceConnected = false;
    Serial.println("[BLE] 手机已断开，重启广播");
    server->getAdvertising()->start();
  }
};

/* 状态特征回调：监控 CCCD 订阅写入 */
class StateCallbacks : public BLECharacteristicCallbacks {
  void onSubscribe(BLECharacteristic *c, uint16_t value) {
    Serial.printf("[BLE] CCCD 订阅变化: 0x%04X (%s)\n", value, value ? "已订阅" : "已取消");
  }
};

/* 命令特征回调：接收 App 推送的科目列表 */
class CmdCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *c) {
    String val = c->getValue();
    if (val.length() == 0) return;
    if (val[0] == 'C') {
      // 清空列表
      subjectCount = 0;
      cursor = 0;
      Serial.println("[CMD] 清空科目列表");
      renderScreen();
    } else if (val[0] == 'S' && val.length() > 2) {
      // 追加一条科目：'S:<名称>'
      if (subjectCount < MAX_SUBJECTS) {
        int len = val.length() - 2;
        if (len >= MAX_NAME_LEN) len = MAX_NAME_LEN - 1;
        memcpy(subjects[subjectCount], val.c_str() + 2, len);
        subjects[subjectCount][len] = '\0';
        Serial.printf("[CMD] 添加科目: %s\n", subjects[subjectCount]);
        subjectCount++;
        renderScreen();
      }
    } else if (val[0] == 'E') {
      // 推送结束
      Serial.printf("[CMD] 科目推送结束，共 %d 条\n", subjectCount);
      if (cursor >= subjectCount) cursor = 0;
      renderScreen();
    }
  }
};

/** 通知状态给手机：'1'开始 / '0'结束 / '2'暂停 / '3'继续 */
void notifyState(char code) {
  if (!deviceConnected) return;
  stateChar->setValue((uint8_t *)&code, 1);
  stateChar->notify();
  Serial.printf("[BLE] 通知状态: %c\n", code);
}

/** 通知选中科目：'SEL:<科目名>' */
void notifySubject(const char *name) {
  if (!deviceConnected) return;
  char buf[MAX_NAME_LEN + 8];
  snprintf(buf, sizeof(buf), "SEL:%s", name);
  subjChar->setValue((uint8_t *)buf, strlen(buf));
  subjChar->notify();
  Serial.printf("[BLE] 通知科目: %s\n", buf);
}

/** 无源蜂鸣器提示音 */
void beep(uint16_t freq = BEEP_FREQ, unsigned long ms = 200) {
  ledcBuzzerFreq(freq);
  ledcBuzzerWrite(128);      // 50% 占空比
  delay(ms);
  ledcBuzzerWrite(0);
}

/** 当前计时的总秒数（扣除暂停时间） */
unsigned long runningTotalSec() {
  unsigned long total = 0;
  if (tstate == ST_RUNNING) {
    total = (millis() - startMs - pauseAccumMs) / 1000;
  } else if (tstate == ST_PAUSED) {
    total = (pausedAtMs - startMs - pauseAccumMs) / 1000;
  }
  return total;
}

/** 更新 OLED 显示（菜单 / 计时） */
void renderScreen() {
  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_wqy12_t_gb2312);

  if (tstate == ST_MENU) {
    // 标题 + 计数
    u8g2.drawUTF8(2, 1, "选择科目");
    char cnt[16];
    snprintf(cnt, sizeof(cnt), "%d/%d", subjectCount ? cursor + 1 : 0, subjectCount);
    u8g2.drawUTF8(92, 1, cnt);

    if (subjectCount == 0) {
      u8g2.drawUTF8(2, 30, "连接 App 后自动同步");
      u8g2.drawUTF8(2, 46, "▲▼选  开始=计时");
    } else {
      // 显示 3 行，高亮当前项
      int visible = 3;
      int top = cursor - 1;
      if (top < 0) top = 0;
      if (top + visible > subjectCount) top = max(0, subjectCount - visible);
      for (int i = 0; i < visible; i++) {
        int idx = top + i;
        if (idx >= subjectCount) break;
        int y = 15 + i * 15;
        if (idx == cursor) {
          u8g2.drawBox(0, y, 128, 14);   // 反白高亮
          u8g2.setDrawColor(0);
          u8g2.drawUTF8(2, y + 1, subjects[idx]);
          u8g2.setDrawColor(1);
        } else {
          u8g2.drawUTF8(2, y + 1, subjects[idx]);
        }
      }
      u8g2.drawUTF8(2, 60, "OK确认 开始=计时 结束=停");
    }
  } else {
    // 计时界面：科目名（顶部居中）
    u8g2.setFont(u8g2_font_wqy12_t_gb2312);
    int w = u8g2.getUTF8Width(subjects[cursor]);
    u8g2.drawUTF8(max(0, (128 - w) / 2), 2, subjects[cursor]);

    // 倒计时大数字（>1h 用 22px，否则 32px）
    unsigned long totalSec = runningTotalSec();
    unsigned long h = totalSec / 3600;
    unsigned long m = (totalSec % 3600) / 60;
    unsigned long s = totalSec % 60;
    char buf[16];
    if (h > 0) {
      snprintf(buf, sizeof(buf), "%lu:%02lu:%02lu", h, m, s);
      u8g2.setFont(u8g2_font_logisoso24_tf);
    } else {
      snprintf(buf, sizeof(buf), "%02lu:%02lu", m, s);
      u8g2.setFont(u8g2_font_logisoso32_tf);
    }
    int bw = u8g2.getUTF8Width(buf);
    u8g2.drawUTF8(max(0, (128 - bw) / 2), 20, buf);

    // 底部状态
    u8g2.setFont(u8g2_font_wqy12_t_gb2312);
    u8g2.drawUTF8(2, 58, tstate == ST_PAUSED ? "已暂停 (OK继续 / 结束停止)" : "计时中 (OK暂停 / 结束停止)");
  }
  u8g2.sendBuffer();
}

/** 按键边沿检测：按下并松开返回 true（含消抖） */
bool buttonPressed(int pin) {
  if (digitalRead(pin) == LOW) {
    delay(30);
    if (digitalRead(pin) == LOW) {
      while (digitalRead(pin) == LOW) { delay(10); }
      return true;
    }
  }
  return false;
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_UP_BTN, INPUT_PULLUP);
  pinMode(PIN_DOWN_BTN, INPUT_PULLUP);
  pinMode(PIN_OK_BTN, INPUT_PULLUP);
  pinMode(PIN_START_BTN, INPUT_PULLUP);
  pinMode(PIN_STOP_BTN, INPUT_PULLUP);

  // 无源蜂鸣器：LEDC PWM 配置
  ledcInitBuzzer();

  // OLED（U8g2 中文字库）
  u8g2.begin();
  u8g2.setFont(u8g2_font_wqy12_t_gb2312);
  u8g2.setFontPosTop();
  renderScreen();

  // BLE 初始化
  BLEDevice::init("DiveDeep");
  BLEServer *server = BLEDevice::createServer();
  server->setCallbacks(new MyServerCallbacks());

  BLEService *svc = server->createService(SERVICE_UUID);
  stateChar = svc->createCharacteristic(
      CHAR_STATE_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  // 必须显式添加 CCCD（客户端特征配置描述符 0x2902），否则 Android 订阅失败
  stateChar->addDescriptor(new BLE2902());
  stateChar->setCallbacks(new StateCallbacks());

  subjChar = svc->createCharacteristic(
      CHAR_SUBJECT_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  subjChar->addDescriptor(new BLE2902());

  cmdChar = svc->createCharacteristic(
      CHAR_CMD_UUID,
      BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR);
  cmdChar->setCallbacks(new CmdCallbacks());
  svc->start();

  // 广播，便于手机扫描
  BLEAdvertising *ad = server->getAdvertising();
  ad->addServiceUUID(SERVICE_UUID);
  ad->setScanResponse(true);
  ad->setMinPreferred(0x06);
  ad->setMaxPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("DiveDeep BLE ready (v2.0 5-key)");
}

void loop() {
  // ▲ 上翻
  if (buttonPressed(PIN_UP_BTN)) {
    if (tstate == ST_MENU && subjectCount > 0) {
      cursor = (cursor - 1 + subjectCount) % subjectCount;
      beep(600, 40);
      renderScreen();
    }
  }
  // ▼ 下翻
  if (buttonPressed(PIN_DOWN_BTN)) {
    if (tstate == ST_MENU && subjectCount > 0) {
      cursor = (cursor + 1) % subjectCount;
      beep(600, 40);
      renderScreen();
    }
  }
  // OK：菜单=确认选中；计时中=暂停/继续
  if (buttonPressed(PIN_OK_BTN)) {
    if (tstate == ST_MENU) {
      if (subjectCount > 0) {
        notifySubject(subjects[cursor]);
        beep(1200, 100);
        renderScreen();
      }
    } else if (tstate == ST_RUNNING) {
      pausedAtMs = millis();
      tstate = ST_PAUSED;
      notifyState('2');
      beep(900, 80);
      renderScreen();
    } else if (tstate == ST_PAUSED) {
      pauseAccumMs += millis() - pausedAtMs;
      tstate = ST_RUNNING;
      notifyState('3');
      beep(1200, 80);
      renderScreen();
    }
  }
  // 开始：用当前高亮科目直接开始计时
  if (buttonPressed(PIN_START_BTN)) {
    if (tstate == ST_MENU && subjectCount > 0) {
      notifySubject(subjects[cursor]);
      startMs = millis();
      pauseAccumMs = 0;
      tstate = ST_RUNNING;
      notifyState('1');
      beep(1500, 120);
      renderScreen();
    }
  }
  // 结束：停止并通知 App（无论本机是否在计时，App 端自己判断）
  if (buttonPressed(PIN_STOP_BTN)) {
    bool wasRunning = (tstate == ST_RUNNING);
    tstate = ST_MENU;
    pauseAccumMs = 0;
    notifyState('0');
    if (wasRunning) {
      beep(2000, 160);
      beep(2000, 160);
    }
    renderScreen();
  }

  // 计时中每秒刷新 OLED
  if ((tstate == ST_RUNNING || tstate == ST_PAUSED) && millis() - lastTickMs >= 1000) {
    lastTickMs = millis();
    renderScreen();
  }

  // 广播保活：未连接时每 2 秒重启一次广播
  if (!deviceConnected && millis() - lastAdKeepMs >= 2000) {
    lastAdKeepMs = millis();
    BLEDevice::startAdvertising();
  }

  // 连接状态心跳
  static unsigned long lastStateLogMs = 0;
  if (millis() - lastStateLogMs >= 2000) {
    lastStateLogMs = millis();
    Serial.println(deviceConnected ? "[BLE] 手机已连接" : "[BLE] 未连接");
  }

  delay(20);
}
