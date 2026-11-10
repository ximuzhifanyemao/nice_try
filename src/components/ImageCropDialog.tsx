import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Icon } from './Icon'
import {
  CROP_OUTPUT_MAX_SIDE,
  FULL_CROP,
  applyRotation,
  cropImage,
  loadImageSource,
  normalizeRotation,
  rotatedSize,
  type CropRect,
  type ImageRotation,
  type SourceImage,
} from '../lib/imageEdit'

interface ImageCropDialogProps {
  /** 待处理的原图；父组件按队列逐张传入 */
  file: File | null
  /** 队列里还剩几张（含当前这张），用于提示和「跳过」 */
  remaining: number
  onCancel: () => void
  onSkip: () => void
  onConfirm: (blob: Blob) => void
}

type Handle = 'nw' | 'ne' | 'sw' | 'se'

type DragState =
  | { kind: 'move'; startX: number; startY: number; sel: CropRect }
  | { kind: 'resize'; anchorX: number; anchorY: number }
  | { kind: 'new'; startX: number; startY: number }

/** 裁剪框最小边（相对图片），太小会点不中四角 */
const MIN_SIZE = 0.04

const HANDLES: { key: Handle; left: string; top: string; cursor: string }[] = [
  { key: 'nw', left: '0%', top: '0%', cursor: 'cursor-nwse-resize' },
  { key: 'ne', left: '100%', top: '0%', cursor: 'cursor-nesw-resize' },
  { key: 'sw', left: '0%', top: '100%', cursor: 'cursor-nesw-resize' },
  { key: 'se', left: '100%', top: '100%', cursor: 'cursor-nwse-resize' },
]

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function contains(rect: CropRect, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h
}

function handleAnchor(handle: Handle, rect: CropRect): { x: number; y: number } {
  switch (handle) {
    case 'nw':
      return { x: rect.x + rect.w, y: rect.y + rect.h }
    case 'ne':
      return { x: rect.x, y: rect.y + rect.h }
    case 'sw':
      return { x: rect.x + rect.w, y: rect.y }
    case 'se':
      return { x: rect.x, y: rect.y }
  }
}

function percent(value: number): string {
  return `${value * 100}%`
}

/**
 * 上传前的图片编辑器：旋转 90° + 自由裁剪。
 *
 * 交互约定：
 * - 初始选中整张图；在图片上拖拽会重新画裁剪框，拖动框内移动，拖四角缩放；
 * - 旋转会重置裁剪框（旋转后的坐标已变，保留旧框反而容易剪到意外区域）；
 * - 导出统一转 JPEG，最长边不超过 CROP_OUTPUT_MAX_SIDE。
 */
