import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Solo usar proxy en desarrollo
  server: mode === 'development' ? {
    proxy: {
      '/api': {
        target: 'https://3332-lilac.vercel.app',
        changeOrigin: true,
        secure: true,
      }
    }
  } : {},
  // Configuración para build
  build: {
    outDir: 'dist',
    sourcemap: false
  }
}))
