import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // We are hardcoding the key here to ensure it works immediately for you.
    // In a production team environment, we would switch back to process.env.
    'process.env.API_KEY': JSON.stringify('AIzaSyDox5A9c3_rg-BD8zCgdC186-EcOaOvzfM'),
  },
});