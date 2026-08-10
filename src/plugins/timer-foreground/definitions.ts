export interface TimerForegroundPlugin {
  startTimer(options: { subject: string; startTimeMs: number }): Promise<void>
  stopTimer(): Promise<void>
  updateTimer(options: { subject: string; elapsedSec: number }): Promise<void>
  addListener(eventName: 'timerStopped', listenerFunc: () => void): Promise<PluginListenerHandle>
}

export interface PluginListenerHandle {
  remove: () => Promise<void>
}