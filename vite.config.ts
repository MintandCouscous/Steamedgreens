import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // This is critical: it replaces process.env.API_KEY in your code with the actual value from Vercel
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  };
});