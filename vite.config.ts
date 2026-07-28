import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // Proxy para Socket.IO (WebSocket + polling)
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
      // Proxy para health check
      '/healthz': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
