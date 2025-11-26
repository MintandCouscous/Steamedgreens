import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // -----------------------------------------------------------------------
    // CRITICAL: PASTE YOUR NEW API KEY BELOW
    // The previous key was blocked by Google because it was detected publicly.
    // -----------------------------------------------------------------------
    'process.env.API_KEY': JSON.stringify('AIzaSyAtEBz45P1syHr8yG3DKJ9Mxmo1wsJX_W0'),
  },
});