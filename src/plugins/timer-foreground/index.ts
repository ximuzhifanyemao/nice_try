import { registerPlugin } from '@capacitor/core'
import type { TimerForegroundPlugin } from './definitions'
import { WebTimerForeground } from './web'

const TimerForeground = registerPlugin<TimerForegroundPlugin>('TimerForeground', {
  web: () => new WebTimerForeground(),
})

export { TimerForeground }
export type { TimerForegroundPlugin }