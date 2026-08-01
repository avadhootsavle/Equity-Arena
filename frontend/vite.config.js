import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:5001',
      '/stocks': 'http://localhost:5001',
      '/trade': 'http://localhost:5001',
      '/portfolio': 'http://localhost:5001',
      '/admin': 'http://localhost:5001',
      '/socket.io': {
        target: 'http://localhost:5001',
        ws: true
      }
    }
  }
});
