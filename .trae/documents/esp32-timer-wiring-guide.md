# 硬件到位：ESP32 计时器「接线 + 烧录 + 连通 App」方案

## 一、摘要

你买的 ESP32 硬件已到手。项目**软件侧早已全部就绪**，无需再写代码，你只需要把硬件**接线、烧录固件**，再让手机 App 通过蓝牙连上它即可实现「硬件按键 → App 记时 → 云端落库」的闭环。

数据流：ESP32 按下 **开始/结束** 键 → BLE GATT 发送 `'1'/'0'` → 手机 App（`src/lib/bleTimer.ts`）收到 → `StudyTimer` 触发开始/停止 → 学习时长写入 Supabase `daily_logs` 表。

## 二、现状分析（软件已就绪）

| 位置 | 内容 | 状态 |
|---|---|---|
| `hardware/esp32_timer/esp32_timer.ino` | ESP32 固件（BLE 通知 + OLED + 双按键 + 蜂鸣器） | ✅ 已写好 |
| `hardware/ESP32_FLASH_GUIDE.md` | Arduino IDE 装库与烧录指南 | ✅ 已写好 |
| `hardware/SHOPPING_LIST.md` | 购机清单 | ✅ 已写好 |
| `src/lib/bleTimer.ts` | App 侧 BLE 扫描/连接/监听 | ✅ 已写好 |
| `src/components/StudyTimer.tsx` | 原生端自动连接硬件、收到 `'0'` 触发 handleStop | ✅ 已好接 |

约定协议（固件与 App 一致，二者需保持一致）：
- BLE 服务 `0000180f-0000-1000-8000-00805f9b34fb`，状态特征 `2a19`
- notify 值 `'1'` 表示开始、`'0'` 表示结束
- 设备名前缀 `KaoYan-Timer`
- 说明：硬件只发「开始/结束」事件，具体秒数由手机用 `Date.now()` 差分计算，避免两端计时漂移

## 三、关键假设与决策

- **假设你买到的是 ESP32 开发板**（ESP32 Dev Module / NodeMCU-32S / ESP32-C3 均可，C3 用 ESP32C3 Dev Module）。
  - ⚠️ 重要：当前固件依赖蓝牙（`BLEDevice`），**ESP8266 没有蓝牙，无法跑这套方案**。如果你实际买到的是 ESP8266，请停下来先告诉我——需要换固件改造（走 WiFi + 云端上报，工作量大很多），不要硬接。
- 接线引脚以固件 `esp32_timer.ino` 顶部注释为准（下表）。
- 建议用**面包板 + 杜邦线**（免焊接），验证通过后再考虑焊接。

## 四、实施步骤

### Step 0 清点硬件
确认手上有：ESP32 板、0.96 寸 OLED（I2C，SSD1306）、轻触按键 ×2、蜂鸣器、面包板、杜邦线、**能传数据的 USB 数据线**（很多充电线不能烧录）。

### Step 1 面包板物理接线（对照固件注释）

按下面这张表连线（开发板供电建议先插电脑 USB，之后再考虑锂电池）：

**OLED（I2C，SSD1306，4 针）** — 你的屏丝印是 `GND / VDD / SCK / SDA`。4 脚 OLED 几乎都是 I2C，这里的 `SCK` 即 `SCL`（时钟）的俗称，直接按 I2C 连：

| 你屏上的丝印 | 语义 | 接到 ESP32 |
|---|---|---|
| GND | 地 | GND |
| VDD | 电源(3.3V) | 3V3 |
| SCK | =SCL 时钟 | GPIO22 |
| SDA | 数据 | GPIO21 |

> 黑屏自检：先把 `.ino` 里 `OLED_ADDR 0x3C` 改 `0x3D` 重烧；只有确认屏只有 4 脚仍无显示，才可能是罕见 4 脚 SPI，届时需改 SPI 固件。

**轻触按键 ×2（一端接 GPIO，另一端接 GND）**

| 按键 | 功能 | 两个触点 |
|---|---|---|
| 按键1 | 开始 | GPIO12 ↔ GND |
| 按键2 | 结束 | GPIO14 ↔ GND |

> `INPUT_PULLUP` 已在固件开启：按键平时不按下为高电平，按下拉低触发。不用再接上拉电阻。

