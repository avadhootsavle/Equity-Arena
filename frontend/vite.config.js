import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    port: 5173,
    // NOTE: plain string keys are PREFIX matches, which collide with client-side
    // routes ('/trade' swallowed '/trader', '/admin' swallowed the admin page).
    // Anchored regex keys are used so only real API paths are proxied and every
    // SPA route falls through to Vite's history fallback.
    proxy: {
      '^/auth/': 'http://localhost:5001',
      '^/stocks(/|$)': 'http://localhost:5001',
      '^/trade/': 'http://localhost:5001',
      '^/portfolio(/|$)': 'http://localhost:5001',
      '^/orders(/|$)': 'http://localhost:5001',
      '^/session(/|$)': 'http://localhost:5001',
      '^/news(/|$)': 'http://localhost:5001',
      '^/leaderboard/': 'http://localhost:5001',
      '^/health$': 'http://localhost:5001',
      // Only /admin/* API calls — bare '/admin' is the admin dashboard route.
      '^/admin/': 'http://localhost:5001',
      '^/api/': 'http://localhost:5001',
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
