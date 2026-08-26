/** DiveDeep 品牌 Logo：indigo→violet 渐变圆角方块 + 白色 D 字标 */
export default function Logo({ size = 20 }: { size?: number }) {
  return (
    <span
      role="img"
      aria-label="DiveDeep"
      className="inline-flex items-center justify-center shrink-0 bg-gradient-to-br from-indigo-500 to-violet-500 shadow-sm"
      style={{ width: size, height: size, borderRadius: size * 0.3 }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 32 32" aria-hidden="true">
        <path d="M9 7h5a6.5 6.5 0 0 1 0 13H9z" fill="#fff" />
      </svg>
    </span>
  )
}
