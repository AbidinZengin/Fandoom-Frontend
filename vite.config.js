import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Backend'e (Spring Boot, :8080) dev sırasında CORS'suz proxy —
    // backend'e dokunmadan /api/* çağrılarını aynı origin'den servis eder.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
