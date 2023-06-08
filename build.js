import build from '@webformula/core/build';
import esbuild from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { gzip } from 'node:zlib';
import { promisify } from 'node:util';

const asyncGzip = promisify(gzip);
const cssFilterRegex = /\.css$/;


build({
  basedir: 'docs/',
  outdir: 'dist/',
  devServer: { enabled: true },
  copyFiles: [
    { from: 'src/theme.css', to: 'dist/theme.css', gzip: true },
    { from: 'docs/favicon.ico', to: 'dist/' },
    { from: 'docs/woman.jpg', to: 'dist/' },
    {
      from: 'docs/pages/**/(?!page)*.html',
      to: 'dist/pages/',
      transform({ content, outputFileNames }) {
        if (outputFileNames) return content.replace('app.css', outputFileNames.find(name => name.includes('.css')).split('/').pop());
        return content;
      }
    }
  ],
  onStart() {
    // build separate file for iframe pages without app code.
    context.rebuild();
  }
});

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
  }
};
const context = await esbuild.context({
  entryPoints: ['src/index.js'],
  bundle: true,
  outfile: 'dist/material.js',
  format: 'esm',
  target: 'esnext',
  loader: { '.html': 'text' },
  plugins: [plugin],
  minify: true
});

await gzipFile('dist/material.js');

async function gzipFile(file) {
  const result = await asyncGzip(await readFile(file));
  await writeFile(`${file}.gz`, result);
}
