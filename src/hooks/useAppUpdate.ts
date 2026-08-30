import { useState, useCallback, useEffect, useRef } from 'react'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { isTauri, invoke } from '@tauri-apps/api/core'
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
  /** 桌面端：安装包文件名（用于 Rust 下载后按扩展名启动安装） */
  assetName?: string
}

/** 桌面端（Tauri）更新源：优先用 Supabase（国内直连、无需代理），GitHub Releases 仅作兜底 */
const GITHUB_OWNER = 'ximuzhifanyemao'
const GITHUB_REPO = 'nice_try'
const GITHUB_LATEST_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`

/** 桌面端主源：从 Supabase desktop_versions 探测新版（免 GitHub API，国内可直连） */
async function checkSupabaseDesktopUpdate(current: {
  version: string
  versionCode: number
}): Promise<UpdateInfo | null> {
  const { data, error } = await supabase
    .from('desktop_versions')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
  if (error) {
    throw new Error('查询更新源失败')
  }
  const row = data?.[0] as
    | { version: string; bundle_url: string; file_name?: string; file_size?: number | null; release_notes?: string | null }
    | undefined
  if (!row) {
    throw new Error('暂无桌面更新记录')
  }
  if (compareVersions(String(row.version), current.version) <= 0) {
    return null
  }
  return {
    version: String(row.version),
    versionCode: 0,
    bundleUrl: row.bundle_url,
    fileSize: row.file_size ?? undefined,
    releaseNotes: row.release_notes ?? undefined,
    assetName: row.file_name ?? 'DiveDeep-setup.exe',
  }
}

/** 桌面端兜底源：GitHub Releases latest */
async function checkGitHubDesktopUpdate(current: {
  version: string
  versionCode: number
}): Promise<UpdateInfo | null> {
  const res = await fetch(GITHUB_LATEST_URL)
  if (!res.ok) {
    throw new Error(`GitHub 查询失败（HTTP ${res.status}）`)
  }
  const rel: {
    tag_name?: string
    body?: string | null
    assets?: { name: string; browser_download_url: string; size: number }[]
  } = await res.json()

  const version = String(rel.tag_name ?? '').replace(/^v/i, '')
  if (!version) {
    throw new Error('GitHub 返回缺少版本号，请稍后再试')
  }

  // 优先用 MSI（更干净的安装流程），退而求其次选 setup.exe
  const assets = Array.isArray(rel.assets) ? rel.assets : []
  const asset =
    assets.find((a) => a.name.toLowerCase().endsWith('.msi')) ??
    assets.find((a) => /setup.*\.exe$/i.test(a.name)) ??
    assets.find((a) => a.name.toLowerCase().endsWith('.exe'))
  if (!asset) {
    throw new Error('最新版本未包含 Windows 安装包')
  }

  if (compareVersions(version, current.version) <= 0) {
    return null
  }

  return {
    version,
    versionCode: 0,
    bundleUrl: asset.browser_download_url,
    fileSize: asset.size,
    releaseNotes: rel.body ?? undefined,
    assetName: asset.name,
  }
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
        const info = await App.getInfo()
        return {
          version: info.version,
          // Android 上 App.getInfo().build 即 versionCode（字符串），与上传到 app_versions 的 version_code 对齐
          versionCode: Number(info.build) || 0,
        }
      }
    } catch {
      // 非原生环境或插件未加载
    }
    return {
      version: (typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0') as string,
      versionCode: 0,
    }
  }, [])

  // 检查是否有新版本
  const checkForUpdate = useCallback(async (): Promise<UpdateInfo | null> => {
    setStatus('checking')
    setError(null)

    try {
      const current = await getCurrentVersion()

      // 桌面端（Tauri）：优先查 Supabase（国内直连，无需代理），GitHub 兜底
      if (isTauri()) {
        try {
          const info = await checkSupabaseDesktopUpdate(current)
          if (info) {
            setUpdateInfo(info)
            setStatus('available')
          } else {
            setStatus('up_to_date')
          }
          return info
        } catch {
          // 主源不可用 → 回退 GitHub；仍失败则给出友好提示（如未开代理/网络异常）
          try {
            const info = await checkGitHubDesktopUpdate(current)
            if (info) {
              setUpdateInfo(info)
              setStatus('available')
            } else {
              setStatus('up_to_date')
            }
            return info
          } catch {
            const message = '检测更新失败：网络异常或未开代理，请稍后再试'
            console.warn('[Update]', message)
            setError(message)
            setStatus('error')
            return null
          }
        }
      }

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
        setStatus('up_to_date')
        return null
      }

      // 优先按 versionCode 数值比较（Android 单调递增，最可靠）；versionName 的语义化比较仅作兜底
      const latestVersion = row.version
      const latestCode = Number(row.version_code) || 0
      const currentCode = Number(current.versionCode) || 0

      const newerByCode = latestCode > currentCode
      const newerByVersion = compareVersions(latestVersion, current.version) > 0

      if (!newerByCode && !newerByVersion) {
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

  // 下载更新（APK 模式）：打开系统浏览器下载 APK，用户手动安装
  const downloadAndInstall = useCallback(async (info: UpdateInfo) => {
    setStatus('downloading')
    setError(null)

    try {
      if (isTauri()) {
        // 桌面端：用系统默认浏览器打开安装包下载地址（用户可自行选择时机下载安装，不打断使用）
        await invoke('desktop_updater_open_browser', { url: info.bundleUrl })
        setDownloadProgress(100)
        setStatus('downloaded')
        return true
      }

      if (Capacitor.isNativePlatform()) {
        // Android 原生：使用 window.open 打开 APK 下载链接
        // 系统浏览器/下载管理器会自动下载 APK，用户点击通知即可安装
        window.open(info.bundleUrl, '_system')
      } else {
        // Web 端：直接在新标签页打开下载链接
        window.open(info.bundleUrl, '_blank')
      }

      setDownloadProgress(100)
      setStatus('downloaded')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : '下载更新失败'
      setError(message)
      setStatus('error')
      return null
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