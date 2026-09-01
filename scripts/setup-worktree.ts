import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

/**
 * Setup script for git worktrees.
 * Ensures dependencies are installed and the build is verified.
 */
async function runCommand(command: string, args: string[]): Promise<void> {
  console.info(`\n> ${command} ${args.join(' ')}`);
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: 'inherit', shell: true });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });
  });
}

async function setup() {
  const rootDir = process.cwd();
  const nodeModulesPath = join(rootDir, 'node_modules');

  console.info('--- Worktree Setup Initialized ---');

  if (!existsSync(nodeModulesPath)) {
    console.info('node_modules not found. Installing dependencies...');
    try {
      await runCommand('bun', ['install']);
    } catch (error) {
      console.error('Failed to install dependencies:', error);
      process.exit(1);
    }
  } else {
    console.info('node_modules already present. Skipping installation.');
  }

  console.info('\nVerifying build...');
  try {
    await runCommand('bun', ['run', 'build']);
    console.info('\n--- Worktree Setup Complete and Verified ---');
  } catch (error) {
    console.error('Build verification failed. Please check the errors above.', error);
    process.exit(1);
  }
}

void setup();
