import { copyFile, mkdir, unlink } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const target = process.argv[2] || 'firefox';

if (!['firefox', 'chrome'].includes(target)) {
  console.error("Target must be 'firefox' or 'chrome'");
  process.exit(1);
}

const outDir = resolve(process.cwd(), 'dist', target);
process.env.BUILD_OUT_DIR = outDir;

console.info(`[Sider][build] target=${target} to ${outDir} start`);

try {
  // Ensure outDir exists
  await mkdir(outDir, { recursive: true });

  // 1. Build options (clears outDir if emptyOutDir is true in config)
  execSync('vite build --config vite.config.options.ts', { 
    stdio: 'inherit',
    env: { ...process.env, BUILD_OUT_DIR: outDir }
  });

  // 2. Build content app
  execSync('vite build --config vite.config.content.ts', { 
    stdio: 'inherit',
    env: { ...process.env, BUILD_OUT_DIR: outDir }
  });

  // 3. Build background script
  execSync('vite build --config vite.config.background.ts', { 
    stdio: 'inherit',
    env: { ...process.env, BUILD_OUT_DIR: outDir }
  });

  // 4. Copy specific manifest to ${outDir}/manifest.json
  const source = resolve(process.cwd(), `public/manifest.${target}.json`);
  const dest = resolve(outDir, 'manifest.json');
  await copyFile(source, dest);

  // 5. Cleanup extra manifests in outDir if they were copied by publicDir
  try {
    await unlink(resolve(outDir, 'manifest.firefox.json'));
  } catch { /* ignore */ }
  try {
    await unlink(resolve(outDir, 'manifest.chrome.json'));
  } catch { /* ignore */ }
  try {
    await unlink(resolve(outDir, 'manifest.json.json')); // safety check for typos in public
  } catch { /* ignore */ }

  console.info(`[Sider][build] target=${target} success`);
} catch (error) {
  console.error(`[Sider][build] target=${target} failed`, error);
  process.exit(1);
}
