/**
 * 桌面端/桌面站点专属 Logo：使用 logo-master.jpg 品牌图（位于 /icons/app-icon.png）
 * 统一三端（网站 / APK / 电脑程序）的图标视觉，圆角裁切使其更贴合应用图标观感。
 */
export default function DesktopLogo({ size = 24 }: { size?: number }) {
  return (
    <img
      src="/icons/app-icon.png"
      alt="DiveDeep"
      width={size}
      height={size}
      className="shrink-0 object-contain"
      style={{ borderRadius: Math.round(size * 0.22) }}
      draggable={false}
    />
  )
}