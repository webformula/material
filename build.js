import build from '@webformula/core/build';
import esbuild from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { gzip } from 'node:zlib';
import { promisify } from 'node:util';

const asyncGzip = promisify(gzip);
const cssFilterRegex = /\.css$/;
const cssTagRegex = /<\s*link[^>]*href="\.?\/?app.css"[^>]*>/;


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
  devServer: {
    enabled: true,
    port: 3000,
    liveReload: true
  },
  chunks: false,
  minify: true,
  gzip: true,
  basedir: 'docs/',
  outdir: 'dist/',
  copyFiles: [
    { from: 'src/theme.css', to: 'dist/theme.css', gzip: true },
    { from: 'docs/favicon.ico', to: 'dist/' },
    { from: 'docs/woman.jpg', to: 'dist/' },
    { from: 'docs/icons.woff2', to: 'dist/' },
    {
      from: 'docs/pages/**/(?!page)*.html',
      to: 'dist/pages/',
      transform({ content, outputFileNames }) {
        if (outputFileNames) return content.replace(cssTagRegex, () => {
          const filename = outputFileNames
            .filter(v => !!v.entryPoint)
            .find(v => v.entryPoint.endsWith('app.css')).output.split('/').pop();
          return `<link href="/${filename}" rel="stylesheet">`;
        });
        return content;
      }
    },
    { from: 'docs/icons.woff2', to: 'dist/' }
  ],
  onStart() {
    // build separate file for iframe pages without app code.
    context.rebuild();
  }
});

async function gzipFile(file) {
  const result = await asyncGzip(await readFile(file));
  await writeFile(`${file}.gz`, result);
}
