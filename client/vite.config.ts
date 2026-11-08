import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    // Port dédié : le 5173 par défaut peut être occupé par un autre projet.
    // strictPort évite le basculement silencieux vers 5174, qui casserait
    // le contrôle d'origine côté API.
    port: 5273,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: false,
      },
    },
  },
})
