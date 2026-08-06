import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))

// 获取当前 Git 提交信息：短哈希 + 提交备注
function getGitInfo() {
  try {
    const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
    const message = execSync('git log -1 --pretty=%s', { encoding: 'utf-8' }).trim()
    return { hash, message }
  } catch {
    return { hash: '', message: '' }
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
