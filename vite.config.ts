
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Using an empty string or './' allows the app to be deployed to any subfolder (like /sk-price-portal/)
  base: './', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // Ensures clean builds for GitHub Actions
    emptyOutDir: true,
  }
});
