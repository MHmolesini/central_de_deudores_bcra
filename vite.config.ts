import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/central_de_deudores_bcra/',
  server: {
    proxy: {
      '/bcra-api': {
        target: 'https://api.bcra.gob.ar',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bcra-api/, '')
      }
    }
  }
})
