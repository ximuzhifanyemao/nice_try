/**
 * 桌面端界面截图工具（开发用）。
 *
 * 通过 Chrome DevTools Protocol 打开预览页、等页面真正渲染完成后再截图，
 * 保证截图内容与 Tauri 窗口里看到的完全一致（视口尺寸、设备像素比都可控）。
 *
 * 用法：
 *   node scripts/dev/shot.mjs --url "<预览页地址>" --out <输出png> --w 460 --h 52 [--scale 2] [--settle 9000]
 * 可选：
 *   --raw <png>   额外输出一张「未裁剪的整视口」截图，便于排查
 *   --eval "<表达式>"  在页面内求值并打印结果，用于核对布局尺寸
 *
 * 之所以不用 `chrome --screenshot`：--timeout 会冻结页面脚本执行，
 * --virtual-time-budget 又会让应用里的 setInterval 疯狂空转，两者都拿不到稳定结果。
 *
 * 关键实现约束（都在本机 Chrome 上实测过）：
 * 1. 视口用 Emulation.setDeviceMetricsOverride 精确设定，不靠 --window-size
 *    （无头窗口有 534x104 的最小尺寸，小窗口下拿不到目标视口）。
 * 2. 截图必须带 captureBeyondViewport:false。开了这个默认行为后，
 *    Page.captureScreenshot 会永久挂起；同时它还会把视口之外的内容补进画面，
 *    高度不足时用背景色填充，产生假的空白带。
 * 3. 小窗口场景要显式指定 headless=old：new headless 下截图不稳定。
 */
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'

const CHROME_CANDIDATES = [
  join(process.env.LOCALAPPDATA ?? '', 'Google/Chrome/Application/chrome.exe'),
  join(process.env.ProgramFiles ?? '', 'Google/Chrome/Application/chrome.exe'),
  join(process.env['ProgramFiles(x86)'] ?? '', 'Google/Chrome/Application/chrome.exe'),
  join(process.env['ProgramFiles(x86)'] ?? '', 'Microsoft/Edge/Application/msedge.exe'),
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
]

function parseArgs(argv) {
  const out = { scale: 2, settle: 9000, raw: null, eval: null }
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '')
    const val = argv[i + 1]
    if (key === 'url') out.url = val
    else if (key === 'out') out.out = val
    else if (key === 'w') out.width = Number(val)
    else if (key === 'h') out.height = Number(val)
    else if (key === 'scale') out.scale = Number(val)
    else if (key === 'settle') out.settle = Number(val)
    else if (key === 'raw') out.raw = val
    else if (key === 'eval') out.eval = val
  }
  if (!out.url || !out.out || !out.width || !out.height) {
    throw new Error('用法: node scripts/dev/shot.mjs --url <url> --out <png> --w <宽> --h <高> [--scale 2] [--settle 9000]')
  }
  return out
}

