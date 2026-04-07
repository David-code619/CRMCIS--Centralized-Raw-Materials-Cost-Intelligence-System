import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const DEFAULT_API_URL =
  process.env.VITE_API_URL?.trim() ||
  'https://crmcis-centralized-raw-materials-cost.onrender.com';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(DEFAULT_API_URL),
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        credentials: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
  
})
