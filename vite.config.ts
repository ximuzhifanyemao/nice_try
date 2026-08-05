import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: '考研倒计时',
        short_name: '考研倒计时',
        description: '考研备考学习追踪工具：倒计时、学习打卡、科目时长统计、每周学习趋势分析。',
        lang: 'zh-CN',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // SPA 路由回退：刷新 /login 等子路径时返回 index.html
        navigateFallback: '/index.html',
        // Supabase 请求保持 network-only（认证响应不能走缓存）
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image' && !request.url.includes('supabase.co'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
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
