import type { ReactNode } from 'react'
import DesktopLogo from './DesktopLogo'
import { Icon, type IconName } from './Icon'

/**
 * 桌面端认证页面外壳（登录 / 注册 / 找回密码 / 重置密码共用）。
 *
 * 手机端一直是「整屏居中 + max-w-sm 单卡片」，在 1440×900 的电脑程序窗口里
 * 只会是屏幕正中一条窄栏、左右大片空白，属于典型的网页搬运形态。
 * 桌面端改为「左品牌区 + 右表单卡片」的双栏，宽度与按钮尺寸按桌面给足，
 * 表单本身仍是各页面自己的 <form>（Enter 提交等行为不变）。
 *
 * 窄屏（<1024px）只保留右侧表单卡片，保证浏览器窄窗口下的观感不劣化。
 */

const FEATURES: { icon: IconName; text: string }[] = [
  { icon: 'clock', text: '置顶计时小挂件：随手开始/结束，不打断学习节奏' },
  { icon: 'calendar', text: '记录按天归档：日历一眼看到打卡与时长分布' },
  { icon: 'chart', text: '周目标与今日进度尺：每天该学到哪儿一目了然' },
]

export default function AuthDialogShell({
  title,
  desc,
  children,
}: {
  /** 表单卡片标题 */
  title: string
  /** 卡片标题下的一句说明 */
  desc?: string
  children: ReactNode
}) {
  return (
    <div className="mx-auto flex h-full max-w-[1040px] items-center justify-center gap-12 px-10 py-8">
      {/* 左：品牌与能力要点（窄屏收起，避免与表单卡片抢宽度） */}
      <div className="hidden min-w-0 flex-1 lg:flex lg:flex-col">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_-8px_rgba(99,102,241,0.55)] dark:bg-slate-800">
            <DesktopLogo size={48} />
          </div>
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-2xl font-bold text-transparent dark:from-indigo-400 dark:to-violet-400">
            DiveDeep
          </span>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-slate-400">
          考研学习计时与打卡复盘工具。电脑端专注计时，学习记录自动归档，多端同步。
        </p>
        <ul className="mt-7 space-y-3.5">
          {FEATURES.map((f) => (
            <li key={f.text} className="flex items-start gap-2.5 text-[13px] text-gray-600 dark:text-slate-300">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                <Icon name={f.icon} size={14} />
              </span>
              <span className="leading-relaxed">{f.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 右：表单卡片 */}
      <div className="w-full max-w-[380px] shrink-0">
        <div className="card p-7">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">{title}</h2>
          {desc && <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{desc}</p>}
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>
  )
}
