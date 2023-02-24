let initiated = false;
const keyColors = [
  '--mdw-primary-key',
  '--mdw-secondary-key',
  '--mdw-tertiary-key',
  '--mdw-error-key',
  '--mdw-neutral-key',
  '--mdw-neutral-variant-key'
];


export function generate() {
  polyFillColorSchemeObserver.disconnect();
  polyfillColorSchemePreference();
  generateKeyTones();

  const variables = getCSSVariables();

  // create alpha versions of colors
  const colorRegex = /^\s?#/;
  const colors = variables.filter(({ value, name }) => value.trim().match(colorRegex) !== null && !keyColors.includes(name));
  colors.forEach(({ name, value }) => {
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


  // Set font scaling. this can only run once. you can adjust all fonts using font-size on the html element
  if (!initiated) {
    // convert pixels to rem. used so all fonts scale with html.style.fontSize
    const fontSizes = variables.filter(({ name }) => name.startsWith('--mdw-font-size'));
    fontSizes.forEach(({ name, value }) => {
      document.documentElement.style.setProperty(name, `${parseInt(value.replace('px', '')) / 16}rem`);
    });
    initiated = true;
  }

  polyFillColorSchemeObserver.observe(document.querySelector('html'), { attributes: true, attributeFilter: ['style'] });
}

function getCSSVariables() {
  const computedStyles = getComputedStyle(document.body);
  const isDark = document.documentElement.classList.contains('mdw-theme-dark');
  return [...document.styleSheets]
    .filter(sheet => sheet.href === null || sheet.href.startsWith(window.location.origin))
    .flatMap(sheet => (
      [...sheet.cssRules]
        .filter(rule => {
          if (isDark) return rule.selectorText === ':root.mdw-theme-dark';
          return rule.selectorText === ':root';
        })
        .flatMap(rule => [...rule.style])
    ))
    .filter(style => style.startsWith('--'))
    .map(name => ({
      name,
      value: computedStyles.getPropertyValue(name)
    }));
}


function generateKeyTones() {
  const variables = getCSSVariables();
  const colors = variables.filter(({ name }) => keyColors.includes(name) || name.startsWith('--mdw-custom-color-'));
  colors.forEach(({ name, value }) => {
    const tones = generateColorTones(value);
    name = name.replace('-key', '');
    document.documentElement.style.setProperty(`${name}-0`, tones[0]);
    document.documentElement.style.setProperty(`${name}-10`, tones[1]);
    document.documentElement.style.setProperty(`${name}-20`, tones[2]);
    document.documentElement.style.setProperty(`${name}-30`, tones[3]);
    document.documentElement.style.setProperty(`${name}-40`, tones[4]);
    document.documentElement.style.setProperty(`${name}-50`, tones[5]);
    document.documentElement.style.setProperty(`${name}-60`, tones[6]);
    document.documentElement.style.setProperty(`${name}-70`, tones[7]);
    document.documentElement.style.setProperty(`${name}-80`, tones[8]);
    document.documentElement.style.setProperty(`${name}-90`, tones[9]);
    document.documentElement.style.setProperty(`${name}-95`, tones[10]);
    document.documentElement.style.setProperty(`${name}-99`, tones[11]);
    document.documentElement.style.setProperty(`${name}-100`, tones[12]);
  });
}


// this is not the same process that is used by material
// This is a close enough placeholder for now
function generateColorTones(value) {
  const [h, w, b] = hexToHwb(value);
  
  return [
    '#000000',
    hwbToHex([h + 4, zeroValue(w - 30), zeroValue(b + 30)]),
    hwbToHex([h + 2, zeroValue(w - 18), zeroValue(b + 20)]),
    hwbToHex([h + 1, zeroValue(w - 10), zeroValue(b + 10)]),
    value,
    hwbToHex([h, zeroValue(w + 9), zeroValue(b - 10)]),
    hwbToHex([h + 1, zeroValue(w + 22), zeroValue(b - 20)]),
    hwbToHex([h + 2, zeroValue(w + 34), zeroValue(b - 30)]),
    hwbToHex([h + 3, zeroValue(w + 42), zeroValue(b - 40)]),
    hwbToHex([h + 4, zeroValue(w + 52), zeroValue(b - 54)]),
    hwbToHex([h + 8, zeroValue(w + 59), zeroValue(b - 60)]),
    hwbToHex([h + 10, zeroValue(w + 62), zeroValue(b - 70)]),
    '#ffffff'
  ];
  // return [
  //   '#000000',
  //   hwbToHex([h + 4, zeroValue(w - 38), zeroValue(b + 30)]),
  //   hwbToHex([h + 2, zeroValue(w - 24), zeroValue(b + 20)]),
  //   hwbToHex([h + 1, zeroValue(w - 10), zeroValue(b + 10)]),
  //   value,
  //   hwbToHex([h + 1, zeroValue(w + 10), zeroValue(b - 10)]),
  //   hwbToHex([h + 1, zeroValue(w + 22), zeroValue(b - 20)]),
  //   hwbToHex([h + 2, zeroValue(w + 34), zeroValue(b - 30)]),
  //   hwbToHex([h + 3, zeroValue(w + 42), zeroValue(b - 40)]),
  //   hwbToHex([h + 7, zeroValue(w + 55), zeroValue(b - 50)]),
  //   hwbToHex([h + 8, zeroValue(w + 59), zeroValue(b - 60)]),
  //   hwbToHex([h + 10, zeroValue(w + 62), zeroValue(b - 70)]),
  //   '#ffffff'
  // ];


  // return [
  //   '#000000',
  //   hwbToHex([h + 4, zeroValue(w - 30), zeroValue(b + 29)]),
  //   hwbToHex([h + 3, zeroValue(w - 18), zeroValue(b + 23)]),
  //   hwbToHex([h, zeroValue(w - 9), zeroValue(b + 10)]),
  //   value,
  //   hwbToHex([h + 1, zeroValue(w + 10), zeroValue(b - 10)]),
  //   hwbToHex([h + 1, zeroValue(w + 22), zeroValue(b - 20)]),
  //   hwbToHex([h + 2, zeroValue(w + 34), zeroValue(b - 30)]),
  //   hwbToHex([h + 3, zeroValue(w + 42), zeroValue(b - 40)]),
  //   hwbToHex([h + 7, zeroValue(w + 55), zeroValue(b - 50)]),
  //   hwbToHex([h + 8, zeroValue(w + 59), zeroValue(b - 50)]),
  //   hwbToHex([h + 10, zeroValue(w + 62), zeroValue(b - 50)]),
  //   '#ffffff'
  // ];
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



// TODO update when browser compatibility is better
// currently prefer-color-scheme does not respect color-scheme so we are poly-filling it
// https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme
//   Respects color-scheme inherited from parent
const polyFillColorSchemeObserver = new MutationObserver(() => {
  generate();
});
function polyfillColorSchemePreference() {
  const themePreferenceDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const html = document.querySelector('html');
  const htmlColorScheme = getComputedStyle(html).colorScheme;

  if (themePreferenceDark === true && htmlColorScheme !== 'light') {
    html.classList.add('mdw-theme-dark');
  } else {
    html.classList.remove('mdw-theme-dark');
  }
}
