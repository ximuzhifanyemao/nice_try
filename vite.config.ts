import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))

// 获取当前 Git 提交信息：短哈希 + 提交备注 + 最近 5 条提交日志
// 注意：必须用 execFileSync + 参数数组，避免 shell 把 | 和 %cd 当作管道/变量解析（Windows cmd 与 Linux sh 都会出错）
// fallback：CloudBase 构建环境可能没有 git 命令，此时读取 .git/logs/HEAD 文件解析

// 从 .git/logs/HEAD 文件解析提交历史（不依赖 git 命令）
// 每行格式: <old-sha> <new-sha> <name> <email> <timestamp> <tz>\t<message>
function getGitInfoFromLogFile() {
  try {
    const logContent = readFileSync(new URL('.git/logs/HEAD', import.meta.url), 'utf-8')
    const lines = logContent.trim().split('\n').filter(Boolean)
    // 最新的提交在最后，取最近 5 条并反转（最新在前）
    const recent = lines.slice(-5).reverse()
    const changelog = recent.map((line) => {
      const match = line.match(/^[0-9a-f]+\s+([0-9a-f]+)\s+.+?>\s+(\d+)\s+[+-]\d+\s+(.*)$/)
      if (!match) return null
      const hash = match[1].substring(0, 7)
      const date = new Date(parseInt(match[2], 10) * 1000).toISOString().slice(0, 10)
      const message = match[3].trim()
      return { hash, date, message }
    }).filter((v): v is { hash: string; date: string; message: string } => v !== null)
    return {
      hash: changelog[0]?.hash ?? '',
      message: changelog[0]?.message ?? '',
      changelog,
    }
  } catch {
    return { hash: '', message: '', changelog: [] }
  }
}

function getGitInfo() {
  // 优先用 git 命令（信息最完整）
  try {
    const hash = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf-8' }).trim()
    const message = execFileSync('git', ['log', '-1', '--pretty=%s'], { encoding: 'utf-8' }).trim()
    const log = execFileSync('git', ['log', '-5', '--pretty=%h|%cd|%s', '--date=short'], { encoding: 'utf-8' }).trim()
    const changelog = log.split('\n').map((line) => {
      const [h, date, msg] = line.split('|')
      return { hash: h, date, message: msg }
    })
    return { hash, message, changelog }
  } catch (e) {
    console.warn('[version] git 命令不可用，尝试读取 .git/logs/HEAD')
    return getGitInfoFromLogFile()
  }
}

const gitInfo = getGitInfo()

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_GIT_HASH__: JSON.stringify(gitInfo.hash),
    __APP_GIT_MESSAGE__: JSON.stringify(gitInfo.message),
    __APP_GIT_CHANGELOG__: JSON.stringify(gitInfo.changelog),
  },
  build: {
    rollupOptions: {
      output: {
        // 拆分第三方依赖为独立 chunk，利用浏览器缓存提升二次加载速度
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('react') || id.includes('react-router')) return 'react'
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('date-fns')) return 'date-fns'
        },
      },
    },
  },
})
