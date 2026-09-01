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
      entry: resolve(__dirname, 'src/app/content/main.ts'),
      formats: ['es'],
      fileName: () => 'content-app.js',
    },
    // Single file so content.js dynamic import does not need extra WAR chunks.
    codeSplitting: false,
  },
});
