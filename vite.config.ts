import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
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
