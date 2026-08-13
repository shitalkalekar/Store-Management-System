import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

// Independently built federation REMOTE. The Core shell loads remoteEntry.js at runtime.
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'result_analysis',
      filename: 'remoteEntry.js',
      exposes: { './Module': './src/expose.js' },
      shared: ['react', 'react-dom'],
    }),
  ],
  server: {
    port: 3009,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4009',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/result-analysis'),
      },
    },
  },
  build: { target: 'esnext', modulePreload: false, cssCodeSplit: false },
});
