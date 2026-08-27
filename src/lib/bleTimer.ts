import { BleClient } from '@capacitor-community/bluetooth-le'
import type { BleDevice, ScanMode } from '@capacitor-community/bluetooth-le'
import { Capacitor } from '@capacitor/core'
import { TimerForeground } from '../plugins/timer-foreground'

/**
 * 考研打卡计时器 - App 侧 BLE 工具
 *
 * 连接 ESP32 计时器（v2.0 五键版），监听 GATT 状态/科目特征的通知：
 *   stateChar  '1' 开始 / '0' 结束 / '2' 暂停 / '3' 继续
 *   subjChar   'SEL:<科目名>' 硬件上选中的科目
 * 并向设备推送科目列表（cmdChar Write：'C'/'S:..'/'E'）。
 *
 * UUID 需与硬件固件 hardware/esp32_timer/esp32_timer.ino 保持一致。
 */

const SERVICE_UUID = '0000180f-0000-1000-8000-00805f9b34fb'
// 插件只接受 128 位 UUID 字符串（'2a19' 会被 parseUUID 拒绝）
const STATE_CHAR_UUID = '00002a19-0000-1000-8000-00805f9b34fb'
const SUBJECT_CHAR_UUID = '00002a1f-0000-1000-8000-00805f9b34fb'
const CMD_CHAR_UUID = '00002a1d-0000-1000-8000-00805f9b34fb'
const DEVICE_NAME_PREFIX = 'DiveDeep'

const SCAN_TIMEOUT_MS = 10000
/** 固件 MAX_NAME_LEN = 24 字节，中文按 3 字节/字，最多 8 个汉字 */
const MAX_SUBJECT_NAME_LEN = 8

export interface BleTimerEvents {
  /** 计时器开始 */
  onStart?: () => void
  /** 计时器结束 */
  onStop?: () => void
  /** 计时器暂停 */
  onPause?: () => void
  /** 计时器继续 */
  onResume?: () => void
  /** 硬件上选中了某个科目（固件发送 'SEL:<科目名>'） */
  onSubjectSelected?: (subjectName: string) => void
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
 * 扫描并连接计时器设备，成功后监听状态/科目特征并开始轮询通知。
 * 只应在原生 App（Capacitor）里调用，Web 浏览器没有蓝牙 API。
 */
export async function connectBleTimer(events?: BleTimerEvents): Promise<string> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('蓝牙仅支持原生 App，请用 Android 打包后测试')
  }
  if (events) handlers = { ...handlers, ...events }
  if (connectedDeviceId) return connectedDeviceId

  // Android 12+ 必须先授予「附近设备」/ 旧版定位权限，否则扫描会静默失败。
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
  const onDisconnectCb = (id: string) => {
    connectedDeviceId = null
    handlers.onDisconnect?.(id)
  }
  await BleClient.connect(device.deviceId, onDisconnectCb)

  // 订阅状态特征（'1'开始/'0'结束/'2'暂停/'3'继续）与科目特征（'SEL:..'）。
  // Android BLE 首次订阅偶发失败（"Setting notification failed"），
  // 失败时断开重连清掉残留 GATT 状态后再订阅，最多重试 3 次
  const subscribeAll = async () => {
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
        else if (ch === '2') handlers.onPause?.()
        else if (ch === '3') handlers.onResume?.()
      }
    )
    await BleClient.startNotifications(
      device.deviceId,
      SERVICE_UUID,
      SUBJECT_CHAR_UUID,
      (value) => {
        try {
          const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
          let s = ''
          for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
          if (s.startsWith('SEL:')) handlers.onSubjectSelected?.(s.slice(4))
        } catch {
          /* 忽略解析失败 */
        }
      }
    )
  }

  const MAX_SUBSCRIBE_ATTEMPTS = 3
  for (let attempt = 1; ; attempt++) {
    try {
      await subscribeAll()
      break
    } catch (err) {
      if (attempt >= MAX_SUBSCRIBE_ATTEMPTS) throw err
      // 断开重连后再试，清掉可能残留的 GATT 状态
      try {
        await BleClient.disconnect(device.deviceId)
      } catch {
        /* 忽略断开异常 */
      }
      await BleClient.connect(device.deviceId, onDisconnectCb)
    }
  }

  connectedDeviceId = device.deviceId
  return device.deviceId
}

/**
 * 向计时器推送科目列表（供 OLED 菜单显示）。
 * 协议：'C' 清空 → 'S:<科目名>' 逐条追加 → 'E' 结束。
 * 单条名称限制在 8 个汉字内（固件 MAX_NAME_LEN=24 字节），避免超出默认 MTU。
 */
