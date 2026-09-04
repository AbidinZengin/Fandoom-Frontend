import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 0.0.0.0'a bağlar — bu makinede 'localhost' sadece IPv6 (::1)
    // dinliyordu, localtunnel'ın IPv4 bağlantısı "Bad Gateway" alıyordu.
    host: true,
    // Backend'e (Spring Boot, :8080) dev sırasında CORS'suz proxy —
    // backend'e dokunmadan /api/* çağrılarını aynı origin'den servis eder.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
    // localtunnel/ngrok gibi araçlarla geçici dışa açımda Vite'ın host
    // header kontrolü (*.loca.lt vb.) isteği reddetmesin diye.
    allowedHosts: true,
  },
})
