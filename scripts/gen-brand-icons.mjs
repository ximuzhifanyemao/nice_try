// ============================================================
// 生成 DiveDeep 品牌图标（Android / Web）
// 用法：node scripts/gen-brand-icons.mjs
// 依赖：sharp（已安装在 node_modules）
// 生成：
//   assets/icon-only.png / icon-foreground.png / icon-background.png
//   assets/splash.png / splash-dark.png / assets/icon.png
//   android mipmap PNG（ic_launcher / round / background / foreground）
//   public/favicon-512.png / apple-touch-icon-180x180.png / icons/*.webp
// ============================================================

import { mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const INDIGO = '#6366F1'
const VIOLET = '#8B5CF6'

// 计算白色 D 字标路径（在 canvas 坐标系内居中）
function dPath(canvas, hFrac = 0.55, barFrac = 0.35) {
  const H = canvas * hFrac
  const r = H / 2
  const b = barFrac * H
  const W = b + r
  const top = (canvas - H) / 2
  const left = (canvas - W) / 2
  return `M${left} ${top} h${b} a${r} ${r} 0 0 1 0 ${H} H${left} z`
}

function gradDefs(id, c1 = INDIGO, c2 = VIOLET) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${c1}"/>
    <stop offset="1" stop-color="${c2}"/>
  </linearGradient>`
}

// 完整图标（圆角方块 + 渐变 + D）
function fullIconSvg(size, round = true) {
  const rx = round ? Math.round(size * 0.225) : 0
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>${gradDefs('g')}</defs>
  <rect width="${size}" height="${size}" rx="${rx}" fill="url(#g)"/>
  <path d="${dPath(size, 0.6)}" fill="#fff"/>
</svg>`
}

// 圆形图标（圆形渐变 + D）
function roundIconSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>${gradDefs('g')}</defs>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="url(#g)"/>
  <path d="${dPath(size, 0.6)}" fill="#fff"/>
</svg>`
}

// 自适应背景（纯渐变方块）
function backgroundSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>${gradDefs('g')}</defs>
  <rect width="${size}" height="${size}" fill="url(#g)"/>
</svg>`
}

// 自适应前景（透明 + 缩小 D，保证落在安全区内）
function foregroundSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <path d="${dPath(size, 0.5)}" fill="#fff"/>
</svg>`
}

// 启动屏（渐变 + D，dark 用深色渐变）
function splashSvg(size, dark = false) {
  const c1 = dark ? '#312E81' : INDIGO
  const c2 = dark ? '#4C1D95' : VIOLET
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>${gradDefs('g', c1, c2)}</defs>
  <rect width="${size}" height="${size}" fill="url(#g)"/>
  <path d="${dPath(size, 0.17)}" fill="#fff"/>
</svg>`
}

async function render(svg, width, fmt = 'png') {
  let buf = Buffer.from(svg)
  let img = sharp(buf).resize(width, width)
  if (fmt === 'webp') return img.webp({ quality: 92 }).toBuffer()
  if (fmt === 'ico') return makeIco(svg, width)
  return img.png().toBuffer()
}