export async function pushSubjects(subjects: string[]): Promise<void> {
  if (!connectedDeviceId) return
  const enc = new TextEncoder()
  const write = async (s: string) => {
    if (!connectedDeviceId) return
    const data = enc.encode(s)
    await BleClient.write(connectedDeviceId, SERVICE_UUID, CMD_CHAR_UUID, new DataView(data.buffer, data.byteOffset, data.byteLength))
  }
  try {
    await write('C')
    for (const name of subjects) {
      if (!name) continue
      // 中文按码点截断到 8 字，避免超 MTU 或固件缓冲区
      const limited = [...name].slice(0, MAX_SUBJECT_NAME_LEN).join('')
      await write('S:' + limited)
    }
    await write('E')
  } catch {
    /* 推送失败不影响已连接的计时/结束功能 */
  }
}

/**
 * 扫描目标设备。按以下层次兜底，直到命中计时器：
 *   1) 普通 10 秒扫描（LOW_LATENCY 模式），按名字/UUID 命中
 *   2) 兜底探测：对扫描到的候选逐个连接，读取服务列表校验 SERVICE_UUID 认领
 *   3) 兜底：检查系统已配对（bonded）设备，按名字前缀命中并探测
 *   4) 终极兜底：BleClient.requestDevice 调系统原生「选择设备」弹窗
 */
async function scanForDevice(): Promise<BleDevice> {
  // 1) 扫描收集候选设备（LOW_LATENCY 扫描，更稳定拿到广播里的名字/uuid）
  const candidates: BleDevice[] = []
  const seenIds = new Set<string>()
  const seenDisplay = new Map<string, string>()
  const namedHits: BleDevice[] = []

  const formatDevice = (r: { device: BleDevice; localName?: string }): string => {
    const id = r.device.deviceId
    const name = r.localName || r.device.name
    const oui = id.slice(0, 8).toUpperCase()
    const esp = ESPRESSIF_OUIS.some((o) => o === oui) ? ' 🟡ESP32' : ''
    return name ? `${name}(${id})${esp}` : `<无名称>${id}${esp}`
  }

  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      if (scanTimer) {
        clearTimeout(scanTimer)
        scanTimer = null
      }
    }
    // SCAN_MODE_LOW_LATENCY = 2：最高频率报告，更容易命中 scan response 里的名字
    BleClient.requestLEScan(
      { allowDuplicates: true, scanMode: 2 as ScanMode },
      (result) => {
        const id = result.device.deviceId
        if (!seenIds.has(id)) {
          seenIds.add(id)
          candidates.push(result.device)
          seenDisplay.set(id, formatDevice(result))
        } else {
          const prev = seenDisplay.get(id) || ''
          const hadName = prev && !prev.startsWith('<无名称>')
          if (!hadName && (result.localName || result.device.name)) {
            seenDisplay.set(id, formatDevice(result))
          }
        }
        if (isTarget(result)) namedHits.push(result.device)
      }
    ).catch((err) => {
      cleanup()
      reject(err instanceof Error ? err : new Error(String(err)))
    })

    scanTimer = setTimeout(() => {
      cleanup()
      BleClient.stopLEScan().catch(() => undefined)
      resolve()
    }, SCAN_TIMEOUT_MS)
  })

  if (namedHits.length > 0) return namedHits[0]

  // 2) 兜底探测扫描到的候选
  const ordered = [...candidates].sort((a, b) => rankCandidate(b) - rankCandidate(a))
  for (const c of ordered) {
    if (await probeHasOurService(c.deviceId)) return c
  }

  // 3) 兜底：系统已配对设备（可能之前配对过，现在看不到广播但连接有效）
  try {
    const bonded = await BleClient.getBondedDevices()
    const matching = bonded.filter(
      (d) => (d.name || '').startsWith(DEVICE_NAME_PREFIX) || ESPRESSIF_OUIS.some((o) => o === d.deviceId.slice(0, 8).toUpperCase())
    )
    for (const b of matching) {
      if (await probeHasOurService(b.deviceId)) return b
    }
  } catch {
    /* 忽略绑定列表异常 */
  }

  // 4) 终极兜底：让系统弹窗让你手动点选 DiveDeep
  try {
    const picked = await BleClient.requestDevice({ namePrefix: DEVICE_NAME_PREFIX })
    if (picked) return picked
  } catch {
    /* 用户取消或系统异常，继续走到最后报错 */
  }

  const seenText = seenIds.size
    ? candidates
        .slice(0, 12)
        .map((d) => seenDisplay.get(d.deviceId) || d.deviceId)
        .join('、')
    : '（未扫描到任何设备，计时器可能没在广播——请重新上电并确认手机系统蓝牙已取消配对）'
  throw new Error(
    `未找到 DiveDeep 计时器设备。10 秒内扫描到的设备（🟡=疑似ESP32计时器）：${seenText}。若系统蓝牙里仍能看到 DiveDeep，请先把它取消配对，再点「重新连接」——连接前一定不要手动配对！`
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
