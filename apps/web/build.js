const esbuild = require('esbuild');
const path = require('path');

async function build() {
  await esbuild.build({
    entryPoints: [path.join(__dirname, 'src', 'main.tsx')],
    bundle: true,
    minify: true,
    sourcemap: false,
    outfile: path.join(__dirname, 'bundle.js'),
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts',
    },
  });
  console.log('[alpha-web] Successfully bundled apps/web into bundle.js');
}

build().catch((err) => {
  console.error('[alpha-web] Build failed:', err);
  process.exit(1);
});
