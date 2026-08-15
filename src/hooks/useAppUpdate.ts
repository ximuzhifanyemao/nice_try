import { useState, useCallback, useEffect, useRef } from 'react'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { Capacitor } from '@capacitor/core'
import { supabase } from '../lib/supabase'

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'installing'
  | 'up_to_date'
  | 'error'

export interface UpdateInfo {
  version: string
  versionCode: number
  bundleUrl: string
  checksum?: string
  releaseNotes?: string
  fileSize?: number
}

export function useAppUpdate() {
  const [status, setStatus] = useState<UpdateStatus>('idle')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const hasChecked = useRef(false)

  // 获取当前运行的版本
  const getCurrentVersion = useCallback(async (): Promise<{ version: string; versionCode: number }> => {
    try {
      if (Capacitor.isNativePlatform()) {
        const builtin = await CapacitorUpdater.getBuiltinVersion()
        return {
          version: builtin.version,
          versionCode: (builtin as any).version_code ?? 0,
        }
      }
    } catch {
      // 非原生环境或插件未加载
    }
    // 回退到全局版本常量（由 Vite define 注入）
    return {
      version: (typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0') as string,
      versionCode: 0,
    }
  }, [])

  // 检查是否有新版本
  const checkForUpdate = useCallback(async (): Promise<UpdateInfo | null> => {
    const isNative = Capacitor.isNativePlatform()

    setStatus('checking')
    setError(null)

    try {
      const current = await getCurrentVersion()
      console.log('[OTA] 当前版本:', current.version, '| code:', current.versionCode, '| 平台:', isNative ? '原生' : 'Web')

      // 从 Supabase 获取最新版本（用数组返回，避免空表报 PGRST116）
      const { data, error: dbError } = await supabase
        .from('app_versions')
        .select('*')
        .eq('is_active', true)
        .order('version_code', { ascending: false })
        .limit(1)

      if (dbError) {
        const isTableMissing =
          dbError.code === '42P01' ||
          (dbError.message?.includes('does not exist') && dbError.message?.includes('app_versions'))
        const msg = isTableMissing
          ? `app_versions 表不存在，请在 Supabase 执行 SQL 初始化`
          : `查询 Supabase 失败: ${dbError.message}`
        console.warn('[OTA]', msg)
        setError(msg)
        setStatus('error')
        return null
      }

      const row = data?.[0]
      if (!row) {
        console.log('[OTA] 无可用版本')
        setStatus('up_to_date')
        return null
      }

      // 比较版本：先用语义化版本号，相同则比较 version_code
      const latestVersion = row.version
      const latestVersionCode = row.version_code
      console.log('[OTA] 最新版本:', latestVersion, '| code:', latestVersionCode, '| 当前版本:', current.version, '| code:', current.versionCode)

      const semverResult = compareVersions(latestVersion, current.version)
      if (semverResult < 0 || (semverResult === 0 && latestVersionCode <= current.versionCode)) {
        console.log('[OTA] 已是最新版本')
        setStatus('up_to_date')
        return null
      }

      const info: UpdateInfo = {
        version: row.version,
        versionCode: row.version_code,
        bundleUrl: row.bundle_url,
        checksum: row.checksum,
        releaseNotes: row.release_notes,
        fileSize: row.file_size,
      }

      console.log('[OTA] 发现新版本:', info.version)
      setUpdateInfo(info)
      setStatus('available')
      return info
    } catch (err) {
      const message = err instanceof Error ? err.message : '检查更新失败'
      console.error('[OTA]', message)
      setError(message)
      setStatus('error')
      return null
    }
  }, [getCurrentVersion])

  // 下载并安装更新
  const downloadAndInstall = useCallback(async (info: UpdateInfo) => {
    if (!Capacitor.isNativePlatform()) return

    setStatus('downloading')
    setDownloadProgress(0)
    setError(null)

    try {
      // 监听下载进度
      const listener = await CapacitorUpdater.addListener('download', (state) => {
        if (state.percent !== undefined) {
          setDownloadProgress(state.percent)
        }
      })

      // 下载 bundle
      const bundle = await CapacitorUpdater.download({
        url: info.bundleUrl,
        version: info.version,
      })

      listener.remove()

      setStatus('downloaded')
      setDownloadProgress(100)

      // 设为下次启动时加载
      await CapacitorUpdater.next({ id: bundle.id })

      setStatus('installing')

      // 通知用户重启
      return bundle
    } catch (err) {
      const message = err instanceof Error ? err.message : '下载更新失败'
      setError(message)
      setStatus('error')
      return null
    }
  }, [])

  // 立即应用更新（重启 App）
  const applyNow = useCallback(async (bundleId: string) => {
    if (!Capacitor.isNativePlatform()) return
    try {
      // 必须先通知 ready
      await CapacitorUpdater.notifyAppReady()
      await CapacitorUpdater.set({ id: bundleId })
    } catch (err) {
      const message = err instanceof Error ? err.message : '安装更新失败'
      setError(message)
      setStatus('error')
    }
  }, [])

  // 应用启动时自动检查一次
  useEffect(() => {
    if (hasChecked.current) return
    hasChecked.current = true

    // 延迟 2 秒检查，避免影响启动速度
    const timer = setTimeout(() => {
      checkForUpdate()
    }, 2000)

    return () => clearTimeout(timer)
  }, [checkForUpdate])

  return {
    status,
    updateInfo,
    downloadProgress,
    error,
    checkForUpdate,
    downloadAndInstall,
    applyNow,
  }
}

// 语义化版本比较
function compareVersions(a: string, b: string): number {
  const parse = (v: string) => v.split('.').map(Number)
  const pa = parse(a)
  const pb = parse(b)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0
    const nb = pb[i] || 0
    if (na > nb) return 1
    if (na < nb) return -1
  }
  return 0
}