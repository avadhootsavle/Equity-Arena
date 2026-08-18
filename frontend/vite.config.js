import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:5001',
      '/stocks': 'http://localhost:5001',
      '/trade': 'http://localhost:5001',
      '/portfolio': 'http://localhost:5001',
      '/orders': 'http://localhost:5001',
      '/admin': 'http://localhost:5001',
      '/session': 'http://localhost:5001',
      '/api': 'http://localhost:5001',
      '/socket.io': {
        target: 'http://localhost:5001',
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, _res) => {
            // Quietly swallow dev-server WS pipe disconnect errors during backend reloads
            if (err.code === 'EPIPE' || err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') {
              return;
            }
            console.warn('[Vite WS Proxy Error]:', err.message);
          });
        }
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }
});
