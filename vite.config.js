import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
    // Proxy API requests to Python backend
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  }
})
