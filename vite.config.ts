import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))

// 获取当前 Git 提交信息：短哈希 + 提交备注 + 最近 5 条提交日志
// 注意：必须用 execFileSync + 参数数组，避免 shell 把 | 和 %cd 当作管道/变量解析（Windows cmd 与 Linux sh 都会出错）
function getGitInfo() {
  try {
    const hash = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf-8' }).trim()
    const message = execFileSync('git', ['log', '-1', '--pretty=%s'], { encoding: 'utf-8' }).trim()
    // 最近 5 条提交：短哈希 | 提交时间 | 提交备注
    const log = execFileSync('git', ['log', '-5', '--pretty=%h|%cd|%s', '--date=short'], { encoding: 'utf-8' }).trim()
    const changelog = log.split('\n').map((line) => {
      const [h, date, msg] = line.split('|')
      return { hash: h, date, message: msg }
    })
    return { hash, message, changelog }
  } catch {
    return { hash: '', message: '', changelog: [] }
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
