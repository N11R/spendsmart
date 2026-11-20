import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The frontend only talks to the API Gateway. Vite forwards every /api
// request to it, so the React code never needs to know about service ports.
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:4000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': GATEWAY_URL,
    },
  },
})