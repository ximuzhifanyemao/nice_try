import { BleClient } from '@capacitor-community/bluetooth-le'
import type { BleDevice } from '@capacitor-community/bluetooth-le'
import { Capacitor } from '@capacitor/core'
import { TimerForeground } from '../plugins/timer-foreground'

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
// 插件只接受 128 位 UUID 字符串（'2a19' 会被 parseUUID 拒绝）
const STATE_CHAR_UUID = '00002a19-0000-1000-8000-00805f9b34fb'
const DEVICE_NAME_PREFIX = 'DiveDeep'

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

/** 从扫描结果里匹配我们的计时器设备：设备名前缀或广播的服务 UUID 任一命中 */
function isTarget(result: { device: BleDevice; localName?: string; uuids?: string[] }): boolean {
  const name = result.localName ?? result.device.name ?? ''
  if (name.startsWith(DEVICE_NAME_PREFIX)) return true
  // 设备名在 scan response 中，部分手机（硬件过滤/被动扫描）拿不到名字，
  // 用广播包里的服务 UUID 兜底匹配
  const uuids = result.uuids ?? []
  return uuids.some((u) => u.toLowerCase() === SERVICE_UUID)
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

  // Android 12+ 必须先授予「附近设备」/ 旧版定位权限，否则扫描会静默失败。
  // 这里主动弹窗申请，避免用户手动去系统设置里找权限入口。
  try {
    const perm = await TimerForeground.requestPermissions()
    if (perm?.bluetooth === 'denied') {
      throw new Error('未获得蓝牙权限：请点击「重新连接」并允许「附近设备」/定位权限')
    }
  } catch {
    // 权限 API 可能未响应（Web/异常），继续往下走，靠扫描结果暴露问题
  }

  // 蓝牙扫描已声明 neverForLocation，无需定位权限即可扫描
  await BleClient.initialize({ androidNeverForLocation: true })
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
      // 不用 services/name 做原生过滤：设备名在 scan response 里，
      // 部分手机按服务 UUID 硬件过滤后拿不到名字/不回调，改为收全量广播由 isTarget 匹配。
      // allowDuplicates: true 保证同一设备后续广播（带 scan response 名字/UUID）也能触发回调。
      { allowDuplicates: true },
      (result) => {
        if (found || !isTarget(result)) return
        found = result.device
        cleanup()
        BleClient.stopLEScan().finally(() => resolve(found as BleDevice))
      }
    ).catch((err) => {
      cleanup()
      reject(err instanceof Error ? err : new Error(String(err)))
    })

    scanTimer = setTimeout(() => {
      cleanup()
      BleClient.stopLEScan().catch(() => undefined)
      reject(
        new Error(
          '未找到计时器设备，请确认设备已开机且靠近手机；若手机系统蓝牙中已配对该设备，请先取消配对（被占用时设备会停止广播）'
        )
      )
    }, SCAN_TIMEOUT_MS)
  })
}

/** 断开连接 */
export async function disconnectBleTimer(): Promise<void> {
  if (scanTimer) {
    clearTimeout(scanTimer)
    scanTimer = null
    // 还在扫描时退出页面：停掉扫描，避免后台持续耗电
    BleClient.stopLEScan().catch(() => undefined)
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