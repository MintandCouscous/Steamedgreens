import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Safe loading of env variables
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Replaces process.env.API_KEY with the actual value or your provided key
      // This ensures the key exists even if Vercel env vars are not set
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
    },
  };
});