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

/**
 * 扫描目标设备。优先按名字/UUID 命中；若广播缺名字（固件把名字放 scan response，
 * Android 常拿不到，扫描结果里显示为「无名称」），则退而逐个连接候选设备，
 * 通过读取服务列表校验 SERVICE_UUID 来认领计时器。
 */
async function scanForDevice(): Promise<BleDevice> {
  // 1) 扫描收集候选设备
  const candidates: BleDevice[] = []
  const seenIds = new Set<string>()
  const namedHits: BleDevice[] = []

  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      if (scanTimer) {
        clearTimeout(scanTimer)
        scanTimer = null
      }
    }
    BleClient.requestLEScan({ allowDuplicates: true }, (result) => {
      const id = result.device.deviceId
      if (!seenIds.has(id)) {
        seenIds.add(id)
        candidates.push(result.device)
      }
      if (isTarget(result)) namedHits.push(result.device)
    }).catch((err) => {
      cleanup()
      reject(err instanceof Error ? err : new Error(String(err)))
    })

    scanTimer = setTimeout(() => {
      cleanup()
      BleClient.stopLEScan().catch(() => undefined)
      resolve()
    }, SCAN_TIMEOUT_MS)
  })

  // 2) 名字/UUID 命中最优先
  if (namedHits.length > 0) return namedHits[0]

  // 3) 兜底：广播缺名字时，逐个连接候选校验服务 UUID。
  //    为少走弯路，优先探测目标设备最可能的候选（无名字 + Espressif 厂商 MAC）。
  const ordered = [...candidates].sort((a, b) => {
    const ax = rankCandidate(a)
    const bx = rankCandidate(b)
    return bx - ax
  })
  for (const c of ordered) {
    if (await probeHasOurService(c.deviceId)) return c
  }

  const seenText = seenIds.size
    ? [...seenIds].map((id) => id).slice(0, 12).join('、')
    : '（未扫描到任何设备，手机可能没看到任何 BLE 设备）'
  throw new Error(
    `未找到 DiveDeep 计时器设备。10 秒内扫描到的设备：${seenText}。请确认计时器已上电靠近手机；若系统蓝牙已配对该设备请先取消配对`
  )
}

// Espressif（ESP32 生产商）常见 MAC OUI 前缀，用于兜底命中的优先排序
const ESPRESSIF_OUIS = [
  '00:04:EA', '24:0A:C4', '84:CC:A8', '30:AE:A4', '34:85:18',
  '3C:A9:F4', '7C:9E:BD', '8C:AA:B5', 'AC:D0:74', 'B4:E6:2D',
  'CC:50:E3', 'DC:4F:22', 'E0:98:06', 'F4:CF:A2',
]

/** 候选优先级打分：无名字或 Espressif MAC 的设备更可能是计时器（0-3 分） */
function rankCandidate(device: BleDevice): number {
  let score = 0
  const oui = device.deviceId.slice(0, 8).toUpperCase()
  const isEspressif = ESPRESSIF_OUIS.some((o) => o === oui)
  if (!device.name) score += 2
  if (isEspressif) score += 2
  return score
}

/** 连接候选设备并校验是否含本计时器的 SERVICE_UUID。命中返回 true，并断开交回主流程重连 */
async function probeHasOurService(deviceId: string): Promise<boolean> {
  try {
    await BleClient.connect(deviceId, () => undefined, { timeout: 4000 })
    await BleClient.discoverServices(deviceId)
    const services = await BleClient.getServices(deviceId)
    const hit = services.some((s) => s.uuid.toLowerCase() === SERVICE_UUID)
    await BleClient.disconnect(deviceId).catch(() => undefined)
    return hit
  } catch {
    try {
      await BleClient.disconnect(deviceId).catch(() => undefined)
    } catch {
      /* 忽略 */
    }
    return false
  }
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