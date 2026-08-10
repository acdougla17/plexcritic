import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/health': 'http://localhost:3000',
      '/db': 'http://localhost:3000',
      '/formats': 'http://localhost:3000',
      '/refreshLibrary': 'http://localhost:3000',
      '/getFromPlex': 'http://localhost:3000',
      '/tuners': 'http://localhost:3000',
      '/test': 'http://localhost:3000',
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    outDir: '../public',
    emptyOutDir: true,
  },
})
