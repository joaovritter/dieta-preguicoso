import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Em produção o Nginx faz o proxy de /api; em dev o Vite faz o mesmo papel.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
