# 考研硬件计时器 - 全流程接线文档（实测版）

本文档记录从零开始把 ESP32 计时器接到面包板、烧录固件并连通手机 App 的完整过程，
以及实测踩坑后的最终结论。配套文件：

- 固件：[`hardware/esp32_timer/esp32_timer.ino`](esp32_timer/esp32_timer.ino)
- 烧录指南：[`hardware/ESP32_FLASH_GUIDE.md`](ESP32_FLASH_GUIDE.md)
- 购买清单：[`hardware/SHOPPING_LIST.md`](SHOPPING_LIST.md)

---

## 一、最终接线总览（5 键 + 蜂鸣器版）

| 外设 | 引脚 | 接 ESP32 | 说明 |
|---|---|---|---|
| OLED | GND | GND | 地 |
| OLED | VDD | 3V3 | 电源 |
| OLED | SCK（=SCL） | GPIO22 | I2C 时钟 |
| OLED | SDA | GPIO21 | I2C 数据 |
| 上翻键▲ | 一脚 | GPIO32 | 待机：上翻选科目；另一正对角脚接 GND |
| 下翻键▼ | 一脚 | GPIO33 | 待机：下翻选科目；另一正对角脚接 GND |
| 确认/暂停键 | 一脚 | GPIO25 | 待机：确认选中科目；计时中：暂停/继续；另一正对角脚接 GND |
| 开始键 | 一脚 | GPIO12 | 待机：用高亮科目开始计时；另一正对角脚接 GND |
| 结束键 | 一脚 | GPIO14 | 任意：停止并记入打卡；另一正对角脚接 GND |
| 蜂鸣器 | I/O | GPIO13 | 无源型：正极→GPIO13、负极→GND；3 脚模块：I/O→GPIO13、VCC→3V3、GND→GND |

> 引脚分配见固件顶部注释 [`esp32_timer.ino`](esp32_timer/esp32_timer.ino) 第 53–59 行。

---

## 二、关键认知（实测后最重要的话）

### 1. 消费者屏上的 "SCK" 往往就是 I2C 的 SCL
买到手的 0.96 寸 OLED 丝印是 `GND / VDD / SCK / SDA`，只有 4 个脚。
**4 脚屏几乎都是 I2C**，这里的 `SCK` 只是商家把 `SCL`（时钟）俗称为 SCK。
真正 SPI 的屏需要 6–7 个脚（还会带 CS/DC/RES），所以 4 脚屏直接按 I2C 连即可。
接好 SDA/SCK 两个 GPIO（见固件 `Wire.begin(21, 22)` 效果），屏才会亮。

### 2. SSD1306 OLED：只接 VDD+GND 不会亮
OLED 没有独立背光，需要 MCU 通过 SCL/SDA 初始化后才显示。
所以「只接供电黑屏」**不代表屏坏**，把固件烧进去、SDA/SCK 接好自然就亮了。

### 3. 按键（4 脚轻触开关）只用 2 个脚
4 脚开关内部是两对**对角**联通的。接法：任取一脚接 GPIO，
取其**正对角**的另一脚接 GND。若按了没反应，把两根线换到另一组对角即可。

### 4. BLE 连接必须走 App，别在系统蓝牙里"配对"
ESP32 是 GATT 外设，**手机系统蓝牙设置里点配对通常没反应**。
连接必须通过 App **计时页的「重新连接」按钮**（走 `connectBleTimer`）建立。

---

## 三、面包板接线规则（400 点面包板）

### 连通规则（务必记住）
- **同行同侧 5 个孔内部互相连通**：如 `3a/b/c/d/e` 全是通的。
- **同一行左右两组被中间凹槽隔开，互不相通**：`3a` 左半 ≠ `3f` 右半。
- **不同行之间不相通**。所以 `3a` 和 `30a` 跨行＝断路。
- **上下电源轨（红上/蓝下）被中间支柱切成左右两半**，左半和右半互不相通。

一句话：**同列不分、同行分左右、左右靠中槽隔开、电源轨左右分开。**

### 常用手法
- **建公共总线**：把 ESP 的 `3V3` 拉一根线到红轨（上），`GND` 拉到蓝轨（下），
  之后所有模块的 VDD/GND 都插进对应轨，一处通全通。
- **被板子挡住/满时**：信号脚可以从对应 GPIO 所在孔**叠线引出**（公-公杜邦线与排针同孔）。

### 本次实测的一套坐标（供参考）
OLED 落在 30 行 e 列一带：`GND=30e VDD=29e SCK=28e SDA=27e`，每行只占一孔，其余孔跳线。
但要提醒：**具体落点随板子而定**，请以「功能➜GPIO」的对应关系为准，不要照抄坐标。

---

## 四、烧录步骤

1. 装 **Arduino IDE 2.x**，在 Preferences 的 Board Manager URLs 加：
   ```
   https://espressif.github.io/arduino-esp32/package_esp32_index.json
   ```