// 手工构造 32 位 ICO（单尺寸），避免依赖 sharp 的 ico 编码器
async function makeIco(svg, size) {
  const { data, info } = await sharp(Buffer.from(svg)).resize(size, size).raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const bpp = 32
  const xorSize = w * h * 4
  const andRowBytes = Math.ceil(w / 8)
  const andSize = andRowBytes * h
  const imgSize = 40 + xorSize + andSize // BITMAPINFOHEADER + XOR + AND

  const entry = Buffer.alloc(16)
  entry.writeUInt8(w >= 256 ? 0 : w, 0)
  entry.writeUInt8(h >= 256 ? 0 : h, 1)
  entry.writeUInt8(0, 2) // palette
  entry.writeUInt8(0, 3) // reserved
  entry.writeUInt16LE(1, 4) // planes
  entry.writeUInt16LE(bpp, 6) // bit count
  entry.writeUInt32LE(imgSize, 8) // bytes in res
  entry.writeUInt32LE(22, 12) // offset (6 header + 16 entry)

  // BITMAPINFOHEADER
  const dib = Buffer.alloc(40)
  dib.writeUInt32LE(40, 0) // biSize
  dib.writeInt32LE(w, 4) // biWidth
  dib.writeInt32LE(h * 2, 8) // biHeight (XOR + AND)
  dib.writeUInt16LE(1, 12) // biPlanes
  dib.writeUInt16LE(bpp, 14) // biBitCount
  dib.writeUInt32LE(0, 16) // biCompression
  dib.writeUInt32LE(xorSize + andSize, 20) // biSizeImage

  // XOR 数据：RGBA(top-down) → BGRA(bottom-up)，并预乘 alpha
  const xor = Buffer.alloc(xorSize)
  for (let y = 0; y < h; y++) {
    const srcRow = data.subarray(y * w * 4, (y + 1) * w * 4)
    const dstRow = xor.subarray((h - 1 - y) * w * 4, (h - y) * w * 4)
    for (let x = 0; x < w; x++) {
      const s = x * 4
      const r = srcRow[s], g = srcRow[s + 1], b = srcRow[s + 2], a = srcRow[s + 3]
      const premul = (c) => Math.round((c * a) / 255)
      dstRow[s] = premul(b)
      dstRow[s + 1] = premul(g)
      dstRow[s + 2] = premul(r)
      dstRow[s + 3] = a
    }
  }

  // AND 掩码：全 0（不透明）
  const and = Buffer.alloc(andSize)

  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type = icon
  header.writeUInt16LE(1, 4) // count

  return Buffer.concat([header, entry, dib, xor, and])
}

async function write(buffer, rel) {
  const p = join(ROOT, rel)
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, buffer)
  console.log('  ✓', rel)
}

async function main() {
  console.log('生成 DiveDeep 品牌图标...')

  // ---- 源素材（供 capacitor-assets / tauri icon 使用）----
  const A = { iconOnly: 1024, fg: 1024, bg: 1024, splash: 2732, master: 1024 }
  await write(await render(fullIconSvg(A.iconOnly, false), A.iconOnly), 'assets/icon-only.png')
  await write(await render(foregroundSvg(A.fg), A.fg), 'assets/icon-foreground.png')
  await write(await render(backgroundSvg(A.bg), A.bg), 'assets/icon-background.png')
  await write(await render(splashSvg(A.splash), A.splash), 'assets/splash.png')
  await write(await render(splashSvg(A.splash, true), A.splash), 'assets/splash-dark.png')
  await write(await render(fullIconSvg(A.master, false), A.master), 'assets/icon.png')

  // ---- Android mipmap PNG ----
  const densities = [
    ['mdpi', 48],
    ['hdpi', 72],
    ['xhdpi', 96],
    ['xxhdpi', 144],
    ['xxxhdpi', 192],
  ]
  for (const [dpi, size] of densities) {
    const base = `android/app/src/main/res/mipmap-${dpi}`
    await write(await render(fullIconSvg(size, false), size), `${base}/ic_launcher.png`)
    await write(await render(roundIconSvg(size), size), `${base}/ic_launcher_round.png`)
    await write(await render(backgroundSvg(size), size), `${base}/ic_launcher_background.png`)
    await write(await render(foregroundSvg(size), size), `${base}/ic_launcher_foreground.png`)
  }

  // ---- Web 图标 ----
  await write(await render(fullIconSvg(512, true), 512), 'public/favicon-512.png')
  await write(await render(fullIconSvg(180, true), 180), 'public/apple-touch-icon-180x180.png')
  await write(await render(fullIconSvg(48, true), 48, 'ico'), 'public/favicon.ico')

  // PWA icons（manifest 引用 ../icons/icon-*.webp）
  for (const size of [48, 72, 96, 128, 192, 256, 512]) {
    await write(await render(fullIconSvg(size, true), size, 'webp'), `public/icons/icon-${size}.webp`)
  }

  console.log('完成！')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
