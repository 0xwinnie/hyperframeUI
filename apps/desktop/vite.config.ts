import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import path from 'node:path';

export default defineConfig({
  root: __dirname,
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
              output: { format: 'es', entryFileNames: '[name].js' },
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.ts'),
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
              // Output the preload as plain CJS with a .cjs extension so the
              // require()-based bundle vite-plugin-electron emits matches the
              // way Electron loads it (Electron 33 still treats .cjs as CJS,
              // whereas .mjs forces ESM and breaks the require call).
              output: { format: 'cjs', entryFileNames: '[name].cjs' },
            },
          },
        },
      },
      // Renderer-side Node integration is intentionally disabled.
      renderer: undefined,
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  clearScreen: false,
});
