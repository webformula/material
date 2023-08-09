const keyColors = [
  '--mdw-primary-baseline',
  '--mdw-secondary-baseline',
  '--mdw-tertiary-baseline',
  '--mdw-error-baseline',
  '--mdw-neutral-baseline',
  '--mdw-neutral-variant-baseline'
];
const colorRegex = /^\s?#/;


export async function generate() {
  /* Handle color scheme
   *  1. check localStorage for mdw-color-scheme (can be used for user preference)
   *  2. check for mdw-theme-dark class
   *  3. check for color-scheme css var on :root
   *  4. check prefers-color-scheme
   */
  // to execute this code quickly as possible we do not wait for DOMContentLoaded
  // 99% of the time this is fine, but once in a while document.body is not available so we add this line as a safety net
  if (!document.body) await new Promise(resolve => document.addEventListener('DOMContentLoaded', () => resolve()));
  else await new Promise(resolve => requestAnimationFrame(resolve)); // make sure css is registered

  const computedStyles = getComputedStyle(document.body);
  const localStorageColorScheme = localStorage.getItem('mdw-color-scheme');
  let isDark = false;
  if (['light', 'dark'].includes(localStorageColorScheme)) {
    isDark = localStorageColorScheme === 'dark';
    document.documentElement.classList.toggle('mdw-theme-dark', isDark);
  } else if (!document.documentElement.classList.contains('mdw-theme-dark')) {
    const htmlColorScheme = computedStyles.colorScheme;
    const themePreferenceDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    isDark = themePreferenceDark === true && htmlColorScheme !== 'light';
    document.documentElement.classList.toggle('mdw-theme-dark', isDark);
  }

  generateKeyTones(computedStyles, isDark);

  const colorVariables = [...document.styleSheets, ...document.adoptedStyleSheets]
    .filter(sheet => sheet.href === null || sheet.href.startsWith(window.location.origin))
    .flatMap(sheet => (
      [...sheet.cssRules]
        .filter(rule => rule.selectorText === ':root' || (isDark && rule.selectorText === ':root.mdw-theme-dark'))
        .flatMap(rule => [...rule.styleMap]
          .map(v => ({ name: v[0], value: computedStyles.getPropertyValue(v[0]) }))
          .filter(v => v.name.startsWith('--') && !keyColors.includes(v.name) && v.value.match(colorRegex)))
    ));

  // create alpha versions of colors
  colorVariables.forEach(({ name, value }) => {
    document.documentElement.style.setProperty(`${name}-alpha-0`, `${value}00`);
    document.documentElement.style.setProperty(`${name}-alpha-4`, `${value}0a`);
    document.documentElement.style.setProperty(`${name}-alpha-5`, `${value}0d`);
    document.documentElement.style.setProperty(`${name}-alpha-6`, `${value}0f`);
    document.documentElement.style.setProperty(`${name}-alpha-8`, `${value}14`);
    document.documentElement.style.setProperty(`${name}-alpha-10`, `${value}1a`);
    document.documentElement.style.setProperty(`${name}-alpha-11`, `${value}1c`);
    document.documentElement.style.setProperty(`${name}-alpha-12`, `${value}1f`);
    document.documentElement.style.setProperty(`${name}-alpha-16`, `${value}29`);
    document.documentElement.style.setProperty(`${name}-alpha-20`, `${value}33`);
    document.documentElement.style.setProperty(`${name}-alpha-26`, `${value}42`);
    document.documentElement.style.setProperty(`${name}-alpha-38`, `${value}61`);
    document.documentElement.style.setProperty(`${name}-alpha-60`, `${value}99`);
    document.documentElement.style.setProperty(`${name}-alpha-76`, `${value}c2`);
  });

  // do not run code below ofter initiation
  if (document.documentElement.classList.contains('mdw-initiated')) return;

  const pageContent = document.querySelector('page-content');
  if (pageContent) {
    const computedStyle = getComputedStyle(pageContent);
    pageContent.style.setProperty('--mdw-page-content-padding-left', computedStyle.paddingLeft);
    pageContent.style.setProperty('--mdw-page-content-padding-right', computedStyle.paddingRight);
    pageContent.style.setProperty('--mdw-page-content-padding-top', computedStyle.paddingTop);
    pageContent.style.setProperty('--mdw-page-content-padding-bottom', computedStyle.paddingBottom);
    pageContent.style.padding = '';
    pageContent.style.paddingLeft = '';
    pageContent.style.paddingRight = '';
    pageContent.style.paddingTop = '';
    pageContent.style.paddingBottom = '';
  }

  document.documentElement.classList.add('mdw-initiated');
  setTimeout(() => {
    document.querySelector('body').classList.add('mdw-animation');
  }, 150);
}

