import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        watch: {
          usePolling: true,
          interval: 1000,
        },
        hmr: {
          host: 'localhost',
          port: 5173,
        },
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
