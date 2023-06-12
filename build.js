import build from '@webformula/core/build';
import esbuild from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { gzip } from 'node:zlib';
import { promisify } from 'node:util';

const asyncGzip = promisify(gzip);
const cssFilterRegex = /\.css$/;

const plugin = {
  name: 'plugin',
  setup(build) {
    build.onLoad({ filter: cssFilterRegex }, async args => {
      const contextCss = await esbuild.build({
        entryPoints: [args.path],
        bundle: true,
        write: false,
        minify: true,
        loader: { '.css': 'css' }
      });
      const contents = `
        const styles = new CSSStyleSheet();
        styles.replaceSync(\`${contextCss.outputFiles[0].text}\`);
        export default styles;`;
      return { contents };
    })
    build.onEnd(async () => {
      await gzipFile('dist/material.js');
    })
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

setTimeout(async () => {
  await gzipFile('dist/material.js');
}, 500);

async function gzipFile(file) {
  const result = await asyncGzip(await readFile(file));
  await writeFile(`${file}.gz`, result);
}