function generateKeyTones(computedStyles, isDark) {
  const colorVariables = [...document.styleSheets, ...document.adoptedStyleSheets]
    .filter(sheet => sheet.href === null || sheet.href.startsWith(window.location.origin))
    .flatMap(sheet => (
      [...sheet.cssRules]
        .filter(rule => rule.selectorText === ':root' || (isDark && rule.selectorText === ':root.mdw-theme-dark'))
        .flatMap(rule => [...rule.styleMap]
          .map(v => ({ name: v[0], value: computedStyles.getPropertyValue(v[0]) }))
          .filter(v => (keyColors.includes(v.name) || v.name.startsWith('--mdw-custom-color-')) && v.value.match(colorRegex)))
    ));
  
  colorVariables.forEach(({ name, value }) => {
    const tones = generateColorTones(value);
    name = name.replace('-baseline', '');
 
    document.documentElement.style.setProperty(`${name}-0`, tones[0]);
    document.documentElement.style.setProperty(`${name}-6`, tones[1]);
    document.documentElement.style.setProperty(`${name}-10`, tones[2]);
    document.documentElement.style.setProperty(`${name}-20`, tones[3]);
    document.documentElement.style.setProperty(`${name}-30`, tones[4]);
    document.documentElement.style.setProperty(`${name}-40`, tones[5]);
    document.documentElement.style.setProperty(`${name}-50`, tones[6]);
    document.documentElement.style.setProperty(`${name}-60`, tones[7]);
    document.documentElement.style.setProperty(`${name}-70`, tones[8]);
    document.documentElement.style.setProperty(`${name}-80`, tones[9]);
    document.documentElement.style.setProperty(`${name}-90`, tones[10]);
    document.documentElement.style.setProperty(`${name}-92`, tones[11]);
    document.documentElement.style.setProperty(`${name}-94`, tones[12]);
    document.documentElement.style.setProperty(`${name}-95`, tones[13]);
    document.documentElement.style.setProperty(`${name}-96`, tones[14]);
    document.documentElement.style.setProperty(`${name}-98`, tones[15]);
    document.documentElement.style.setProperty(`${name}-100`, tones[16]);
  });
}


// this is not the same process that is used by material
// This is a close enough placeholder for now
function generateColorTones(value) {
  const [h, w, b] = hexToHwb(value);
  
  return [
    '#000000', // 0
    hwbToHex([h + 5, zeroValue(w - 34), zeroValue(b + 34)]), // 6
    hwbToHex([h + 4, zeroValue(w - 30), zeroValue(b + 30)]), // 10
    hwbToHex([h + 2, zeroValue(w - 18), zeroValue(b + 20)]), // 20
    hwbToHex([h + 1, zeroValue(w - 10), zeroValue(b + 10)]), // 30
    value, // 40
    hwbToHex([h, zeroValue(w + 9), zeroValue(b - 10)]), // 50
    hwbToHex([h + 1, zeroValue(w + 22), zeroValue(b - 20)]), // 60
    hwbToHex([h + 2, zeroValue(w + 34), zeroValue(b - 30)]), // 70 x
    hwbToHex([h + 3, zeroValue(w + 42), zeroValue(b - 40)]), // 80
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
