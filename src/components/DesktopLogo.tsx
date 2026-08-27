/**
 * 桌面端专属 Logo：蓝色渐变圆形底 + 白色「D」字标
 * 区别于移动端的靛紫渐变圆角方形，桌面端用蓝色圆形更沉稳
 */
export default function DesktopLogo({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-label="DiveDeep"
    >
      <defs>
        <linearGradient id="desktopLogoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <filter id="desktopLogoShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.25" />
        </filter>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#desktopLogoGrad)" filter="url(#desktopLogoShadow)" />
      <path
        d="M20 16 h10 a14 14 0 0 1 0 28 h-10 z M 28 22 h-4 v20 h4 a8 8 0 0 0 0 -20 z"
        fill="#ffffff"
      />
    </svg>
  )
}