**蜂鸣器（接到 GPIO13）**
- 3 脚无源蜂鸣器模块：I/O（或 S/SIG）→ GPIO13，VCC/GND 分别接 3V3/GND。
- 裸无源蜂鸣器：正极 → GPIO13，负极 → GND。

> 固件用 PWM（`ledc`）驱动 GPIO13，无源蜂鸣器会有提示音。若买的是有源蜂鸣器（通电就响）也兼容，接法同上即可。

连好后**务必断电再插拔**，防止短路烧板。

### Step 2 Arduino IDE 配置
- 装 Arduino IDE 2.x（arduino.cc）。
- **File → Preferences** → 在 `Additional boards manager URLs` 填入 `https://espressif.github.io/arduino-esp32/package_esp32_index.json`。
- **Tools → Board → Boards Manager** → 搜 `esp32` → 安装 **esp32 by Espressif Systems**（约数百 MB）。
- **Tools → Manage Libraries** → 装 `Adafruit SSD1306` 与 `Adafruit GFX Library by Adafruit`（首次提示装 BusIO 也勾上）。BLE 与 PWM 是 ESP32 自带，无需装。

> 详细图文见 `hardware/ESP32_FLASH_GUIDE.md`。

### Step 3 烧录固件
1. File → Open… 打开 `hardware/esp32_timer/esp32_timer.ino`。
2. Tools → Board → 选你的板子（通用 ESP32 用 **ESP32 Dev Module**；C3 用 **ESP32C3 Dev Module**）。
3. Tools → Port → 选连电脑后出现的 COM 口（需能传数据的数据线；装好 USB 转串口驱动 CH340/CP210x）。
4. 点左上角「→」Upload，看到 `done uploading` 即成功。

### Step 4 串口自检
Tools → Serial Monitor，波特率 `115200`，复位开发板应出现：
```
KaoYan-Timer BLE ready
```
OLED 显示 `READY`；按下开始/结束键，OLED 切换计时/`STUDYING...`，结束时有两次短鸣。

### Step 5 手机 App 连接（BLE 验证）
1. 用打包好的 **Android App**（`apk/kaoyan-tracker.apk`）登录。
2. 打开「计时器」（StudyTimer）页面——原生端登录后会自动扫描并连接 `KaoYan-Timer`。
3. 若未连上，用计时页的「重新连接硬件」按钮重试（对应 `handleReconnectBle`）。

> 注意：BLE 只能在**打包的原生 Android App** 里用，网页版没有蓝牙 API，会静默跳过。

### Step 6 端到端验证（硬件 → 云端落库）
1. App 处于计时页且提示已连上硬件。
2. 按 ESP32「开始」→ 手机开始计时；按「结束」→ 手机停止并把本次学习时长记入当日打卡（Supabase `daily_logs`）。
3. 到 App「我的记录 / 日历」确认该时间片段已记录。

## 五、验证清单

- [ ] OLED 亮并显示倒计时
- [ ] 开始/结束按键边沿触发正常、蜂鸣器有提示音
- [ ] 串口输出 `KaoYan-Timer BLE ready`
- [ ] 手机 App（原生包）扫描并连上 `KaoYan-Timer`
- [ ] 硬件结束键触发 App 停止计时并写入 `daily_logs`

## 六、常见排查

| 现象 | 处理 |
|---|---|
| 电脑不识别 COM | 装 CH340/CP210x 驱动；换能烧录的数据线 |
| OLED 不显示 | 把 `.ino` 里 `OLED_ADDR 0x3C` 改成 `0x3D` 重烧 |
| 编译/免驱动报错 | 板型选错，优先 `ESP32 Dev Module` |
| App 连不上 | 确认板子通电且在无线缆干扰范围；靠近手机再试；用「重新连接硬件」按钮 |
| 按键没反应 | 检查 GPIO12/14 对 GND 接线，确认没接反、没断线 |
| 买到 ESP8266 | 该方案不适用（无蓝牙），先暂停并联系我 |

## 七、完成后

烧录成功并验证连通后，这套硬件**随时可用**；后续如需锂电池供电、外壳等增强，可参考 `hardware/SHOPPING_LIST.md` 的「可选」项。若你在接线/烧录/连接任一环节卡住，把报错信息或照片发我，我根据你的实际板型继续帮你排。