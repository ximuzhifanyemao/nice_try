import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { APK_DOWNLOAD_URL } from '../lib/appLinks'

/**
 * 当前生效的 APK 下载地址。
 *
 * 以 app_versions.bundle_url 为准：发版时无论上传到 CloudBase 还是 Supabase，
 * 下载页和二维码都会自动跟随，不需要改前端代码。
 * 查询失败（离线/表异常）时回落到 appLinks 里的 CloudBase 兜底地址。
 */
export function useApkDownloadUrl() {
  const [url, setUrl] = useState(APK_DOWNLOAD_URL)

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const { data } = await supabase
          .from('app_versions')
          .select('bundle_url')
          .eq('is_active', true)
          .order('version_code', { ascending: false })
          .limit(1)
        const remote = data?.[0]?.bundle_url
        if (alive && typeof remote === 'string' && remote) setUrl(remote)
      } catch {
        // 查询失败保留兜底地址，不阻塞页面
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  return url
}
