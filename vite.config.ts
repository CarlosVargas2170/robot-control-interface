import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host:'0.0.0.0',
    port: 5173,
    proxy: {
      // Proxy para Socket.IO (solo HTTP polling, no WebSocket)
      '/socket.io': {
        target: 'http://100.99.244.72:5000',
        changeOrigin: true,
      },
      // Proxy para health check
      '/healthz': {
        target: 'http://100.99.244.72:5000',
        changeOrigin: true,
      },
    },
  },
})
