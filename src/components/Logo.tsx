/** DiveDeep 品牌 Logo：使用应用真实图标图片（与电脑应用安装图标一致） */
export default function Logo({ size = 20 }: { size?: number }) {
  return (
    <img
      src="/icons/app-icon.png"
      alt="DiveDeep"
      width={size}
      height={size}
      className="shrink-0 object-cover shadow-sm"
      style={{ width: size, height: size, borderRadius: size * 0.25 }}
    />
  )
}
