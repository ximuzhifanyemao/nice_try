/**
 * 图片编辑工具：上传知识点配图前的旋转 / 裁剪。
 *
 * 预览与导出共用同一套坐标约定：
 * - 旋转只支持 90° 的整数倍，旋转后的画布尺寸会在 90 / 270 时交换宽高；
 * - 裁剪框用「旋转后图片的归一化坐标」（0–1）表示，与预览舞台尺寸无关，
 *   因此窗口缩放、手机横竖屏切换都不会让裁剪结果跑偏；
 * - 导出时直接把裁剪区域画进输出画布，不生成整张大图，避免手机内存爆掉。
 */

export type ImageRotation = 0 | 90 | 180 | 270

/** 归一化裁剪框：x / y / w / h 都是相对旋转后图片的比例（0–1） */
export interface CropRect {
  x: number
  y: number
  w: number
  h: number
}

export interface SourceImage {
  /** 可以直接喂给 canvas.drawImage 的图源 */
  source: CanvasImageSource
  width: number
  height: number
  /** 关闭时释放位图 / 对象 URL */
  close?: () => void
}

/** 默认裁剪整张图 */
export const FULL_CROP: CropRect = { x: 0, y: 0, w: 1, h: 1 }

/**
 * 导出图片的最长边。
 * 比上传前的 1600px 压缩稍大，先裁剪再压缩，文字边缘不会被压两遍。
 */
export const CROP_OUTPUT_MAX_SIDE = 2400

/** 把任意角度归一到 0 / 90 / 180 / 270 */
export function normalizeRotation(value: number): ImageRotation {
  const r = ((value % 360) + 360) % 360
  if (r === 90) return 90
  if (r === 180) return 180
  if (r === 270) return 270
  return 0
}

/** 旋转后的画布尺寸（90° / 270° 交换宽高） */
export function rotatedSize(
  width: number,
  height: number,
  rotation: ImageRotation,
): { width: number; height: number } {
  return rotation === 90 || rotation === 270
    ? { width: height, height: width }
    : { width, height }
}

/**
 * 把「原图坐标系」旋转进「旋转后坐标系」。
 * 调用前画布的原点应已对齐旋转后图片的左上角、单位与旋转后图片像素一致；
 * 之后直接 drawImage(source, 0, 0) 即可。
 */
export function applyRotation(
  ctx: CanvasRenderingContext2D,
  rotation: ImageRotation,
  rotatedWidth: number,
  rotatedHeight: number,
): void {
  if (rotation === 90) {
    ctx.translate(rotatedWidth, 0)
    ctx.rotate(Math.PI / 2)
  } else if (rotation === 180) {
    ctx.translate(rotatedWidth, rotatedHeight)
    ctx.rotate(Math.PI)
  } else if (rotation === 270) {
    ctx.translate(0, rotatedHeight)
    ctx.rotate(-Math.PI / 2)
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * 读取本地图片。优先 createImageBitmap（快、按 EXIF 方向解码），
 * 失败时回退 <img> 解码（部分浏览器对 HEIC / SVG 的 createImageBitmap 支持不好）。
 */
export async function loadImageSource(file: Blob): Promise<SourceImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      }
    } catch {
      // 走 <img> 回退
    }
  }

  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('图片解码失败'))
      el.src = url
    })
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    }
  } catch (err) {
    URL.revokeObjectURL(url)
    throw err
  }
}

/**
 * 按裁剪框导出 JPEG。
 * 输出画布只会有裁剪区域的尺寸，最长边不超过 CROP_OUTPUT_MAX_SIDE。
 */
export async function cropImage(
  image: SourceImage,
  rotation: ImageRotation,
  rect: CropRect,
): Promise<Blob> {
  const { width: rotatedWidth, height: rotatedHeight } = rotatedSize(
    image.width,
    image.height,
    rotation,
  )
  if (rotatedWidth <= 0 || rotatedHeight <= 0) throw new Error('图片尺寸异常')

  const x = clamp(rect.x, 0, 1)
  const y = clamp(rect.y, 0, 1)
  const w = clamp(rect.w, 0.001, 1 - x)
  const h = clamp(rect.h, 0.001, 1 - y)

  const sourceX = Math.round(x * rotatedWidth)
  const sourceY = Math.round(y * rotatedHeight)
  const cropWidth = Math.max(1, Math.min(rotatedWidth - sourceX, Math.round(w * rotatedWidth)))
  const cropHeight = Math.max(1, Math.min(rotatedHeight - sourceY, Math.round(h * rotatedHeight)))

  const scale = Math.min(1, CROP_OUTPUT_MAX_SIDE / Math.max(cropWidth, cropHeight))
  const outWidth = Math.max(1, Math.round(cropWidth * scale))
  const outHeight = Math.max(1, Math.round(cropHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = outWidth
  canvas.height = outHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('当前浏览器不支持图片处理')

  // PNG 透明区域转 JPEG 会变黑，先铺白底
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, outWidth, outHeight)
  ctx.scale(outWidth / cropWidth, outHeight / cropHeight)
  ctx.translate(-sourceX, -sourceY)
  applyRotation(ctx, rotation, rotatedWidth, rotatedHeight)
  ctx.drawImage(image.source, 0, 0)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.92)
  })
  if (!blob) throw new Error('图片处理失败，请重试')
  return blob
}
