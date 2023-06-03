import build from '@webformula/core/build';
import esbuild from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { gzip } from 'node:zlib'; 

const cssFilterRegex = /\.css$/;
const plugin = {
  name: 'plugin',
  setup(build) {
    build.onLoad({ filter: cssFilterRegex }, async args => {
      const css = await readFile(args.path, 'utf8');
      const transformed = await esbuild.transform(css, { minify: true, loader: 'css' });
      const contents = `
        const styles = new CSSStyleSheet();
        styles.replaceSync(\`${transformed.code}\`);
        export default styles;`;
      return { contents };
    });

    build.onEnd(async () => {
      gzip(await readFile('dist/material.js'), (error, result) => {
        writeFile('dist/material.js.gz', result);
      });
      gzip(await readFile('dist/theme.css'), (error, result) => {
        writeFile('dist/theme.css.gz', result);
      });
    })
  }
};
const context = await esbuild.context({
  entryPoints: ['src/index.js'],
  bundle: true,
  outfile: 'dist/material.js',
  loader: { '.html': 'text' },
  plugins: [plugin],
  minify: true
});


build({
  basedir: 'docs/',
  outdir: 'dist/',
  devServer: { enabled: true },
  copyFiles: [
    { from: 'src/theme.css', to: 'dist/theme.css'},
    { from: 'docs/favicon.ico', to: 'dist/' },
    { from: 'docs/woman.jpg', to: 'dist/' },
    { from: 'docs/pages/**/(?!page)*.html', to: 'dist/pages/' }
  ],
  onStart() {
    // build separate file for iframe pages without app code.
    context.rebuild();
  }
});
