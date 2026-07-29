import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  // In production, replace console.log/warn/debug with no-ops via define
  define: mode === 'production' ? {
    'console.log': '(()=>{})',
    'console.warn': '(()=>{})',
    'console.debug': '(()=>{})',
  } : {},

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        timeout: 300000,
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: false,

    rollupOptions: {
      output: {
        // Manual chunk splitting to reduce the large ProjectPage chunk
        manualChunks(id) {
          if (id.includes('node_modules/@react-pdf')) return 'vendor-pdf'
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) return 'vendor-react'
          if (id.includes('node_modules/swiper') || id.includes('node_modules/lucide-react')) return 'vendor-ui'
          if (id.includes('node_modules/zustand') || id.includes('node_modules/idb')) return 'vendor-store'
        },
      },
    },
  },
}))
