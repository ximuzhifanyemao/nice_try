import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'
import DesktopLogo from '../components/DesktopLogo'
import { Icon } from '../components/Icon'
import { apkDownloadUrl } from '../lib/supabase'

/**
 * 下载落地页（公开，无需登录）。
 * 分享图里的「扫码下载」二维码指向这里：
 * 手机扫码后可直接下载安卓 APK，桌面扫码则展示 APK 二维码与网页版入口。
 *
 * 用 portal + fixed 全屏铺满，盖住应用外壳（导航/底部 Tab），
 * 让扫码进来的人看到的是一张独立的品牌落地页，而不是登录后的应用界面。
 * 走 portal 是为了脱离桌面全功能页的 transform 容器：
 * fixed 定位一旦被 transform 祖先接管，就会缩在内容列里而不是盖住整屏。
 */
export default function Download() {
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    let alive = true
    QRCode.toDataURL(apkDownloadUrl, {
      width: 480,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => {
        if (alive) setQrDataUrl(url)
      })
      .catch(() => {
        // 二维码生成失败不阻塞页面：直接下载按钮仍然可用
      })
    return () => {
      alive = false
    }
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-950 text-white">
      {/* 背景光斑：与分享图保持同一套靛蓝/紫罗兰氛围 */}
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-indigo-400/15 blur-3xl" />

      <div className="relative flex min-h-full items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]">
          <div className="grid gap-8 p-6 sm:p-9 md:grid-cols-[1.2fr_0.8fr] md:items-center md:gap-10 md:p-10">
            {/* 左列：品牌、文案与下载入口 */}
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <DesktopLogo size={42} />
                <div>
                  <p className="text-lg font-bold tracking-wide">DiveDeep</p>
                  <p className="text-[11px] tracking-[0.22em] text-indigo-200">考研学习打卡</p>
                </div>
              </div>

              <h1 className="mt-7 text-[27px] font-extrabold leading-snug sm:text-4xl">
                把每一天的坚持，
                <br />
                变成看得见的进步。
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-indigo-100/90">
                学习计时、周目标、打卡日历、英语精读与生词本……
                把备考的每一小时都记下来，回头看时才知道自己走了多远。
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href={apkDownloadUrl}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-700 shadow-[0_12px_30px_-14px_rgba(255,255,255,0.7)] transition-transform hover:scale-[1.02]"
                >
                  <Icon name="download" size={18} />
                  下载安卓版 APK
                </a>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10"
                >
                  网页版直接使用
                  <Icon name="arrowRight" size={15} />
                </Link>
              </div>

              <div className="mt-5 space-y-1.5 text-[11px] leading-relaxed text-indigo-200/85">
                <p>· 安卓手机下载后，在文件管理里打开安装；若提示风险，选择「仍要安装」即可。</p>
                <p>· 微信内无法直接安装，请点右上角「···」选择「在浏览器打开」后再下载。</p>
                <p>· iPhone 可直接使用网页版，功能与 App 一致。</p>
              </div>
            </div>

            {/* 右列：桌面端扫码下载（手机访问时隐藏，避免用本机扫自己） */}
            <div className="hidden md:block">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-5 text-center">
                {qrDataUrl ? (
                  <div className="mx-auto w-[188px] rounded-xl bg-white p-3">
                    <img src={qrDataUrl} alt="扫码下载安卓版" className="block h-[164px] w-[164px]" />
                  </div>
                ) : (
                  <div className="mx-auto flex h-[188px] w-[188px] items-center justify-center rounded-xl bg-white/90 text-xs text-indigo-700">
                    二维码生成中…
                  </div>
                )}
                <p className="mt-3 text-sm font-semibold">手机扫码下载 APK</p>
                <p className="mt-1 text-[11px] text-indigo-200">安卓安装包 · 扫码即可安装</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/15 px-6 py-4 text-[11px] text-indigo-200 sm:px-10">
            <span>DiveDeep · 学习数据只属于你</span>
            <span className="hidden sm:inline">坚持每一天，上岸见</span>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
