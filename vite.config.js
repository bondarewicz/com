import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    allowedHosts: ['.ngrok-free.app', '.ngrok.app', '.ngrok.io'],
    hmr: { clientPort: 443 },
  },
})
