/**
 * 简单赛车游戏 - ESP32 独立固件
 *
 * 功能：躲避下落的敌车，越久得分越高，速度越来越快。
 *       - 按钮1 (GPIO12) = 向左移动
 *       - 按钮2 (GPIO14) = 向右移动
 *       - 只左右移动，车在底部。
 *       - 撞车 = 游戏结束；再按任意键返回标题/重开。
 *
 * 音效说明：无源蜂鸣器（压电片）频率太低会推不动、发不出声（70~300Hz 基本无声），
 *       而太高（2kHz 左右）又显得尖锐。因此音效取 400~700Hz 能正常发声的频段，
 *       并用指数衰减做成短促的敲击声（「笃/咚」），既不尖锐也不刺耳。
 *       - 躲过一辆车：短促「笃」(620→450Hz)
 *       - 撞车：低沉的「咚」(480→280Hz)
 *
 * 这是独立程序，与打卡计时器固件 (esp32_timer/esp32_timer.ino) 完全分开，
 * 不会修改/影响计时器的源码。同一块板子同时只能跑一个程序：烧录本程序后
 * 计时器会被覆盖，想恢复计时器时重新烧录 esp32_timer.ino 即可。
 *
 * 接线（与计时器固件一致）：
 *   OLED(I2C)  3V3→VCC  GND→GND  GPIO21→SDA  GPIO22→SCL
 *   按钮1(左)   一端接 GPIO12，另一端接 GND（INPUT_PULLUP，按下为 LOW）
 *   按钮2(右)   一端接 GPIO14，另一端接 GND（INPUT_PULLUP，按下为 LOW）
 *   蜂鸣器(无源) 正极→GPIO13 + 负极→GND（3 脚模块则 I/O→GPIO13）
 *
 * 依赖库（Arduino IDE -> 库管理器安装）：
 *   - ESP32 Board Package
 *   - Adafruit SSD1306
 *   - Adafruit GFX（SSD1306 依赖）
 */

#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_GFX.h>

/* ── 引脚 ── */
#define PIN_BTN1   12   // 左
#define PIN_BTN2   14   // 右
#define PIN_BUZZER 13

/* ── 蜂鸣器（无源）LEDC，兼容 ESP32 core 2.x / 3.x ── */
#define BEEP_CHANNEL 0
#define BEEP_RES     8
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  #define LEDC_HANDLE PIN_BUZZER
#else
  #define LEDC_HANDLE BEEP_CHANNEL
#endif

void ledcBuzzerInit() {
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcAttach(PIN_BUZZER, 500, BEEP_RES);
  ledcWrite(PIN_BUZZER, 0);
#else
  ledcSetup(BEEP_CHANNEL, 500, BEEP_RES);
  ledcAttachPin(PIN_BUZZER, BEEP_CHANNEL);
  ledcWrite(BEEP_CHANNEL, 0);
#endif
}
void ledcBuzzerFreq(uint16_t freq) {
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcChangeFrequency(PIN_BUZZER, freq, BEEP_RES);
#else
  ledcChangeFrequency(BEEP_CHANNEL, freq, BEEP_RES);
#endif
}
void ledcBuzzerWrite(uint32_t duty) {
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcWrite(PIN_BUZZER, duty);
#else
  ledcWrite(BEEP_CHANNEL, duty);
#endif
}

/* ── OLED：SSD1306 128x64，硬件 I2C ── */
#define SCREEN_WIDTH  128
#define SCREEN_HEIGHT 64
#define OLED_ADDR     0x3C
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

/* ── 游戏状态 ── */
enum GameState { GS_TITLE, GS_PLAY, GS_OVER };
GameState gState = GS_TITLE;

/* ── 玩家车（只左右移动） ── */
#define PLAYER_W  12
#define PLAYER_H  9
#define PLAYER_Y  52
int gPx = 58;   // 玩家左上角 x

/* ── 敌车 ── */
#define MAX_ENEMY 3
int  gEx[MAX_ENEMY];
int  gEy[MAX_ENEMY];
bool gActive[MAX_ENEMY];
int  gEnemySpeed = 2;        // 像素/帧
unsigned long gScore = 0;

/* ── 帧 / 生成节奏 ── */
#define FRAME_MS 35
unsigned long gLastFrameMs = 0;
unsigned long gLastSpawnMs = 0;

/* ── 音效：无源蜂鸣器能发声的频段 + 指数衰减敲击感 ── */
void playTone(float fStart, float fEnd, unsigned long dur, uint32_t dutyPeak) {
  unsigned long t0 = millis();
  while (millis() - t0 < dur) {
    float prog = (float)(millis() - t0) / dur;
    float freq = fStart + (fEnd - fStart) * prog;
    float amp  = expf(-4.5f * prog);           // 指数衰减：短促、像敲击、不刺耳
    ledcBuzzerFreq((uint16_t)freq);
    ledcBuzzerWrite((uint32_t)(dutyPeak * amp)); // 满占空 128
    delay(3);
  }
  ledcBuzzerWrite(0);
}
void sndStart() { playTone(520, 880, 140, 120); }  // 开局：上扬「哔」
void sndScore() { playTone(620, 450, 90, 115); }   // 躲过：短促「笃」
void sndCrash() { playTone(480, 280, 260, 120); }  // 撞车：低沉「咚」

/* ── 画面：标题 ── */
void renderTitle() {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(2);
  display.setCursor(34, 6);  display.print("CAR");
  display.setCursor(42, 22); display.print("RACE");
  display.setTextSize(1);
  display.setCursor(4, 42);  display.print("BTN1 LEFT  BTN2 RIGHT");
  display.setCursor(20, 54); display.print("PRESS ANY TO START");
  display.display();
}

