
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
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
    // Define global constants replacements
    // MUHIM: Faqat kerakli o'zgaruvchilarni alohida 'define' qilamiz.
    // 'process.env': ... deb butun obyektni yozish xatolik keltirib chiqaradi.
    define: {
      'process.env.TSPAY_API': JSON.stringify(env.TSPAY_API),
      'process.env.TSPAY_URL': JSON.stringify(env.TSPAY_URL),
      // Agar Vercel-da VITE_ prefiksi unutilgan bo'lsa, ularni ham qo'lda tanitamiz
      'process.env.SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || env.SUPABASE_URL),
      'process.env.SUPABASE_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || env.SUPABASE_KEY),
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
