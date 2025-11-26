import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // -----------------------------------------------------------------------
    // CRITICAL: PASTE YOUR NEW API KEY BELOW
    // The previous key was blocked by Google because it was detected publicly.
    // -----------------------------------------------------------------------
    'process.env.API_KEY': JSON.stringify('AIzaSyDxLX87kJLpDvrSy8xSyN0hztGB24-tG1U'),
  },
});