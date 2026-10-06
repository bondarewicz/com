import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // the year the page was pre-rendered; the browser swaps in the current one
  define: { __BUILD_YEAR__: JSON.stringify(new Date().getFullYear()) },
  server: {
    port: 5174,
    host: true,
    allowedHosts: ['.ngrok-free.app', '.ngrok.app', '.ngrok.io'],
    // behind ngrok the HMR socket has to go through 443; run with NGROK=1 there
    hmr: process.env.NGROK ? { clientPort: 443 } : true,
  },
})
