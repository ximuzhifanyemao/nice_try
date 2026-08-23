import { BleClient } from '@capacitor-community/bluetooth-le'
import type { BleDevice } from '@capacitor-community/bluetooth-le'
import { Capacitor } from '@capacitor/core'

/**
 * 考研打卡计时器 - App 侧 BLE 工具
 *
 * 连接 ESP32 计时器，监听 GATT 状态特征的通知：
 *   - 收到 '1'：计时开始
 *   - 收到 '0'：计时结束（由调用方走已有 handleStop 逻辑）
 *
 * UUID 需与硬件固件 hardware/esp32_timer/esp32_timer.ino 保持一致。
 */

const SERVICE_UUID = '0000180f-0000-1000-8000-00805f9b34fb'
const STATE_CHAR_UUID = '2a19'
const DEVICE_NAME_PREFIX = 'KaoYan-Timer'

const SCAN_TIMEOUT_MS = 10000

export interface BleTimerEvents {
  /** 计时器开始 */
  onStart?: () => void
  /** 计时器结束 */
  onStop?: () => void
  /** 设备断开 */
  onDisconnect?: (deviceId: string) => void
}

let connectedDeviceId: string | null = null
let scanTimer: ReturnType<typeof setTimeout> | null = null
let handlers: BleTimerEvents = {}

/** 注册/更新事件处理（可多次调用，以最新传入为准） */
export function setBleTimerHandlers(next: BleTimerEvents): void {
  handlers = { ...handlers, ...next }
}

/** 当前是否已连接计时器 */
export function isBleTimerConnected(): boolean {
  return connectedDeviceId !== null
}

/** 从扫描结果里匹配我们的计时器设备 */
function isTarget(result: { device: BleDevice; localName?: string }): boolean {
  const name = result.localName ?? result.device.name ?? ''
  return name.startsWith(DEVICE_NAME_PREFIX)
}

/**
 * 扫描并连接计时器设备，成功后监听状态特征并开始轮询通知。
 * 只应在原生 App（Capacitor）里调用，Web 浏览器没有蓝牙 API。
 */
export async function connectBleTimer(events?: BleTimerEvents): Promise<string> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('蓝牙仅支持原生 App，请用 Android 打包后测试')
  }
  if (events) handlers = { ...handlers, ...events }
  if (connectedDeviceId) return connectedDeviceId

  await BleClient.initialize()
  const device = await scanForDevice()

  // 连接，并注册断线回调
  await BleClient.connect(device.deviceId, (id) => {
    connectedDeviceId = null
    handlers.onDisconnect?.(id)
  })

  // 订阅状态特征变化：'1' 开始 / '0' 结束
  await BleClient.startNotifications(
    device.deviceId,
    SERVICE_UUID,
    STATE_CHAR_UUID,
    (value) => {
      let ch = ''
      try {
        ch = String.fromCharCode(value.getUint8(0))
      } catch {
        return
      }
      if (ch === '1') handlers.onStart?.()
      else if (ch === '0') handlers.onStop?.()
    }
  )

  connectedDeviceId = device.deviceId
  return device.deviceId
}

/** 扫描目标设备（按设备名前缀匹配），超时后抛出 */
async function scanForDevice(): Promise<BleDevice> {
  return new Promise<BleDevice>((resolve, reject) => {
    let found: BleDevice | null = null

    const cleanup = () => {
      if (scanTimer) {
        clearTimeout(scanTimer)
        scanTimer = null
      }
    }

    BleClient.requestLEScan(
      { services: [SERVICE_UUID], allowDuplicates: false },
      (result) => {
        if (found || !isTarget(result)) return
        found = result.device
        cleanup()
        BleClient.stopLEScan().finally(() => resolve(found as BleDevice))
      }
    ).catch(reject)

    scanTimer = setTimeout(() => {
      cleanup()
      BleClient.stopLEScan().catch(() => undefined)
      reject(new Error('未找到计时器设备，请确认已开机且靠近手机'))
    }, SCAN_TIMEOUT_MS)
  })
}

/** 断开连接 */
export async function disconnectBleTimer(): Promise<void> {
  if (scanTimer) {
    clearTimeout(scanTimer)
    scanTimer = null
  }
  if (connectedDeviceId) {
    const id = connectedDeviceId
    connectedDeviceId = null
    try {
      await BleClient.disconnect(id)
    } catch {
      /* 忽略断开异常 */
    }
  }
}