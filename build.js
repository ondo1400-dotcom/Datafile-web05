const esbuild = require('esbuild');
const watch = process.argv.includes('--watch');

const opts = {
  entryPoints: ['src/index.jsx'],
  bundle: true,
  outfile: 'js/notion-table-bundle.js',
  format: 'iife',
  external: ['react', 'react-dom', 'react-dom/client'],
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  target: 'es2020',
  define: { 'process.env.NODE_ENV': '"production"' },
};

if (watch) {
  esbuild.context(opts).then(ctx => {
    ctx.watch();
    console.log('Watching for changes...');
  });
} else {
  esbuild.build(opts).then(() => console.log('Build complete: js/notion-table-bundle.js'));
}
