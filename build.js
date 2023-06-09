import build from '@webformula/core/build';
import esbuild from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { gzip } from 'node:zlib';
import { promisify } from 'node:util';

const asyncGzip = promisify(gzip);
const cssFilterRegex = /\.css$/;

let d;
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
    d = Date.now()
    console.log('start')
    // build separate file for iframe pages without app code.
    context.rebuild();
  },
  onEnd() {
    console.log('end', Date.now() - d);
  }
});

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
      return { loader: 'text', contents: contextCss.outputFiles[0].text }
    })
  }
};
const context = await esbuild.context({
  entryPoints: ['src/index.js'],
  bundle: true,
  outfile: 'dist/material.js',
  format: 'esm',
  target: 'esnext',
  loader: { '.html': 'text', '.css': 'css' },
  plugins: [plugin],
  minify: true
});

setTimeout(async () => {
  await gzipFile('dist/material.js');
}, 500);

async function gzipFile(file) {
  const result = await asyncGzip(await readFile(file));
  await writeFile(`${file}.gz`, result);
}
