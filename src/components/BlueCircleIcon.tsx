/**
 * 统一蓝色圆形图标：所有导航/功能图标都使用蓝色渐变圆形底 + 白色 SVG
 * 与 DesktopLogo 保持一致的视觉风格
 */
import type { ReactNode } from 'react'

function BlueCircleIcon({ children, size = 14 }: { children: ReactNode; size?: number }) {
  return (
    <span
      className="shrink-0 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-sm"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </span>
  )
}

export const BlueIcons = {
  home: (
    <BlueCircleIcon>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </BlueCircleIcon>
  ),
  timer: (
    <BlueCircleIcon>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l3 2" />
      <path d="M9 2h6" />
    </BlueCircleIcon>
  ),
  checkin: (
    <BlueCircleIcon>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </BlueCircleIcon>
  ),
  records: (
    <BlueCircleIcon>
      <path d="M12 20h9" />
      <path d="M16.5 3.5l4 4L7 21H3v-4L16.5 3.5z" />
    </BlueCircleIcon>
  ),
  summary: (
    <BlueCircleIcon>
      <path d="M3 3v18h18" />
      <path d="M7 16v-5" />
      <path d="M12 16V8" />
      <path d="M17 16v-3" />
    </BlueCircleIcon>
  ),
  vocab: (
    <BlueCircleIcon>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </BlueCircleIcon>
  ),
  achievements: (
    <BlueCircleIcon>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.6V22h4v-7.4" />
      <path d="M12 14.6A5.5 5.5 0 0 0 18 9V6H6v3a5.5 5.5 0 0 0 6 5.6z" />
    </BlueCircleIcon>
  ),
  goal: (
    <BlueCircleIcon>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </BlueCircleIcon>
  ),
  profile: (
    <BlueCircleIcon>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
    </BlueCircleIcon>
  ),
  sun: (
    <BlueCircleIcon>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </BlueCircleIcon>
  ),
  moon: (
    <BlueCircleIcon>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </BlueCircleIcon>
  ),
  login: (
    <BlueCircleIcon>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
    </BlueCircleIcon>
  ),
  logout: (
    <BlueCircleIcon>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </BlueCircleIcon>
  ),
  github: (
    <BlueCircleIcon>
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </BlueCircleIcon>
  ),
  settings: (
    <BlueCircleIcon>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </BlueCircleIcon>
  ),
  health: (
    <BlueCircleIcon>
      <path d="M19 14c1.5 1.5 2 2.5 2 4A3 3 0 0 1 18 21H6a3 3 0 0 1-3-3c0-1.5.5-2.5 2-4" />
      <path d="M12 6V21" />
      <path d="M12 6a4 4 0 0 0-4-4v2a2 2 0 0 0 2 2h2z" />
    </BlueCircleIcon>
  ),
  close: (
    <BlueCircleIcon>
      <path d="M18 6 6 18M6 6l12 12" />
    </BlueCircleIcon>
  ),
}

export default BlueCircleIcon
