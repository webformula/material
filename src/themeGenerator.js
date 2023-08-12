import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const cssCommentsRegex = /\/\*[\s\S]*?\*\//g;
const lightRegex = /:root\s?\{([^\}]*)}/;
const darkRegex = /:root.mdw-theme-dark\s?\{([^\}]*)}/;
const primaryBaseLineRegex = /--mdw-primary-baseline:\s?(.+);/;
const secondaryBaseLineRegex = /--mdw-secondary-baseline:\s?(.+);/;
const tertiaryBaseLineRegex = /--mdw-tertiary-baseline:\s?(.+);/;
const errorBaseLineRegex = /--mdw-error-baseline:\s?(.+);/;
const neutralBaseLineRegex = /--mdw-neutral-baseline:\s?(.+);/;
const neutralVariantBaseLineRegex = /--mdw-neutral-variant-baseline:\s?(.+);/;
const customColorRegex = /--mdw-custom-(.+):\s?(.+);/g;
const colorVarRegex = /--mdw-(.+):\s?var\(--mdw-(.+)\);/g;
const otherVarRegex = /--mdw-(.+):\s?[^v#;]*;/g;

export default async function generate(styleSheet, outputFilePath) {
  if (!outputFilePath) throw Error('outputFilePath required');

  const file = await readFile(styleSheet, 'utf-8');
  const cleaned = file.replace(cssCommentsRegex, '');
  const light = cleaned.match(lightRegex)[1];
  const dark = cleaned.match(darkRegex)[1];

  const baselines = [
    ['primary', light.match(primaryBaseLineRegex)[1]],
    ['secondary', light.match(secondaryBaseLineRegex)[1]],
    ['tertiary', light.match(tertiaryBaseLineRegex)[1]],
    ['error', light.match(errorBaseLineRegex)[1]],
    ['neutral', light.match(neutralBaseLineRegex)[1]],
    ['neutral-variant', light.match(neutralVariantBaseLineRegex)[1]],
    ...[...light.matchAll(customColorRegex)].map(([_, name, value]) => [`custom-color-${name}`, value])
  ];

  const toneValues = baselines.flatMap(([name, value]) => {
    const tones = generateColorTones(value);
    return [
      [name, value],
      [`${name}-0`, tones[0]],
      [`${name}-4`, tones[1]],
      [`${name}-6`, tones[2]],
      [`${name}-10`, tones[3]],
      [`${name}-12`, tones[4]],
      [`${name}-17`, tones[5]],
      [`${name}-20`, tones[6]],
      [`${name}-22`, tones[7]],
      [`${name}-24`, tones[8]],
      [`${name}-30`, tones[9]],
      [`${name}-40`, tones[10]],
      [`${name}-50`, tones[11]],
      [`${name}-60`, tones[12]],
      [`${name}-70`, tones[13]],
      [`${name}-80`, tones[14]],
      [`${name}-87`, tones[15]],
      [`${name}-90`, tones[16]],
      [`${name}-92`, tones[17]],
      [`${name}-94`, tones[18]],
      [`${name}-95`, tones[19]],
      [`${name}-96`, tones[20]],
      [`${name}-98`, tones[21]],
      [`${name}-100`, tones[22]],
    ];
  });
 
  const colorVarsLight = [...light.matchAll(colorVarRegex)]
    .map(([_, name, varName]) => [name, toneValues.find(v => v[0] === varName)[1]]);
  const colorVarsAlphasLight = colorVarsLight.flatMap(([name, value]) => [
    `--mdw-${name}: ${value};`,
    `--mdw-${name}-alpha-0: ${value}00;`,
    `--mdw-${name}-alpha-4: ${value}0a;`,
    `--mdw-${name}-alpha-5: ${value}0d;`,
    `--mdw-${name}-alpha-6: ${value}0f;`,
    `--mdw-${name}-alpha-8: ${value}14;`,
    `--mdw-${name}-alpha-10: ${value}1a;`,
    `--mdw-${name}-alpha-11: ${value}1c;`,
    `--mdw-${name}-alpha-12: ${value}1f;`,
    `--mdw-${name}-alpha-16: ${value}29;`,
    `--mdw-${name}-alpha-20: ${value}33;`,
    `--mdw-${name}-alpha-26: ${value}42;`,
    `--mdw-${name}-alpha-38: ${value}61;`,
    `--mdw-${name}-alpha-60: ${value}99;`,
    `--mdw-${name}-alpha-76: ${value}c2;`
  ]);
  
  const colorVarsDark = [...dark.matchAll(colorVarRegex)]
    .map(([_, name, varName]) => [name, toneValues.find(v => v[0] === varName)[1]]);
  const colorVarsAlphasDark = colorVarsDark.flatMap(([name, value]) => [
    `--mdw-${name}: ${value};`,
    `--mdw-${name}-alpha-0: ${value}00;`,
    `--mdw-${name}-alpha-4: ${value}0a;`,
    `--mdw-${name}-alpha-5: ${value}0d;`,
    `--mdw-${name}-alpha-6: ${value}0f;`,
    `--mdw-${name}-alpha-8: ${value}14;`,
    `--mdw-${name}-alpha-10: ${value}1a;`,
    `--mdw-${name}-alpha-11: ${value}1c;`,
    `--mdw-${name}-alpha-12: ${value}1f;`,
    `--mdw-${name}-alpha-16: ${value}29;`,
    `--mdw-${name}-alpha-20: ${value}33;`,
    `--mdw-${name}-alpha-26: ${value}42;`,
    `--mdw-${name}-alpha-38: ${value}61;`,
    `--mdw-${name}-alpha-60: ${value}99;`,
    `--mdw-${name}-alpha-76: ${value}c2;`
  ]);

  const customColorsDark = [...dark.matchAll(customColorRegex)].map(([_, name, value]) => [`custom-color-${name}`, value]);
  const customColorTonesDark = customColorsDark.flatMap(([name, value]) => {
    const tones = generateColorTones(value);
    return [
      `--mdw-${name}-0: ${tones[0]};`,
      `--mdw-${name}-4: ${tones[1]};`,
      `--mdw-${name}-6: ${tones[2]};`,
      `--mdw-${name}-10: ${tones[3]};`,
      `--mdw-${name}-12: ${tones[4]};`,
      `--mdw-${name}-17: ${tones[5]};`,
      `--mdw-${name}-20: ${tones[6]};`,
      `--mdw-${name}-22: ${tones[7]};`,
      `--mdw-${name}-24: ${tones[8]};`,
      `--mdw-${name}-30: ${tones[9]};`,
      `--mdw-${name}-40: ${tones[10]};`,
      `--mdw-${name}-50: ${tones[11]};`,
      `--mdw-${name}-60: ${tones[12]};`,
      `--mdw-${name}-70: ${tones[13]};`,
      `--mdw-${name}-80: ${tones[14]};`,
      `--mdw-${name}-87: ${tones[15]};`,
      `--mdw-${name}-90: ${tones[16]};`,
      `--mdw-${name}-92: ${tones[17]};`,
      `--mdw-${name}-94: ${tones[18]};`,
      `--mdw-${name}-95: ${tones[19]};`,
      `--mdw-${name}-96: ${tones[20]};`,
      `--mdw-${name}-98: ${tones[21]};`,
      `--mdw-${name}-100: ${tones[22]};`
    ];
  });

  const content = `/* hide while loading */
html:not(.mdw-initiated) body {
  opacity: 0;
  pointer-events: none;
}
:root {
  /* tones */
  ${toneValues.map(([name, value]) => `--mdw-${name}: ${value};`).join('\n  ')}

  /* colors */
  ${colorVarsAlphasLight.join('\n  ')}

  /* non color */
  ${[...light.match(otherVarRegex)].join('\n  ')}
}

:root.mdw-theme-dark {
  /* colors */
  ${colorVarsAlphasDark.join('\n  ')}
  ${customColorTonesDark.join('\n  ')}
}`;

  await writeFile(path.resolve('.', outputFilePath), content);
}


// this is not the same process that is used by material
// This is a close enough placeholder for now
function generateColorTones(value) {
  const [h, w, b] = hexToHwb(value);

  return [
    '#000000', // 0
    hwbToHex([h + 6, zeroValue(w - 36), zeroValue(b + 36)]), // 4
    hwbToHex([h + 5, zeroValue(w - 34), zeroValue(b + 34)]), // 6
    hwbToHex([h + 4, zeroValue(w - 30), zeroValue(b + 30)]), // 10
    hwbToHex([h + 4, zeroValue(w - 28), zeroValue(b + 28)]), // 12
    hwbToHex([h + 3, zeroValue(w - 12), zeroValue(b + 22)]), // 17
    hwbToHex([h + 2, zeroValue(w - 18), zeroValue(b + 20)]), // 20
    hwbToHex([h + 2, zeroValue(w - 16), zeroValue(b + 18)]), // 22
    hwbToHex([h + 2, zeroValue(w - 15), zeroValue(b + 16)]), // 24
    hwbToHex([h + 1, zeroValue(w - 10), zeroValue(b + 10)]), // 30
    value, // 40
    hwbToHex([h, zeroValue(w + 9), zeroValue(b - 10)]), // 50
    hwbToHex([h + 1, zeroValue(w + 22), zeroValue(b - 20)]), // 60
    hwbToHex([h + 2, zeroValue(w + 34), zeroValue(b - 30)]), // 70 x
    hwbToHex([h + 3, zeroValue(w + 42), zeroValue(b - 40)]), // 80
    hwbToHex([h + 4, zeroValue(w + 49), zeroValue(b - 50)]), // 87
    hwbToHex([h + 4, zeroValue(w + 52), zeroValue(b - 54)]), // 90
    hwbToHex([h + 5, zeroValue(w + 55), zeroValue(b - 57)]), // 92
    hwbToHex([h + 7, zeroValue(w + 58), zeroValue(b - 59)]), // 94
    hwbToHex([h + 8, zeroValue(w + 59), zeroValue(b - 60)]), // 95
    hwbToHex([h + 9, zeroValue(w + 60), zeroValue(b - 62)]), // 96
    hwbToHex([h + 10, zeroValue(w + 61), zeroValue(b - 68)]), // 98
    '#ffffff' // 100
  ];
}

function zeroValue(value) {
  if (value < 0) value = 0;
  return value;
}

function hwbToHex(hwb) {
  const h = hwb[0] / 360;
  let wh = hwb[1] / 100;
  let bl = hwb[2] / 100;
  const ratio = wh + bl;
  let i;
  let v;
  let f;
  let n;

  // wh + bl cant be > 1
  if (ratio > 1) {
    wh /= ratio;
    bl /= ratio;
  }

  i = Math.floor(6 * h);
  v = 1 - bl;
  f = 6 * h - i;

  if ((i & 0x01) !== 0) f = 1 - f;
  n = wh + f * (v - wh); // linear interpolation

  let r;
  let g;
  let b;
  switch (i) {
    default:
    case 6:
    case 0: r = v; g = n; b = wh; break;
    case 1: r = n; g = v; b = wh; break;
    case 2: r = wh; g = v; b = n; break;
    case 3: r = wh; g = n; b = v; break;
    case 4: r = n; g = wh; b = v; break;
    case 5: r = v; g = wh; b = n; break;
  }

  return '#' + [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)].map(x => {
    const hex = parseInt(x).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('');
};

function hexToHwb(hex) {
  hex = hex.trim();
  if (hex[0] === "#") hex = hex.slice(1);

  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) {
    return [
      0,                     // hue       (from 0 to 360 in degrees)
      100 * min / 255,       // whiteness (from 0 to 100 in %)
      100 - 100 * max / 255  // blackness (from 0 to 100 in %)
    ];
  }
  let tmp = 0.0;
  switch (max) {
    case r:
      tmp = (g - b) / (max - min) + 0.0;
      break;
    case g:
      tmp = (b - r) / (max - min) + 2.0;
      break;
    case b:
      tmp = (r - g) / (max - min) + 4.0;
      break;
  }
  const hue = (tmp + 6.0) % 6.0 / 6.0;
  return [
    360 * hue,             // hue       (from 0 to 360 in degrees)
    100 * min / 255,       // whiteness (from 0 to 100 in %)
    100 - 100 * max / 255  // blackness (from 0 to 100 in %)
  ];
}
