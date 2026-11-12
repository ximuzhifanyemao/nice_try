import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'
import DesktopLogo from '../components/DesktopLogo'
import { Icon } from '../components/Icon'
import { supabase } from '../lib/supabase'
import { useApkDownloadUrl } from '../hooks/useApkDownloadUrl'
import { GITHUB_RELEASES_URL, GITHUB_REPO_URL } from '../lib/appLinks'

/** 桌面端最新安装包（来自 Supabase desktop_versions 的当前活跃版本） */
interface DesktopRelease {
  version: string
  bundle_url: string
  file_name?: string
  file_size?: number | null
}

/** 把字节数格式化成安装包大小（MB，一位小数） */
function formatSize(bytes?: number | null) {
  if (!bytes || bytes <= 0) return ''
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/**
 * 应用下载落地页（公开，无需登录）。
 *
 * 分享图里的「扫码下载」二维码指向这里；扫码进来的人会先看到：
 * 电脑端（Windows 安装包）、手机端（安卓 APK）、网页版入口与 GitHub 地址。
 * 视觉沿用「一页纸」的纸墨配色（暖纸底 + 朱砂），与政治一页纸应用内的观感一致。
 *
 * 用 portal + fixed 全屏铺满，盖住应用外壳（导航/底部 Tab），
 * 让扫码进来的人看到的是一张独立的品牌落地页，而不是登录后的应用界面。
 * 走 portal 是为了脱离桌面全功能页的 transform 容器：fixed 定位一旦被
 * transform 祖先接管，就会缩在内容列里而不是盖住整屏。
 */
export default function Download() {
  const apkDownloadUrl = useApkDownloadUrl()
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [desktop, setDesktop] = useState<DesktopRelease | null>(null)
  const [desktopLoading, setDesktopLoading] = useState(true)

  useEffect(() => {
    let alive = true
    QRCode.toDataURL(apkDownloadUrl, {
      width: 480,
      margin: 1,
      color: { dark: '#2b2521', light: '#fffcf6' },
    })
      .then((url) => {
        if (alive) setQrDataUrl(url)
      })
      .catch(() => {
        // 二维码生成失败不阻塞页面：直接下载按钮仍然可用
      })

    void (async () => {
      try {
        const { data } = await supabase
          .from('desktop_versions')
          .select('version,bundle_url,file_name,file_size')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
        if (!alive) return
        const row = data?.[0] as DesktopRelease | undefined
        setDesktop(row ?? null)
      } catch {
        // 查询失败时回落到 GitHub Releases，页面不显示错误
      } finally {
        if (alive) setDesktopLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [apkDownloadUrl])

  const desktopHref = desktop?.bundle_url ?? GITHUB_RELEASES_URL
  const sizeText = formatSize(desktop?.file_size)

  return createPortal(
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#f4efe6] text-[#2b2521]">
      {/* 纸面细点与两团柔光：与一页纸页面的背景同一套语言 */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-70"
        style={{
          backgroundImage: 'radial-gradient(rgba(116,92,59,0.07) 0.9px, transparent 0.9px)',
          backgroundSize: '9px 9px',
        }}
      />
      <div aria-hidden className="pointer-events-none fixed -right-24 -top-28 h-80 w-80 rounded-full bg-[#a6342a]/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none fixed -bottom-32 -left-24 h-80 w-80 rounded-full bg-[#ad7838]/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col justify-center px-4 py-8 sm:px-6 sm:py-10">
        {/* ── 页头：品牌 + GitHub ── */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <DesktopLogo size={34} />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold tracking-wide">DiveDeep</p>
              <p className="text-[10.5px] tracking-[0.18em] text-[#8b7d6e]">考研学习打卡</p>
            </div>
          </div>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#e4dac9] bg-[#fffcf6]/80 px-3 py-1.5 text-[11.5px] font-medium text-[#60564b] transition-colors hover:border-[#d3c3ac] hover:text-[#2b2521]"
          >
            <Icon name="github" size={14} />
            GitHub 开源
          </a>
        </header>

        {/* ── Hero：文案 + 手机扫码 ── */}
        <section className="mt-8 grid gap-6 sm:mt-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-center lg:gap-10">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[10.5px] font-medium tracking-[0.22em] text-[#a6342a]">
              <span className="h-px w-5 bg-[#a6342a]" />
              2027 考研 · 学习追踪
            </p>
            <h1
              className="mt-3 text-[32px] font-normal leading-[1.35] tracking-[0.04em] sm:text-[46px]"
              style={{
                fontFamily:
                  '"STXingkai","Xingkai SC","华文行楷","STKaiti","KaiTi","Kaiti SC","楷体","Songti SC","STSong","Source Han Serif SC","Noto Serif SC",serif',
              }}
            >
              路虽远，<span className="text-[#a6342a]">行则将至</span>；
              <br />
              事虽难，<span className="text-[#a6342a]">做则必成</span>。
            </h1>
            <p className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-[#60564b] sm:text-sm">
              学习计时、周目标、打卡日历、英语精读、记一记——把备考的每一小时都记下来，
              回头看时才知道自己走了多远。
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] text-[#8b7d6e]">
              <span className="inline-flex items-center gap-1">
                <Icon name="check" size={12} className="text-[#2f7451]" />
                免费使用
              </span>
              <span className="inline-flex items-center gap-1">
                <Icon name="check" size={12} className="text-[#2f7451]" />
                数据云端同步
              </span>
              <span className="inline-flex items-center gap-1">
                <Icon name="check" size={12} className="text-[#2f7451]" />
                电脑 / 手机 / 网页三端
              </span>
            </div>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <a
                href={desktopHref}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#a6342a] px-5 py-3 text-sm font-semibold text-[#fff8ef] shadow-[0_10px_26px_-14px_rgba(127,36,29,0.75)] transition-all hover:bg-[#8c2a22] active:scale-[0.99]"
              >
                <Icon name="monitor" size={17} />
                {desktopLoading ? '正在获取最新版本…' : desktop ? '下载 Windows 版' : '前往 GitHub 下载'}
              </a>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#e4dac9] bg-[#fffcf6] px-5 py-3 text-sm font-semibold text-[#60564b] transition-colors hover:border-[#d3c3ac] hover:text-[#2b2521]"
              >
                网页版直接使用
                <Icon name="arrowRight" size={15} />
              </Link>
            </div>
          </div>

          {/* 桌面端扫码卡片（手机访问时隐藏，避免自己扫自己） */}
          <div className="hidden sm:block">
            <div className="mx-auto max-w-[300px] rounded-2xl border border-[#e4dac9] bg-[#fffcf6] p-4 text-center shadow-[0_20px_50px_-34px_rgba(73,52,32,0.5)]">
              {qrDataUrl ? (
                <div className="mx-auto w-[186px] rounded-xl bg-[#fffcf6] p-2.5 ring-1 ring-[#e4dac9]">
                  <img src={qrDataUrl} alt="扫码下载安卓版" className="block h-[166px] w-[166px]" />
                </div>
              ) : (
                <div className="mx-auto flex h-[186px] w-[186px] items-center justify-center rounded-xl bg-[#faf4e9] text-xs text-[#8b7d6e]">
                  二维码生成中…
                </div>
              )}
              <p className="mt-3 text-[13px] font-semibold">手机扫码安装安卓版</p>
              <p className="mt-1 text-[10.5px] text-[#8b7d6e]">微信内请用右上角「在浏览器打开」</p>
            </div>
          </div>
        </section>

        {/* ── 三个平台入口 ── */}
        <section className="mt-9">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2
              className="text-[19px] font-semibold sm:text-[22px]"
              style={{ fontFamily: '"Songti SC","STSong","Source Han Serif SC","Noto Serif SC",serif' }}
            >
              选择你的设备
            </h2>
            <span className="text-[11px] text-[#8b7d6e]">三端数据互通</span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {/* Windows 桌面端 */}
            <article className="flex flex-col rounded-2xl border border-[#e4dac9] bg-[#fffcf6] p-4 shadow-[0_16px_42px_-32px_rgba(73,52,32,0.5)]">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f2d3cd] text-[#a6342a]">
                  <Icon name="monitor" size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
                    Windows 电脑端
                    {desktop && (
                      <span className="rounded-full bg-[#f8e9e5] px-1.5 py-0.5 text-[10px] font-medium text-[#a6342a]">
                        v{desktop.version}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-[#8b7d6e]">
                    沉浸式桌面窗口 · 常驻计时小挂件
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[11.5px] text-[#60564b]">
                {desktop?.file_name ?? 'DiveDeep-setup.exe'}
                {sizeText && <span className="text-[#8b7d6e]"> · {sizeText}</span>}
              </p>
              <div className="mt-3 flex flex-col gap-2 pt-1">
                <a
                  href={desktopHref}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#a6342a] px-3 py-2 text-[12.5px] font-semibold text-[#fff8ef] transition-colors hover:bg-[#8c2a22]"
                >
                  <Icon name="download" size={14} />
                  {desktop ? '下载安装包' : 'GitHub Releases'}
                </a>
                {desktop && (
                  <a
                    href={GITHUB_RELEASES_URL}
                    target="_blank"
                    rel="noopener"
                    className="text-center text-[10.5px] text-[#8b7d6e] underline-offset-4 hover:text-[#60564b] hover:underline"
                  >
                    备用下载：GitHub Releases
                  </a>
                )}
              </div>
            </article>

            {/* Android 手机端 */}
            <article className="flex flex-col rounded-2xl border border-[#e4dac9] bg-[#fffcf6] p-4 shadow-[0_16px_42px_-32px_rgba(73,52,32,0.5)]">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f1ec] text-[#2f7451]">
                  <Icon name="smartphone" size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">安卓手机端</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-[#8b7d6e]">APK 直装 · 后台计时提醒</p>
                </div>
              </div>
              <p className="mt-3 text-[11.5px] leading-relaxed text-[#60564b]">
                下载后在文件管理中打开安装；若提示风险，选择「仍要安装」即可。
              </p>
              <div className="mt-3 flex flex-col gap-2 pt-1">
                <a
                  href={apkDownloadUrl}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#2f7451] px-3 py-2 text-[12.5px] font-semibold text-[#fffcf6] transition-colors hover:bg-[#22533a]"
                >
                  <Icon name="download" size={14} />
                  下载安卓 APK
                </a>
                <span className="text-center text-[10.5px] text-[#8b7d6e]">iPhone 可直接使用网页版</span>
              </div>
            </article>

            {/* 网页版 */}
            <article className="flex flex-col rounded-2xl border border-[#e4dac9] bg-[#fffcf6] p-4 shadow-[0_16px_42px_-32px_rgba(73,52,32,0.5)]">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e9eff5] text-[#2d5f9d]">
                  <Icon name="globe" size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">网页版</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-[#8b7d6e]">打开浏览器就能用 · 免安装</p>
                </div>
              </div>
              <p className="mt-3 text-[11.5px] leading-relaxed text-[#60564b]">
                与电脑端一致的功能布局，适合临时换设备、iPad 或不想安装软件时使用。
              </p>
              <div className="mt-3 flex flex-col gap-2 pt-1">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#ad7838] px-3 py-2 text-[12.5px] font-semibold text-[#fffcf6] transition-colors hover:bg-[#96672f]"
                >
                  <Icon name="arrowRight" size={14} />
                  进入网页版
                </Link>
              </div>
            </article>
          </div>
        </section>

        {/* ── 页脚：GitHub + 提示 ── */}
        <footer className="mt-6 flex flex-col gap-3 border-t border-[#e4dac9] pt-5 text-[11.5px] text-[#8b7d6e] sm:flex-row sm:items-center sm:justify-between">
          <p>DiveDeep · 学习数据只属于你</p>
          <div className="flex flex-wrap items-center gap-4">
            <a href={GITHUB_REPO_URL} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 hover:text-[#60564b]">
              <Icon name="github" size={13} />
              源码仓库
            </a>
            <a href={GITHUB_RELEASES_URL} target="_blank" rel="noopener" className="hover:text-[#60564b]">
              历史版本
            </a>
            <span>坚持每一天，上岸见</span>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
