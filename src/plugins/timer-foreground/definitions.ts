export type PermissionState = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'

export interface BluetoothPermissionStatus {
  bluetooth: PermissionState
}

export interface TimerForegroundPlugin {
  startTimer(options: { subject: string; startTimeMs: number }): Promise<void>
  stopTimer(): Promise<void>
  updateTimer(options: { subject: string; elapsedSec: number }): Promise<void>
  addListener(eventName: 'timerStopped', listenerFunc: () => void): Promise<PluginListenerHandle>
  /** 请求 BLE 扫描/连接所需的运行时权限（Android 12+ 附近设备 / 旧版定位） */
  requestPermissions(): Promise<BluetoothPermissionStatus>
  /** 查询 BLE 相关权限状态 */
  checkPermissions(): Promise<BluetoothPermissionStatus>
}

export interface PluginListenerHandle {
  remove: () => Promise<void>
}