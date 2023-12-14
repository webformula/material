import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { generateBuild } from './core/theme.js';

const cssCommentsRegex = /\/\*[\s\S]*?\*\//g;
const rootRegex = /:root\s?\{([^\}]*)}/;
const primarySourceRegex = /--mdw-primary-source:\s?(.+);/;
const secondarySourceRegex = /--mdw-secondary-source:\s?(.+);/;
const tertiarySourceRegex = /--mdw-tertiary-source:\s?(.+);/;
const errorSourceRegex = /--mdw-error-source:\s?(.+);/;
const neutralSourceRegex = /--mdw-neutral-source:\s?(.+);/;
const neutralVariantSourceRegex = /--mdw-neutral-variant-source:\s?(.+);/;
const customColorRegex = /--mdw-custom-color-(.+):\s?(.+);/g;

export default async function generate(styleSheet, outputFilePath = './colorTokens.css') {
  const file = await readFile(styleSheet, 'utf-8');
  const cleaned = file.replace(cssCommentsRegex, '');
  const root = cleaned.match(rootRegex)[1];
  const palette = generateBuild({
    coreColors: {
      primary: root.match(primarySourceRegex)[1],
      secondary: (root.match(secondarySourceRegex) || [])[1],
      tertiary: (root.match(tertiarySourceRegex) || [])[1],
      neutral: (root.match(neutralSourceRegex) || [])[1],
      'neutral-variant': (root.match(neutralVariantSourceRegex) || [])[1],
      error: (root.match(errorSourceRegex) || [])[1]
    },
    customColors: [...root.matchAll(customColorRegex)].map(([_, name, color]) => ({ name, color }))
  });

  const content = `
    :root {
      ${Object.entries(palette.palettes).flatMap(([name, tones]) => {
        return Object.entries(tones).map(([tone, color]) => `--mdw-${name}-${tone}: ${color};`);
      }).join('\n  ')}
      \n\n
      /* alphas */
      ${palette.alphas.map(v => `${v.join(': ')};`).join('\n  ')}
      \n\n
      /* custom colors */
      ${palette.customColors.flatMap(item => item.values.map(v => `${v.join(': ')};`).join('\n  '))}
    }
  `.replace(/^\s\s\s\s/gm, '');
  
  await writeFile(path.resolve('.', outputFilePath), content);
}
