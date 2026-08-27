// ============================================================
// 从 logo-exports/logo-master.jpg 生成 DiveDeep 品牌图标
//   - assets/icon.png（供 tauri icon 生成桌面端图标）
//   - android mipmap（ic_launcher / round / background / foreground）
//   - android 启动屏（drawable-* / drawable-*-night / 横竖屏）
//   - public/favicon.ico / favicon.svg / favicon-512.png
//   - public/apple-touch-icon-180x180.png
//   - public/icons/icon-*.webp（PWA）
//   - public/icons/app-icon.png（桌面端/站点内 logo）
// 用法：node scripts/gen-brand-icons.mjs
// 依赖：sharp（已安装在 node_modules）
// 桌面端：脚本会输出 assets/icon.png，随后用 `npx tauri icon assets/icon.png`
//        统一生成 src-tauri/icons 下的各尺寸图标。
// ============================================================

import { mkdirSync, writeFileSync, readdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SRC = join(ROOT, 'logo-exports', 'logo-master.jpg')

// 把源图等比缩放为 size×size 的不透明 PNG
async function resizePng(size) {
  return sharp(SRC).resize(size, size).png().toBuffer()
}

async function resizeWebp(size, quality = 92) {
  return sharp(SRC).resize(size, size).webp({ quality }).toBuffer()
}

// 白色背景抠成全透明（用于 Android 自适应图标前景），保留彩色 logo 主体
async function whiteKeyPng(size) {
  const { data, info } = await sharp(SRC)
    .resize(size, size)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width, height } = info
  const out = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      // 接近纯白的背景像素 → 透明（源图为 JPG，白色近似 255）
      if (r > 246 && g > 246 && b > 250) {
        out[i + 3] = 0
      } else {
        out[i] = r
        out[i + 1] = g
        out[i + 2] = b
        out[i + 3] = 255
      }
    }
  }
  return sharp(out, { raw: { width, height, channels: 4 } }).png().toBuffer()
}

async function write(buffer, rel) {
  const p = join(ROOT, rel)
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, buffer)
  console.log('  ✓', rel)
}

// 构建多尺寸 ICO（16/32/48），全 32 位 BGRA + AND 掩码
async function makeIco(sizes) {
  const chunks = []
  for (const s of sizes) {
    const { data, info } = await sharp(SRC)
      .resize(s, s)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    const w = info.width
    const h = info.height
    const bpp = 32
    const xorSize = w * h * 4
    const andRowBytes = Math.ceil(w / 8)
    const andSize = andRowBytes * h
    const imgSize = 40 + xorSize + andSize
    const entry = Buffer.alloc(16)
    entry.writeUInt8(w >= 256 ? 0 : w, 0)
    entry.writeUInt8(h >= 256 ? 0 : h, 1)
    entry.writeUInt8(0, 2) // palette
    entry.writeUInt8(0, 3) // reserved
    entry.writeUInt16LE(1, 4) // planes
    entry.writeUInt16LE(bpp, 6) // bit count
    entry.writeUInt32LE(imgSize, 8) // bytes in res
    entry.writeUInt32LE(22 + chunks.length * 16, 12) // offset

    const dib = Buffer.alloc(40)
    dib.writeUInt32LE(40, 0)
    dib.writeInt32LE(w, 4)
    dib.writeInt32LE(h * 2, 8)
    dib.writeUInt16LE(1, 12)
    dib.writeUInt16LE(bpp, 14)
    dib.writeUInt32LE(0, 16)
    dib.writeUInt32LE(xorSize + andSize, 20)

    // XOR：RGBA(top-down) → BGRA(bottom-up)，预乘 alpha
    const xor = Buffer.alloc(xorSize)
    for (let y = 0; y < h; y++) {
      const srcRow = data.subarray(y * w * 4, (y + 1) * w * 4)
      const dstRow = xor.subarray((h - 1 - y) * w * 4, (h - y) * w * 4)
      for (let x = 0; x < w; x++) {
        const s = x * 4
        const r = srcRow[s]
        const g = srcRow[s + 1]
        const b = srcRow[s + 2]
        const a = srcRow[s + 3]
        const premul = (c) => Math.round((c * a) / 255)
        dstRow[s] = premul(b)
        dstRow[s + 1] = premul(g)
        dstRow[s + 2] = premul(r)
        dstRow[s + 3] = a
      }
    }
    const and = Buffer.alloc(andSize)
    chunks.push(entry)
    chunks.push(dib)
    chunks.push(xor)
    chunks.push(and)
  }

  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type = icon
  header.writeUInt16LE(sizes.length, 4) // count
  return Buffer.concat([header, ...chunks])
}