2. Boards Manager 安装 **esp32 by Espressif Systems**；库管理器安装 **U8g2**
   （OLED 显示，含中文字库 `u8g2_font_wqy12_t_gb2312`，用于 OLED 中文科目菜单）。
3. 打开 [`esp32_timer.ino`](esp32_timer/esp32_timer.ino)，
   Tools→Board→**ESP32 Dev Module**（经典 ESP32）。
4. 用**能传数据**的 USB 数据线连电脑，Tools→Port 选出 CH340/CP210x 的 COM 口
   （设备管理器里 `USB-SERIAL CH340 (COMx)`），点 Upload。
5. 卡在 `Connecting....` 时，按住板子 **BOOT 键**再点 Upload，进度条动起来再松手。

**驱动注意**：Windows 有时不自动识别 CH340，需官网装 `CH341SER.EXE` 驱动，
否则设备管理器里没有 `USB-SERIAL CH340`。

---

## 五、固件兼容性修复（LEDC API 2.x / 3.x）

报错 `'ledcSetup' was not declared in this scope` 是因为装的是 **ESP32 板包 3.x 新版 core**，
而旧固件用 2.x 的 LEDC API。两者差异：
- **2.x**：`ledcSetup()` / `ledcAttachPin()` / `ledcWrite(通道, 占空比)`
- **3.x**：改成 `ledcAttach()`，且 `ledcWrite` 参数从「通道」变成「引脚」

修复方式（已改入当前固件）：用 `ESP_ARDUINO_VERSION_MAJOR` 做条件编译，
封装 `ledcInitBuzzer() / ledcBuzzerFreq() / ledcBuzzerWrite()`，两版 core 都能编译。
详见 [`esp32_timer.ino`](esp32_timer/esp32_timer.ino) 蜂鸣器初始化部分。

---

## 六、设备名统一（DiveDeep）

把 BLE 设备名从 `KaoYan-Timer` 改成 **`DiveDeep`**（与桌面版产品名一致）。
**必须两端同步改，否则 App 匹配不到设备：**

| 端 | 位置 | 改动 |
|---|---|---|
| 固件 | [`esp32_timer.ino`](esp32_timer/esp32_timer.ino) | `BLEDevice::init("DiveDeep")`，串口打印同改 |
| App | `src/lib/bleTimer.ts` | `DEVICE_NAME_PREFIX = 'DiveDeep'` |

改完两侧都要重新构建：固件重新烧录；App 重新打包 APK（见下）。

---

## 七、重新打包 APK（含新设备名）

按项目惯例，本次设备名改动升版本：`1.11.0 → 1.12.0`（`versionCode 45 → 46`），
`package.json` 与 `android/app/build.gradle` 双端同步。然后：

```powershell
npm run build:deploy        # 构建 Web（把新前缀打进包）
npx cap sync android        # 同步到 Android 工程
# 进入 android 目录
.\gradlew.bat assembleRelease
Copy-Item -Path "android\app\build\outputs\apk\release\app-release.apk" -Destination "apk\kaoyan-tracker.apk" -Force
```

新 APK 覆盖安装后，计时页点「重新连接」即可连上固件。

---

## 八、验证清单

- [ ] 串口输出 `DiveDeep BLE ready (v2.0 5-key)`（固件在跑）
- [ ] 上电 OLED 显示「选择科目」中文菜单
- [ ] 用 App 连接后，OLED 显示 App 推送的科目列表，▲▼ 翻页、OK 确认高亮项
- [ ] 按开始键开始计时：OLED 倒计时、蜂鸣器响一声、App 联动开始计时
- [ ] 计时中按 OK 键暂停/继续，App 同步「已暂停/继续」状态
- [ ] 按结束键停表且蜂鸣器响两声，App 停止计时并写入当日打卡（Supabase `daily_logs`）
- [ ] App 计时页显示「硬件计时器已连接」

---

## 九、常见问题排查

| 现象 | 处理 |
|---|---|
| 电脑不识别 COM | 装 CH340/CP210x 驱动；换能传数据的线 |
| OLED 不显示 | 确认 VDD→3V3、GND→GND、SCK→GPIO22、SDA→GPIO21；或把 I2C 地址 `0x3C` 换 `0x3D` 重烧 |
| OLED 中文乱码/方块 | 库管理器安装 **U8g2**（固件用 `u8g2_font_wqy12_t_gb2312` 中文字库）；缺库会编译失败 |
| 只接 VDD/GND 不亮 | 正常，需烧固件 + 接好 SDA/SCK 才亮 |
| 按键没反应 | 换另一组对角的两脚接线 |
| LEDC 编译报错 | 用 `ESP_ARDUINO_VERSION_MAJOR` 条件编译（见上文第五节） |
| App 连不上 | 走 App 计时页「重新连接」；确认手机蓝牙/位置权限；确认固件与 App 设备名一致 |
| 供电 | 用电脑 USB 或 5V 充电头，**别用快充大功率头直接怼 VIN/3V3** |