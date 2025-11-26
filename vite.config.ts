import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Replaces process.env.API_KEY with the actual value or your hardcoded key
      'process.env.API_KEY': JSON.stringify(env.API_KEY || 'AIzaSyDox5A9c3_rg-BD8zCgdC186-EcOaOvzfM'),
    },
  };
});