// favicon.svg：内嵌源图 base64（压缩到 48px），使站点图标与 logo-master 视觉一致
async function faviconSvg() {
  const jpg = await sharp(SRC).resize(48, 48).jpeg({ quality: 90 }).toBuffer()
  const b64 = jpg.toString('base64')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <image width="48" height="48" href="data:image/jpeg;base64,${b64}"/>
</svg>`
}

async function main() {
  console.log('从 logo-master.jpg 生成品牌图标...')

  // ---- assets（供 tauri icon 生成桌面端图标的源图）----
  await write(await resizePng(1024), 'assets/icon.png')
  await write(await resizePng(1024), 'assets/icon-only.png')
  await write(await whiteKeyPng(1024), 'assets/icon-foreground.png')
  // 自适应背景：纯白方块（与源图白底一致）
  await write(
    await sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#ffffff' } })
      .png()
      .toBuffer(),
    'assets/icon-background.png'
  )

  // ---- Android mipmap ----
  const densities = [
    ['mdpi', 48],
    ['hdpi', 72],
    ['xhdpi', 96],
    ['xxhdpi', 144],
    ['xxxhdpi', 192],
  ]
  for (const [dpi, size] of densities) {
    const base = `android/app/src/main/res/mipmap-${dpi}`
    await write(await resizePng(size), `${base}/ic_launcher.png`)
    await write(await resizePng(size), `${base}/ic_launcher_round.png`)
    await write(
      await sharp({ create: { width: size, height: size, channels: 4, background: '#ffffff' } })
        .png()
        .toBuffer(),
      `${base}/ic_launcher_background.png`
    )
    await write(await whiteKeyPng(size), `${base}/ic_launcher_foreground.png`)
  }

  // ---- Android 启动屏（覆盖所有 drawable-* 变体，保持各自尺寸）----
  const resDir = join(ROOT, 'android/app/src/main/res')
  for (const dir of readdirSync(resDir)) {
    const dirPath = join(resDir, dir)
    const candidates = ['splash.png']
    for (const name of candidates) {
      const fp = join(dirPath, name)
      try {
        const meta = await sharp(fp).metadata()
        if (!meta.width || !meta.height) continue
        const buf = await sharp(SRC).resize(meta.width, meta.height).png().toBuffer()
        await write(buf, `android/app/src/main/res/${dir}/${name}`)
      } catch {
        // 该目录没有 splash.png，忽略
      }
    }
  }

  // ---- Web 图标 ----
  await write(await makeIco([16, 32, 48]), 'public/favicon.ico')
  await write(await faviconSvg(), 'public/favicon.svg')
  await write(await resizePng(512), 'public/favicon-512.png')
  await write(await resizePng(180), 'public/apple-touch-icon-180x180.png')

  // PWA icons（manifest 引用 ../icons/icon-*.webp）
  for (const size of [48, 72, 96, 128, 192, 256, 512]) {
    await write(await resizeWebp(size), `public/icons/icon-${size}.webp`)
  }

  // 桌面端/站点内使用的 logo 图
  await write(await resizePng(256), 'public/icons/app-icon.png')

  console.log('完成！\n请继续执行：npx tauri icon assets/icon.png 生成桌面端图标')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})