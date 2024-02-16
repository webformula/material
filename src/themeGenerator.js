import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { argbFromHex, hexFromArgb, themeFromSourceColor, TonalPalette } from "@material/material-color-utilities";

const tones = [100, 98, 96, 95, 94, 92, 90, 87, 80, 70, 60, 50, 40, 35, 30, 25, 24, 22, 20, 17, 12, 10, 6, 4, 0];
// TODO replace alphas with relative color syntax when supported by all browsers https://developer.chrome.com/blog/css-relative-color-syntax/ - https://caniuse.com/css-relative-colors
// currently on producing required alphas
const colorsForAlpha = [
  ['--wfc-primary', 'primary', '40'],
  ['--wfc-on-primary', 'primary', '100'],
  ['--wfc-on-primary-container', 'primary', '10'],
  ['--wfc-on-secondary-container', 'secondary', '10'],
  ['--wfc-surface', 'neutral', '98'],
  ['--wfc-on-surface', 'neutral', '10'],
  ['--wfc-on-surface-variant', 'neutral-variant', '30'],
  ['--wfc-surface-tint', 'primary', '40'],
  ['--wfc-outline', 'neutral-variant', '50'],
  ['--wfc-shadow', 'neutral', '0'],
  ['--wfc-scrim', 'neutral', '0'],
];


export default async function generate(config = {
  customColors: {
    primary: '#6750A4',
    secondary: '#625B71',
    tertiary: '#7D5260',
    neutral: '#67616f',
    neutralVariant: '#605666',
    error: '#B3261E'
  },
  customColors: [
    {
      name: 'customColor',
      color: '#5b7166'
    }
  ]
}, outputFilePath = './colorTokens.css') {
  const palette = createTheme(config);
  const content = `
    :root {
      ${Object.entries(palette.palettes).flatMap(([name, tones]) => {
        return Object.entries(tones).map(([tone, color]) => `--wfc-${name}-${tone}: ${color};`);
      }).join('\n  ')}
      \n\n
      /* alphas */
      ${palette.alphas.map(v => `${v.join(': ')};`).join('\n  ')}
      ${palette.customColors.length === 0 ? '' : '\n\n  /* custom colors */'}
      ${palette.customColors.flatMap(item => item.light.map(v => `${v.join(': ')};`).join('\n  '))}
    }
    ${palette.customColors.length === 0 ? '' : `
    .wfc-theme-dark,
    :root.wfc-theme-dark {
      /* custom colors */
      ${palette.customColors.flatMap(item => item.dark.map(v => `${v.join(': ')};`).join('\n  '))}
    }`}
  `.replace(/^\s\s\s\s/gm, '');
  
  await writeFile(path.resolve('.', outputFilePath), content);
}


function createTheme({ coreColors, customColors }) {
  if (!coreColors.primary) return;

  const sourceTheme = themeFromSourceColor(argbFromHex(coreColors.primary), (customColors || []).map(({ name, color }) => ({ name, value: color })));
  const palettes = {
    primary: Object.fromEntries(tones.map(tone => ([tone, hexFromArgb(sourceTheme.palettes.primary.tone(tone))]))),
    secondary: !coreColors.secondary && Object.fromEntries(tones.map(tone => ([tone, hexFromArgb(sourceTheme.palettes.secondary.tone(tone))]))),
    tertiary: !coreColors.tertiary && Object.fromEntries(tones.map(tone => ([tone, hexFromArgb(sourceTheme.palettes.tertiary.tone(tone))]))),
    neutral: !coreColors.neutral && Object.fromEntries(tones.map(tone => ([tone, hexFromArgb(sourceTheme.palettes.neutral.tone(tone))]))),
    neutralVariant: !coreColors.neutralVariant && Object.fromEntries(tones.map(tone => ([tone, hexFromArgb(sourceTheme.palettes.neutralVariant.tone(tone))]))),
    error: !coreColors.error && Object.fromEntries(tones.map(tone => ([tone, hexFromArgb(sourceTheme.palettes.error.tone(tone))])))
  };

  for (const [key, value] of Object.entries(coreColors)) {
    if (key === 'primary' || !value) continue;

    const palette = TonalPalette.fromInt(argbFromHex(value));
    palettes[key] = Object.fromEntries(tones.map(tone => ([tone, hexFromArgb(palette.tone(tone))])));
  }

  palettes['neutral-variant'] = palettes.neutralVariant;
  delete palettes.neutralVariant;
  const customColorsResult = (sourceTheme.customColors || []).map(item => ({
    name: item.color.name,
    color: item.value,
    light: [
      [`--wfc-custom-color-${item.color.name}-color`, hexFromArgb(item.light.color)],
      [`--wfc-custom-color-${item.color.name}-on-color`, hexFromArgb(item.light.onColor)],
      [`--wfc-custom-color-${item.color.name}-color-container`, hexFromArgb(item.light.colorContainer)],
      [`--wfc-custom-color-${item.color.name}-on-color-container`, hexFromArgb(item.light.onColorContainer)],
    ],
    dark: [
      [`--wfc-custom-color-${item.color.name}-color`, hexFromArgb(item.dark.color)],
      [`--wfc-custom-color-${item.color.name}-on-color`, hexFromArgb(item.dark.onColor)],
      [`--wfc-custom-color-${item.color.name}-color-container`, hexFromArgb(item.dark.colorContainer)],
      [`--wfc-custom-color-${item.color.name}-on-color-container`, hexFromArgb(item.dark.onColorContainer)],
    ]
  }));

  return {
    palettes,
    customColors: customColorsResult,
    alphas: colorsForAlpha.flatMap(([name, core, tone]) => {
      return [
        [`${name}-alpha-0`, `${palettes[core][tone]}00`],
        [`${name}-alpha-4`, `${palettes[core][tone]}0a`],
        [`${name}-alpha-5`, `${palettes[core][tone]}0d`],
        [`${name}-alpha-6`, `${palettes[core][tone]}0f`],
        [`${name}-alpha-8`, `${palettes[core][tone]}14`],
        [`${name}-alpha-10`, `${palettes[core][tone]}1a`],
        [`${name}-alpha-11`, `${palettes[core][tone]}1c`],
        [`${name}-alpha-12`, `${palettes[core][tone]}1f`],
        [`${name}-alpha-16`, `${palettes[core][tone]}29`],
        [`${name}-alpha-20`, `${palettes[core][tone]}33`],
        [`${name}-alpha-26`, `${palettes[core][tone]}42`],
        [`${name}-alpha-38`, `${palettes[core][tone]}61`],
        [`${name}-alpha-60`, `${palettes[core][tone]}99`],
        [`${name}-alpha-76`, `${palettes[core][tone]}c2`]
      ];
    })
  }
}
