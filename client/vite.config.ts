import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// The SPA is served under /dina/ on the DINA domain (mirrors Mirror's /Mirror/).
// `base` makes Vite emit asset URLs under that prefix; the router uses the same
// prefix as its basename (see router.tsx via import.meta.env.BASE_URL).
const BASE = '/dina';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // In dev, proxy the same-origin API prefix to the DINA server so the SPA and
  // API share an origin (no CORS, cookies flow). Only /dina/api is proxied;
  // /dina/* asset requests are served by Vite.
  const apiTarget = env.VITE_DEV_API_TARGET || 'https://localhost:8445';

  return {
    base: BASE,
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/dina/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false, // dev server uses a self-signed cert
        },
      },
    },
    preview: { port: 4173, strictPort: true },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      target: 'es2021',
    },
  };
});
