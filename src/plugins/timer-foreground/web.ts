import type { PluginListenerHandle, TimerForegroundPlugin, BluetoothPermissionStatus } from './definitions'

export class WebTimerForeground implements TimerForegroundPlugin {
  async startTimer(): Promise<void> {
    // Web 端无需前台服务
  }
  async stopTimer(): Promise<void> {
    // Web 端无需前台服务
  }
  async updateTimer(): Promise<void> {
    // Web 端无需前台服务
  }
  async requestPermissions(): Promise<BluetoothPermissionStatus> {
    return { bluetooth: 'granted' }
  }
  async checkPermissions(): Promise<BluetoothPermissionStatus> {
    return { bluetooth: 'granted' }
  }
  async addListener(): Promise<PluginListenerHandle> {
    return { remove: async () => {} }
  }
}