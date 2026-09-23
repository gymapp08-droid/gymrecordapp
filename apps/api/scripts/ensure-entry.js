const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');

const candidates = [
  path.join(distDir, 'apps', 'api', 'src', 'main.js'),
  path.join(distDir, 'src', 'main.js'),
  path.join(distDir, 'apps', 'api', 'main.js'),
];

const target = candidates.find((candidate) => fs.existsSync(candidate));
const entryFile = path.join(distDir, 'main.js');

if (target && target !== entryFile) {
  const relativeTarget = './' + path.relative(distDir, target).replace(/\\/g, '/');
  fs.writeFileSync(
    entryFile,
    `// Auto-generated entrypoint shim for Render deployment\nrequire('${relativeTarget}');\n`,
    'utf-8'
  );
  console.log(`[ensure-entry] Created ${entryFile} -> ${relativeTarget}`);
} else if (fs.existsSync(entryFile)) {
  console.log(`[ensure-entry] ${entryFile} already exists`);
} else {
  console.error(`[ensure-entry] Warning: Could not locate main.js target in ${distDir}`);
}
