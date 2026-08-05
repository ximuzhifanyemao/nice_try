/// <reference types="vite/client" />

declare module 'virtual:pwa-register/react' {
  export function useRegisterSW(options?: any): {
    needRefresh: readonly [boolean, (v: boolean) => void]
    offlineReady: readonly [boolean, (v: boolean) => void]
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  }
}
