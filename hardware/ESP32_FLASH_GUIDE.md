# ESP32 计时器 - 依赖库与烧录指南

配套 `hardware/esp32_timer/esp32_timer.ino`。本文用 Arduino IDE 2.x 说明。

## 一、需要安装的依赖

| 库 | 用途 | 安装方式（库管理器） |
|---|---|---|
| **ESP32 Board Package** | 选型开发板、编译/上传固件 | 不是库，是「开发板管理器」包，见下 |
| **Adafruit SSD1306** | 驱动 0.96 寸 OLED | 库管理器搜 `Adafruit SSD1306` |
| **Adafruit GFX** | SSD1306 的图形底层依赖 | 库管理器搜 `Adafruit GFX Library by Adafruit` |

> BLE（`BLEDevice`）与 PWM（`ledc*`）都是 ESP32 核心自带，**无需**额外安装库。

## 二、Arduino IDE 一次性配置

### 1. 安装 Arduino IDE 2.x
下载：[arduino.cc](https://www.arduino.cc/en/software)，Windows 装 exe 版即可。

### 2. 添加 ESP32 开发板包
1. 菜单 **File → Preferences**（Windows 为 Edit → Preferences）。
2. 「Additional boards manager URLs」填入：
   ```
   https://espressif.github.io/arduino-esp32/package_esp32_index.json
   ```
3. 打开 **Tools → Board → Boards Manager**，搜索 `esp32`，安装 **esp32 by Espressif Systems**（约数百 MB，需联网下载）。

### 3. 安装 OLED 依赖库
菜单 **Tools → Manage Libraries**（库管理器）：
- 搜 `Adafruit SSD1306` → 安装 **Adafruit SSD1306**。
- 搜 `Adafruit GFX` → 安装 **Adafruit GFX Library by Adafruit**。

> 首次提示安装依赖时，勾选 Adafruit BusIO / Adafruit GFX 一并安装。

## 三、装载并烧录

1. **打开工程**：File → Open… 选择 `hardware/esp32_timer/esp32_timer.ino`（文件夹内含同名 .ino）。
2. **选开发板**：Tools → Board → esp32 → 根据你买的型号选择，例如：
   - NodeMCU-32S / 通用 ESP32 DevKitC → **ESP32 Dev Module**（通用 ESP32 都可用它）
   - ESP32-C3 → **ESP32C3 Dev Module**
3. **选择端口**：Tools → Port，用 Type-C / Micro-USB 数据线连接电脑后，选择出现的 COM 端口。
   > 必须是**能传数据**的线，很多充电线只能供电、不能烧录。
4. **烧录**：点左上角「→」箭头（Upload）。
   - 首次会在底部开始下载工具链，稍等。
   - 上传结束看到 `Connecting....` 后串口输出 `done uploading` 即成功。

## 四、烧录前自检

| 检查项 | 说明 |
|---|---|
| 驱动 | Windows 未识别 COM 时，ESP32 多为 CH340/CP210x 驱动，需手动安装 |
| OLED 地址 | 不显示时，把 .ino 里 `OLED_ADDR 0x3C` 改 `0x3D` 重试 |
| 板子选错 | 选错型号会编译报错或免驱动类型不同，优先用 ESP32 Dev Module |
| 数据线 | 换一根号称"支持数据传输"的线再试 |

## 五、完成后验证

- 打开 **Tools → Serial Monitor**，波特率选 `115200`，复位开发板应看到：
  ```
  KaoYan-Timer BLE ready
  ```
- OLED 显示倒计时；按开始/结束键，蜂鸣器短鸣两次；手机 App 能扫描到 `KaoYan-Timer` 并同步计时。
```