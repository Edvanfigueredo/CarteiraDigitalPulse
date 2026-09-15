import { defineConfig } from 'vite';

// base: './' garante que o build funcione tanto na raiz de um domínio
export default defineConfig({
  base: '/CarteiraDigitalPulse/',
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  server: {
    port: 5173,
    open: true
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['fake-indexeddb/auto'],
    globals: false
  }
});
