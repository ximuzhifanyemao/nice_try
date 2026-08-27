/**
 * ESP32 蓝牙最小测试固件
 *
 * 用途：排查「手机扫不到 / 连不上 DiveDeep 计时器」问题到底在硬件还是软件。
 * 本固件不带 OLED、按键、蜂鸣器，只做最简单的 BLE 广播 + 一个测试服务，
 * 用于判断 ESP32 芯片的蓝牙功能本身是否正常。
 *
 * 烧录与测试步骤：
 * 1. Arduino IDE 打开本文件烧录（会覆盖原计时器固件，原固件在
 *    hardware/esp32_timer/esp32_timer.ino，之后可回刷）
 * 2. 打开手机系统蓝牙，或装 nRF Connect / 任意 BLE 扫描工具
 * 3. 观察结果：
 *    - 能扫到 DiveDeepTest 并连接 → 蓝牙硬件正常，问题在原计时器固件或 App 端
 *    - 连本固件都扫不到 → 是硬件/供电/天线问题，与软件无关
 *
 * 接线：无需接任何外设，仅 USB（或充电头）供电即可
 */

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>

// 服务/特征 UUID 与正式固件保持一致，便于用工具直接验证
#define TEST_SERVICE_UUID "0000180f-0000-1000-8000-00805f9b34fb"
#define TEST_CHAR_UUID    "00002a19-0000-1000-8000-00805f9b34fb"

BLECharacteristic *testChar = NULL;
bool connected = false;

class TestServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *server) {
    connected = true;
    Serial.println("[BLE] 手机已连接");
  }
  void onDisconnect(BLEServer *server) {
    connected = false;
    Serial.println("[BLE] 手机已断开，重启广播");
    server->getAdvertising()->start();
  }
};

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("\n=== ESP32 BLE 最小测试固件 ===");

  BLEDevice::init("DiveDeepTest");
  BLEServer *server = BLEDevice::createServer();
  server->setCallbacks(new TestServerCallbacks());

  BLEService *svc = server->createService(TEST_SERVICE_UUID);
  testChar = svc->createCharacteristic(
      TEST_CHAR_UUID,
      BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  testChar->setValue("ok");
  svc->start();

  BLEAdvertising *ad = server->getAdvertising();
  ad->addServiceUUID(TEST_SERVICE_UUID);
  ad->start();

  Serial.println("DiveDeepTest BLE ready，请用手机蓝牙扫描");
}

void loop() {
  static unsigned long last = 0;
  if (millis() - last >= 3000) {
    last = millis();
    Serial.printf("[BLE] %s\n", connected ? "已连接" : "广播中...");
  }
  delay(10);
}
