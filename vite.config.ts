
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        // Lokal kompyuterda '/api-tspay' ga kelgan so'rovlarni 'tspay.uz' ga yo'naltiramiz
        // Bu "Frontend -> Backend -> TsPay" zanjiridagi "Backend" vazifasini bajaradi
        '/api-tspay': {
          target: 'https://tspay.uz/api/v1',
          changeOrigin: true,
          secure: false, // SSL sertifikat xatolarini inkor etish (ba'zida kerak)
          rewrite: (path) => path.replace(/^\/api-tspay/, ''),
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              // So'rov yuborilayotganda log qilish (kerak bo'lsa)
            });
          },
        }
      }
    },
    plugins: [react()],
    css: {
      postcss: {
        plugins: [
          tailwindcss,
          autoprefixer,
        ],
      },
    },
    define: {
      'process.env': {} 
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    }
  };
});
