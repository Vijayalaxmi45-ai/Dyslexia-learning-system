import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/register': { target: 'http://localhost:4000', changeOrigin: true },
      '/login': { target: 'http://localhost:4000', changeOrigin: true },
      '/user-data': { target: 'http://localhost:4000', changeOrigin: true },
      '/progress': { target: 'http://localhost:4000', changeOrigin: true },
      '/quiz-score': { target: 'http://localhost:4000', changeOrigin: true },
      '/quiz-scores': { target: 'http://localhost:4000', changeOrigin: true },
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      '/admin': { target: 'http://localhost:4000', changeOrigin: true },
      '/health': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
});