/* ── 画面：游戏进行中 ── */
void renderGame() {
  display.clearDisplay();
  // 顶栏分数
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.print("S:");
  display.print(gScore);
  // 左右路沿
  display.drawFastVLine(0, 8, SCREEN_HEIGHT - 8, SSD1306_WHITE);
  display.drawFastVLine(SCREEN_WIDTH - 1, 8, SCREEN_HEIGHT - 8, SSD1306_WHITE);
  // 玩家车（车身 + 车顶）
  display.fillRect(gPx, PLAYER_Y, PLAYER_W, PLAYER_H, SSD1306_WHITE);
  display.fillRect(gPx + 3, PLAYER_Y - 4, 6, 4, SSD1306_WHITE);
  // 敌车
  for (int i = 0; i < MAX_ENEMY; i++) {
    if (gActive[i]) {
      display.fillRect(gEx[i], gEy[i], PLAYER_W, PLAYER_H, SSD1306_WHITE);
      display.fillRect(gEx[i] + 3, gEy[i] + PLAYER_H - 4, 6, 4, SSD1306_BLACK);
    }
  }
  display.display();
}

/* ── 画面：游戏结束 ── */
void renderOver() {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(2);
  display.setCursor(10, 10); display.print("GAME OVER");
  display.setTextSize(1);
  display.setCursor(30, 34); display.print("SCORE:");
  display.setCursor(30, 44); display.print(gScore);
  display.setCursor(12, 56); display.print("PRESS ANY TO EXIT");
  display.display();
}

void render() {
  if (gState == GS_TITLE) renderTitle();
  else if (gState == GS_PLAY) renderGame();
  else renderOver();
}

/* ── 重开一局 ── */
void resetGame() {
  gPx = 58;
  gScore = 0;
  gEnemySpeed = 2;
  for (int i = 0; i < MAX_ENEMY; i++) {
    gActive[i] = false;
    gEx[i] = 0;
    gEy[i] = 0;
  }
  gLastFrameMs = millis();
  gLastSpawnMs = millis();
}

/* ── 按键消抖 + 边沿触发：按下并松开返回 true ── */
bool debouncedPressed(uint8_t pin) {
  if (digitalRead(pin) == LOW) {
    delay(30);
    if (digitalRead(pin) == LOW) {
      while (digitalRead(pin) == LOW) { delay(10); }  // 等待松开
      return true;
    }
  }
  return false;
}

/* ── 更新一帧：移动 / 生成 / 碰撞 ── */
void updateGame() {
  // 1. 玩家左右移动（按住持续移动，只左右）
  if (digitalRead(PIN_BTN1) == LOW && gPx > 2)         gPx -= 4;
  if (digitalRead(PIN_BTN2) == LOW && gPx < SCREEN_WIDTH - PLAYER_W - 2) gPx += 4;

  // 2. 敌车下落 + 躲过得分
  for (int i = 0; i < MAX_ENEMY; i++) {
    if (!gActive[i]) continue;
    gEy[i] += gEnemySpeed;
    if (gEy[i] > SCREEN_HEIGHT) {          // 完全移出底部 = 躲过
      gActive[i] = false;
      gScore++;
      sndScore();
    }
  }

  // 3. 碰撞检测
  for (int i = 0; i < MAX_ENEMY; i++) {
    if (!gActive[i]) continue;
    if (gEx[i] < gPx + PLAYER_W && gEx[i] + PLAYER_W > gPx &&
        gEy[i] < PLAYER_Y + PLAYER_H && gEy[i] + PLAYER_H > PLAYER_Y) {
      gState = GS_OVER;
      sndCrash();
      render();
      return;
    }
  }

  // 4. 生成新敌车（间隔随分数变短）
  unsigned long interval = 700 - gScore * 8;
  if (interval < 320) interval = 320;
  if (millis() - gLastSpawnMs >= interval) {
    gLastSpawnMs = millis();
    for (int i = 0; i < MAX_ENEMY; i++) {
      if (!gActive[i]) {
        gActive[i] = true;
        gEy[i] = -PLAYER_H;
        gEx[i] = 4 + random(0, SCREEN_WIDTH - PLAYER_W - 8);
        break;
      }
    }
  }

  // 5. 难度递增
  gEnemySpeed = 2 + gScore / 5;
  if (gEnemySpeed > 7) gEnemySpeed = 7;
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_BTN1, INPUT_PULLUP);
  pinMode(PIN_BTN2, INPUT_PULLUP);
  ledcBuzzerInit();

  randomSeed(micros());

  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    Serial.println("OLED init failed");
  }
  display.clearDisplay();
  renderTitle();
  Serial.println("CAR RACE ready (BTN1=left, BTN2=right)");
}

void loop() {
  switch (gState) {
    case GS_TITLE:
      if (debouncedPressed(PIN_BTN1) || debouncedPressed(PIN_BTN2)) {
        resetGame();
        gState = GS_PLAY;
        sndStart();      // 开局提示音，方便确认蜂鸣器正常
        render();
      }
      break;

    case GS_PLAY:
      if (millis() - gLastFrameMs >= FRAME_MS) {
        gLastFrameMs = millis();
        updateGame();
        if (gState == GS_PLAY) render();
      }
      break;

    case GS_OVER:
      if (debouncedPressed(PIN_BTN1) || debouncedPressed(PIN_BTN2)) {
        gState = GS_TITLE;
        render();
      }
      break;
  }
  delay(5);
}
