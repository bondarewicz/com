import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    allowedHosts: ['.ngrok-free.app', '.ngrok.app', '.ngrok.io'],
    // behind ngrok the HMR socket has to go through 443; run with NGROK=1 there
    hmr: process.env.NGROK ? { clientPort: 443 } : true,
  },
})