export default function ImageCropDialog({
  file,
  remaining,
  onCancel,
  onSkip,
  onConfirm,
}: ImageCropDialogProps) {
  const [source, setSource] = useState<SourceImage | null>(null)
  const [error, setError] = useState('')
  const [rotation, setRotation] = useState<ImageRotation>(0)
  const [selection, setSelection] = useState<CropRect>(FULL_CROP)
  const [processing, setProcessing] = useState(false)
  const [stage, setStage] = useState({ width: 0, height: 0 })

  const stageRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<DragState | null>(null)
  /** 当前图源的引用：卸载 / 换图时由这里统一释放，避免 StrictMode 二次执行 effect 时误关正在用的位图 */
  const sourceRef = useRef<SourceImage | null>(null)

  // 换图：释放上一张、重置旋转与裁剪框，并异步解码
  useEffect(() => {
    const previous = sourceRef.current
    if (previous) {
      previous.close?.()
      sourceRef.current = null
    }
    setSource(null)
    setError('')
    setRotation(0)
    setSelection(FULL_CROP)
    setProcessing(false)
    if (!file) return

    let cancelled = false
    loadImageSource(file)
      .then((next) => {
        if (cancelled) {
          next.close?.()
          return
        }
        sourceRef.current = next
        setSource(next)
      })
      .catch(() => {
        if (!cancelled) setError('这张图片暂时无法解析，可以直接上传原图试试')
      })
    return () => {
      cancelled = true
    }
  }, [file])

  // 对话框卸载时释放位图 / 对象 URL
  useEffect(
    () => () => {
      sourceRef.current?.close?.()
      sourceRef.current = null
    },
    [],
  )

  // Esc 取消剩余图片
  useEffect(() => {
    if (!file) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !processing) onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [file, onCancel, processing])

  // 预览舞台尺寸：图片按舞台等比缩放，裁剪框用百分比覆盖在上面
  useLayoutEffect(() => {
    const el = stageRef.current
    if (!el || !source || error) return
    const measure = () => {
      const next = { width: el.clientWidth, height: el.clientHeight }
      setStage((prev) => (prev.width === next.width && prev.height === next.height ? prev : next))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [error, source])

  const rotated = useMemo(
    () => (source ? rotatedSize(source.width, source.height, rotation) : null),
    [source, rotation],
  )

  const box = useMemo(() => {
    if (!rotated || stage.width <= 0 || stage.height <= 0) return { width: 0, height: 0 }
    const availWidth = Math.max(1, stage.width - 24)
    const availHeight = Math.max(1, stage.height - 24)
    const scale = Math.min(availWidth / rotated.width, availHeight / rotated.height)
    return {
      width: Math.max(1, Math.round(rotated.width * scale)),
      height: Math.max(1, Math.round(rotated.height * scale)),
    }
  }, [rotated, stage.height, stage.width])

  // 预览绘制：与导出共用 applyRotation，保证「看到的就是剪出来的」
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !source || !rotated || error || box.width <= 0 || box.height <= 0) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const pixelWidth = Math.max(1, Math.round(box.width * dpr))
    const pixelHeight = Math.max(1, Math.round(box.height * dpr))
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, pixelWidth, pixelHeight)
    ctx.scale(pixelWidth / rotated.width, pixelHeight / rotated.height)
    applyRotation(ctx, rotation, rotated.width, rotated.height)
    ctx.drawImage(source.source, 0, 0)
  }, [box.height, box.width, error, rotated, rotation, source])

  const outputSize = useMemo(() => {
    if (!rotated) return ''
    const width = Math.max(1, Math.round(selection.w * rotated.width))
    const height = Math.max(1, Math.round(selection.h * rotated.height))
    const scale = Math.min(1, CROP_OUTPUT_MAX_SIDE / Math.max(width, height))
    return `${Math.round(width * scale)} × ${Math.round(height * scale)}`
  }, [rotated, selection])

  const pointFromEvent = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = overlayRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) return { x: 0, y: 0 }
    return {
      x: clamp01((e.clientX - rect.left) / rect.width),
      y: clamp01((e.clientY - rect.top) / rect.height),
    }
  }

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!source || processing) return
    const point = pointFromEvent(e)
    const target = e.target instanceof Element ? e.target : null
    const handle = target?.closest<HTMLElement>('[data-handle]')?.dataset.handle as Handle | undefined
    e.preventDefault()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* 指针已失效时忽略 */
    }

    if (handle) {
      const anchor = handleAnchor(handle, selection)
      dragRef.current = { kind: 'resize', anchorX: anchor.x, anchorY: anchor.y }
      return
    }

    const fullSelection = selection.w > 0.995 && selection.h > 0.995
    if (!fullSelection && contains(selection, point.x, point.y)) {
      dragRef.current = { kind: 'move', startX: point.x, startY: point.y, sel: selection }
      return
    }

    dragRef.current = { kind: 'new', startX: point.x, startY: point.y }
    setSelection({ x: point.x, y: point.y, w: 0, h: 0 })
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const point = pointFromEvent(e)

    if (drag.kind === 'move') {
      const x = Math.min(1 - drag.sel.w, Math.max(0, drag.sel.x + point.x - drag.startX))
      const y = Math.min(1 - drag.sel.h, Math.max(0, drag.sel.y + point.y - drag.startY))
      setSelection({ x, y, w: drag.sel.w, h: drag.sel.h })
      return
    }

    const startX = drag.kind === 'resize' ? drag.anchorX : drag.startX
    const startY = drag.kind === 'resize' ? drag.anchorY : drag.startY
    const x = Math.min(startX, point.x)
    const y = Math.min(startY, point.y)
    const w = Math.abs(point.x - startX)
    const h = Math.abs(point.y - startY)
    if (w >= MIN_SIZE && h >= MIN_SIZE) setSelection({ x, y, w, h })
  }

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    dragRef.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* 系统已自动释放 */
    }
    setSelection((prev) => (prev.w < MIN_SIZE || prev.h < MIN_SIZE ? FULL_CROP : prev))
  }

  const rotate = (delta: 90 | -90) => {
    setRotation((prev) => normalizeRotation(prev + delta))
    setSelection(FULL_CROP)
  }

  const reset = () => {
    setRotation(0)
    setSelection(FULL_CROP)
  }

  const handleConfirm = async () => {
    if (!source || processing) return
    setProcessing(true)
    setError('')
    try {
      const blob = await cropImage(source, rotation, selection)
      onConfirm(blob)
    } catch (err) {
      setError(err instanceof Error ? err.message : '裁剪失败，请重试')
    } finally {
      setProcessing(false)
    }
  }

  if (!file) return null

  const cancelLabel = remaining > 1 ? '取消剩余' : '取消'

  return (
    <div
      className="fixed inset-0 z-[92] flex items-center justify-center bg-black/70 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="调整图片"
    >
      <div className="flex max-h-[94vh] w-[min(760px,100%)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        {/* 头部 */}
        <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-slate-700">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
            <Icon name="crop" size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">调整图片</h3>
            <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-slate-400">
              {remaining > 1 ? `还有 ${remaining} 张待处理 · ` : ''}
              拖动四角裁剪，可旋转 90°
            </p>
          </div>
          <span className="hidden shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 sm:inline dark:bg-slate-700/60 dark:text-slate-300">
            输出约 {outputSize || '—'} px
          </span>
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            title="关闭"
            aria-label="关闭"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* 预览 / 裁剪区 */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
          {!source && !error && (
            <div className="flex h-[42vh] min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl bg-slate-900/95 text-slate-300">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/25 border-t-white" />
              <span className="text-xs">图片读取中…</span>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-10 text-center dark:border-amber-500/30 dark:bg-amber-500/10">
              <Icon name="alert" size={22} className="text-amber-500" />
              <p className="max-w-sm text-xs leading-relaxed text-amber-700 dark:text-amber-300">{error}</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button type="button" onClick={onCancel} className="btn-ghost h-9 px-3 py-0 text-xs">
                  {cancelLabel}
                </button>
                {source && (
                  <button
                    type="button"
                    onClick={() => setError('')}
                    className="btn-ghost h-9 px-3 py-0 text-xs"
                  >
                    返回编辑
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onConfirm(file)}
                  className="btn-primary h-9 px-4 py-0 text-xs"
                >
                  直接上传原图
                </button>
              </div>
            </div>
          )}

          {source && !error && (
            <>
              <div
                ref={stageRef}
                className="relative flex h-[42vh] min-h-[220px] w-full items-center justify-center overflow-hidden rounded-xl bg-slate-900/95 p-3 sm:h-[48vh]"
              >
                {box.width > 0 && (
                  <div
                    className="relative touch-none select-none"
                    style={{ width: box.width, height: box.height }}
                  >
                    <canvas
                      ref={canvasRef}
                      className="block h-full w-full rounded-sm"
                      style={{ width: box.width, height: box.height }}
                      aria-label="图片预览"
                    />

                    <div
                      ref={overlayRef}
                      className="absolute inset-0 cursor-crosshair touch-none"
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                    >
                      {/* 裁剪框外的遮罩：四块拼起来，保证只在图片范围内变暗 */}
                      <div
                        className="pointer-events-none absolute inset-x-0 top-0 bg-black/55"
                        style={{ height: percent(selection.y) }}
                      />
                      <div
                        className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/55"
                        style={{ top: percent(selection.y + selection.h) }}
                      />
                      <div
                        className="pointer-events-none absolute left-0 bg-black/55"
                        style={{
                          top: percent(selection.y),
                          height: percent(selection.h),
                          width: percent(selection.x),
                        }}
                      />
                      <div
                        className="pointer-events-none absolute right-0 bg-black/55"
                        style={{
                          top: percent(selection.y),
                          height: percent(selection.h),
                          left: percent(selection.x + selection.w),
                        }}
                      />

                      <div
                        className="pointer-events-none absolute border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
                        style={{
                          left: percent(selection.x),
                          top: percent(selection.y),
                          width: percent(selection.w),
                          height: percent(selection.h),
                        }}
                      >
                        {/* 三分构图辅助线 */}
                        <span className="absolute inset-y-0 left-1/3 border-l border-white/20" />
                        <span className="absolute inset-y-0 left-2/3 border-l border-white/20" />
                        <span className="absolute inset-x-0 top-1/3 border-t border-white/20" />
                        <span className="absolute inset-x-0 top-2/3 border-t border-white/20" />

                        {HANDLES.map((handle) => (
                          <span
                            key={handle.key}
                            data-handle={handle.key}
                            className={`pointer-events-auto absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-indigo-500 shadow-md ${handle.cursor}`}
                            style={{ left: handle.left, top: handle.top }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => rotate(-90)}
                  disabled={processing}
                  className="btn-ghost h-9 px-2.5 py-0 text-xs"
                >
                  <Icon name="rotateLeft" size={14} />
                  向左旋转
                </button>
                <button
                  type="button"
                  onClick={() => rotate(90)}
                  disabled={processing}
                  className="btn-ghost h-9 px-2.5 py-0 text-xs"
                >
                  <Icon name="rotateRight" size={14} />
                  向右旋转
                </button>
                <button
                  type="button"
                  onClick={reset}
                  disabled={processing}
                  className="btn-ghost h-9 px-2.5 py-0 text-xs"
                >
                  <Icon name="refresh" size={14} />
                  重置
                </button>
                <span className="ml-auto text-[11px] text-gray-400 dark:text-slate-500">
                  已旋转 {rotation}° · 拖动框内可移动
                </span>
              </div>
            </>
          )}
        </div>

        {/* 底部操作 */}
        {!error && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-gray-100 px-4 py-3 dark:border-slate-700">
            {remaining > 1 && (
              <button
                type="button"
                onClick={onSkip}
                disabled={processing}
                className="btn-ghost h-9 px-3 py-0 text-xs"
              >
                跳过这张
              </button>
            )}
            <span className="ml-auto" />
            <button
              type="button"
              onClick={onCancel}
              disabled={processing}
              className="btn-ghost h-9 px-3 py-0 text-xs"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={!source || processing}
              className="btn-primary h-9 min-w-[88px] px-4 py-0 text-xs"
            >
              {processing ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  处理中
                </>
              ) : (
                '完成'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
