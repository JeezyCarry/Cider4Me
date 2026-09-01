import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ compilerOptions: { css: 'injected' } })],
  publicDir: false,
  build: {
    outDir: process.env.BUILD_OUT_DIR || 'dist',
    emptyOutDir: false,
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/background/main.ts'),
      formats: ['es'],
      fileName: () => 'background.js',
    },
  },
});
