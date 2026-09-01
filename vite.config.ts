import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ compilerOptions: { css: 'injected' } })],
  publicDir: 'public',
  build: {
    outDir: process.env.BUILD_OUT_DIR || 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        options: resolve(__dirname, 'options.html'),
        content: resolve(__dirname, 'src/app/content/main.ts'),
        background: resolve(__dirname, 'src/background/main.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names?.[0] ?? 'asset';
          if (name.endsWith('.css')) return 'assets/[name]-[hash][extname]';
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
