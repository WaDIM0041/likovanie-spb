const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');

function run(script, args, cwd) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

for (const name of ['motion-utils', 'motion-dom', 'framer-motion']) {
  const cwd = path.join(root, 'vendor/motion/packages', name);
  console.log(`Building ${name}`);
  run(path.join(root, 'node_modules/typescript/bin/tsc'), ['--noEmitOnError', '-p', '.'], cwd);
  run(path.join(root, 'node_modules/rollup/dist/bin/rollup'), ['-c'], cwd);
  if (name !== 'motion-utils') run(path.join(cwd, 'scripts/check-bundle.js'), [], cwd);
}