async function findChrome() {
  for (const p of CHROME_CANDIDATES) {
    if (p && existsSync(p)) return p
  }
  throw new Error('未找到 Chrome/Edge 可执行文件')
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * 给预览地址补上 host=<宽>x<高> 参数。
 * preview.html 据此把内容区锁定成 Tauri 窗口的逻辑尺寸（内联样式，避免加载后再变尺寸）。
 */
function withHostParam(url, width, height) {
  const u = new URL(url)
  u.searchParams.set('host', `${width}x${height}`)
  return u.toString()
}

/** 极简 CDP 客户端：逐条命令等待对应 id 的响应 */class Cdp {
  constructor(ws) {
    this.ws = ws
    this.id = 0
    this.pending = new Map()
    ws.addEventListener('message', (ev) => {
      let msg
      try {
        msg = JSON.parse(typeof ev.data === 'string' ? ev.data : String(ev.data))
      } catch {
        return
      }
      if (msg.id != null && this.pending.has(msg.id)) {
        const { resolve: res, reject: rej } = this.pending.get(msg.id)
        this.pending.delete(msg.id)
        if (msg.error) rej(new Error(`${msg.error.message} (${msg.error.code})`))
        else res(msg.result)
      }
    })
  }

  send(method, params = {}, timeoutMs = 120000) {
    const id = ++this.id
    return new Promise((res, rej) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        rej(new Error(`CDP 超时: ${method}`))
      }, timeoutMs)
      this.pending.set(id, {
        resolve: (v) => {
          clearTimeout(timer)
          res(v)
        },
        reject: (e) => {
          clearTimeout(timer)
          rej(e)
        },
      })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const chrome = await findChrome()
  const port = 9000 + Math.floor(Math.random() * 900)
  const profile = join(tmpdir(), `dsd-shot-${randomUUID().slice(0, 8)}`)
  mkdirSync(profile, { recursive: true })

  const child = spawn(
    chrome,
    [
      '--headless=old',
      '--no-sandbox',
      '--disable-crash-reporter',
      '--disable-breakpad',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      // 关闭后台节流，避免计时器/动画在无头环境被降频导致截图抓到中间态
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      `--user-data-dir=${profile}`,
      `--remote-debugging-port=${port}`,
      // 窗口本身给足空间；真正的视口尺寸由 setDeviceMetricsOverride 决定
      '--window-size=1200,900',
      'about:blank',
    ],
    { stdio: 'ignore', windowsHide: true },
  )

  let ws
  let exitCode = 0
  try {
    // 等调试端口就绪
    let target = null
    for (let i = 0; i < 60 && !target; i++) {
      await sleep(250)
      try {
        const list = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json())
        target = list.find((t) => t.type === 'page')
      } catch {
        /* 端口还没起来，继续等 */
      }
    }
    if (!target?.webSocketDebuggerUrl) throw new Error(`未能连接 Chrome 调试端口 ${port}`)

    ws = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((res, rej) => {
      ws.addEventListener('open', res, { once: true })
      ws.addEventListener('error', () => rej(new Error('CDP WebSocket 连接失败')), { once: true })
    })
    const cdp = new Cdp(ws)

    // 精确设定视口：宽高即 Tauri 窗口的内容区尺寸
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: args.width,
      height: args.height,
      deviceScaleFactor: args.scale,
      mobile: false,
    })

    await cdp.send('Page.navigate', { url: withHostParam(args.url, args.width, args.height) })
    await sleep(args.settle)

    // 校验页面确实渲染出了内容、且视口尺寸正确，避免把空白帧当成结果
    const probe = await cdp.send('Runtime.evaluate', {
      expression:
        "JSON.stringify({vw:innerWidth,vh:innerHeight,children:(document.getElementById('root')||{childElementCount:-1}).childElementCount,bodyChildren:document.body?document.body.childElementCount:-1,diag:(document.getElementById('preview-diag')||{textContent:''}).textContent})",
      returnByValue: true,
    })
    const state = JSON.parse(probe.result.value)
    if (state.diag && /ERR:|REJ:/.test(state.diag)) throw new Error(`预览页报错: ${state.diag}`)
    if (Number(state.children) <= 0 && Number(state.bodyChildren) <= 0) {
      throw new Error(`页面未渲染出内容 diag=${state.diag}`)
    }
    if (Number(state.vw) !== args.width || Number(state.vh) !== args.height) {
      throw new Error(`视口尺寸不符：实际 ${state.vw}x${state.vh}，期望 ${args.width}x${args.height}`)
    }
    // 给尾帧动画（进度条/淡入）留一点时间落定
    await sleep(700)

    if (args.eval) {
      const evaled = await cdp.send('Runtime.evaluate', {
        expression: `JSON.stringify(${args.eval})`,
        returnByValue: true,
      })
      console.log(`EVAL ${evaled.result.value}`)
    }

    if (args.raw) {
      const rawShot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
      const rawPath = resolve(args.raw)
      mkdirSync(dirname(rawPath), { recursive: true })
      writeFileSync(rawPath, Buffer.from(rawShot.data, 'base64'))
    }

    const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
    if (!shot?.data) throw new Error('截图返回为空')
    const buf = Buffer.from(shot.data, 'base64')
    const outPath = resolve(args.out)
    mkdirSync(dirname(outPath), { recursive: true })
    writeFileSync(outPath, buf)
    console.log(`OK ${outPath} (${buf.length} bytes)`)
  } catch (err) {
    console.error(`FAIL ${args.out}: ${err?.message ?? err}`)
    exitCode = 1
  } finally {
    try {
      ws?.close()
    } catch {
      /* ignore */
    }
    child.kill('SIGKILL')
    await sleep(300)
    rmSync(profile, { recursive: true, force: true })
  }
  process.exit(exitCode)
}

main()
