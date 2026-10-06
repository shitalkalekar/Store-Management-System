import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import cloudflarePagesAssets from './build/cloudflarePagesAssets.js';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  let rawApiBase = process.env.VITE_API_BASE_URL || env.VITE_API_BASE_URL || '';
  if (rawApiBase.startsWith('VITE_API_BASE_URL=')) {
    rawApiBase = rawApiBase.slice('VITE_API_BASE_URL='.length).trim();
  }
  rawApiBase = rawApiBase.replace(/^["']|["']$/g, '').trim();
  if (rawApiBase && (rawApiBase.startsWith('http://') || rawApiBase.startsWith('https://'))) {
    rawApiBase = rawApiBase.replace(/\/+$/, '');
    if (!rawApiBase.endsWith('/result-analysis')) {
      rawApiBase = `${rawApiBase}/result-analysis`;
    }
  }
  const apiBaseUrl = rawApiBase;
  if (command === 'build' && !apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is required for production builds');
  }

  process.env.VITE_API_BASE_URL = apiBaseUrl;

  return {
    plugins: [
      react(),
      // Only meaningful for `vite build`, where apiBaseUrl is guaranteed above.
      cloudflarePagesAssets({ apiBaseUrl }),
    ],
    server: {
      port: Number(env.VITE_DEV_PORT) || 3009,
      cors: true,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:4009',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/result-analysis'),
        },
      },
    },
    build: {
      target: 'es2020',
      sourcemap: false,
    },
  };
});
