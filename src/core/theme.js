const tones = [100, 98, 96, 95, 94, 92, 90, 87, 80, 70, 60, 50, 40, 35, 30, 25, 24, 22, 20, 17, 12, 10, 6, 4, 0];
const viewingConditions = {
  n: 0.18418651851244416,
  aw: 29.98099719444734,
  nbb: 1.0169191804458757,
  ncb: 1.0169191804458757,
  c: 0.69,
  nc: 1,
  rgbD: [1.02117770275752, 0.9863077294280124, 0.9339605082802299],
  fl: 0.3884814537800353,
  fLRoot: 0.7894826179304937,
  z: 1.909169568483652
};
const SRGB_TO_XYZ = [[.41233895, .35762064, .18051042], [.2126, .7152, .0722], [.01932141, .11916382, .95034478]];
const LINRGB_FROM_SCALED_DISCOUNT = [[1373.2198709594231, -1100.4251190754821, -7.278681089101213], [-271.815969077903, 559.6580465940733, -32.46047482791194], [1.9622899599665666, -57.173814538844006, 308.7233197812385]];
const Y_FROM_LINRGB = [.2126, .7152, .0722];
const SCALED_DISCOUNT_FROM_LINRGB = [[.001200833568784504, .002389694492170889, 2.795742885861124E-4], [5.891086651375999E-4, .0029785502573438758, 3.270666104008398E-4], [1.0146692491640572E-4, 5.364214359186694E-4, .0032979401770712076]];
const CRITICAL_PLANES = [.015176349177441876, .045529047532325624, .07588174588720938, .10623444424209313, .13658714259697685, .16693984095186062, .19729253930674434, .2276452376616281, .2579979360165119, .28835063437139563, .3188300904430532, .350925934958123, .3848314933096426, .42057480301049466, .458183274052838, .4976837250274023, .5391024159806381, .5824650784040898, .6277969426914107, .6751227633498623, .7244668422128921, .775853049866786, .829304845476233, .8848452951698498, .942497089126609, 1.0022825574869039, 1.0642236851973577, 1.1283421258858297, 1.1946592148522128, 1.2631959812511864, 1.3339731595349034, 1.407011200216447, 1.4823302800086415, 1.5599503113873272, 1.6398909516233677, 1.7221716113234105, 1.8068114625156377, 1.8938294463134073, 1.9832442801866852, 2.075074464868551, 2.1693382909216234, 2.2660538449872063, 2.36523901573795, 2.4669114995532007, 2.5710888059345764, 2.6777882626779785, 2.7870270208169257, 2.898822059350997, 3.0131901897720907, 3.1301480604002863, 3.2497121605402226, 3.3718988244681087, 3.4967242352587946, 3.624204428461639, 3.754355295633311, 3.887192587735158, 4.022731918402185, 4.160988767090289, 4.301978482107941, 4.445716283538092, 4.592217266055746, 4.741496401646282, 4.893568542229298, 5.048448422192488, 5.20615066083972, 5.3666897647573375, 5.5300801301023865, 5.696336044816294, 5.865471690767354, 6.037501145825082, 6.212438385869475, 6.390297286737924, 6.571091626112461, 6.7548350853498045, 6.941541251256611, 7.131223617812143, 7.323895587840543, 7.5195704746346665, 7.7182615035334345, 7.919981813454504, 8.124744458384042, 8.332562408825165, 8.543448553206703, 8.757415699253682, 8.974476575321063, 9.194643831691977, 9.417930041841839, 9.644347703669503, 9.873909240696694, 10.106627003236781, 10.342513269534024, 10.58158024687427, 10.8238400726681, 11.069304815507364, 11.317986476196008, 11.569896988756009, 11.825048221409341, 12.083451977536606, 12.345119996613247, 12.610063955123938, 12.878295467455942, 13.149826086772048, 13.42466730586372, 13.702830557985108, 13.984327217668513, 14.269168601521828, 14.55736596900856, 14.848930523210871, 15.143873411576273, 15.44220572664832, 15.743938506781891, 16.04908273684337, 16.35764934889634, 16.66964922287304, 16.985093187232053, 17.30399201960269, 17.62635644741625, 17.95219714852476, 18.281524751807332, 18.614349837764564, 18.95068293910138, 19.290534541298456, 19.633915083172692, 19.98083495742689, 20.331304511189067, 20.685334046541502, 21.042933821039977, 21.404114048223256, 21.76888489811322, 22.137256497705877, 22.50923893145328, 22.884842241736916, 23.264076429332462, 23.6469514538663, 24.033477234264016, 24.42366364919083, 24.817520537484558, 25.21505769858089, 25.61628489293138, 26.021211842414342, 26.429848230738664, 26.842203703840827, 27.258287870275353, 27.678110301598522, 28.10168053274597, 28.529008062403893, 28.96010235337422, 29.39497283293396, 29.83362889318845, 30.276079891419332, 30.722335150426627, 31.172403958865512, 31.62629557157785, 32.08401920991837, 32.54558406207592, 33.010999283389665, 33.4802739966603, 33.953417292456834, 34.430438229418264, 34.911345834551085, 35.39614910352207, 35.88485700094671, 36.37747846067349, 36.87402238606382, 37.37449765026789, 37.87891309649659, 38.38727753828926, 38.89959975977785, 39.41588851594697, 39.93615253289054, 40.460400508064545, 40.98864111053629, 41.520882981230194, 42.05713473317016, 42.597404951718396, 43.141702194811224, 43.6900349931913, 44.24241185063697, 44.798841244188324, 45.35933162437017, 45.92389141541209, 46.49252901546552, 47.065252796817916, 47.64207110610409, 48.22299226451468, 48.808024568002054, 49.3971762874833, 49.9904556690408, 50.587870934119984, 51.189430279724725, 51.79514187861014, 52.40501387947288, 53.0190544071392, 53.637271562750364, 54.259673423945976, 54.88626804504493, 55.517063457223934, 56.15206766869424, 56.79128866487574, 57.43473440856916, 58.08241284012621, 58.734331877617365, 59.39049941699807, 60.05092333227251, 60.715611475655585, 61.38457167773311, 62.057811747619894, 62.7353394731159, 63.417162620860914, 64.10328893648692, 64.79372614476921, 65.48848194977529, 66.18756403501224, 66.89098006357258, 67.59873767827808, 68.31084450182222, 69.02730813691093, 69.74813616640164, 70.47333615344107, 71.20291564160104, 71.93688215501312, 72.67524319850172, 73.41800625771542, 74.16517879925733, 74.9167682708136, 75.67278210128072, 76.43322770089146, 77.1981124613393, 77.96744375590167, 78.74122893956174, 79.51947534912904, 80.30219030335869, 81.08938110306934, 81.88105503125999, 82.67721935322541, 83.4778813166706, 84.28304815182372, 85.09272707154808, 85.90692527145302, 86.72564993000343, 87.54890820862819, 88.3767072518277, 89.2090541872801, 90.04595612594655, 90.88742016217518, 91.73345337380438, 92.58406282226491, 93.43925555268066, 94.29903859396902, 95.16341895893969, 96.03240364439274, 96.9059996312159, 97.78421388448044, 98.6670533535366, 99.55452497210776];

// TODO replace alphas with relative color syntax when supported by all browsers https://developer.chrome.com/blog/css-relative-color-syntax/ - https://caniuse.com/css-relative-colors
// currently on producing required alphas
const colorsForAlpha = [
  ['--mdw-primary', 'primary', '40'],
  // ['--mdw-primary-container', 'primary', '90'],
  ['--mdw-on-primary', 'primary', '100'],
  ['--mdw-on-primary-container', 'primary', '10'],
  // ['--mdw-primary-inverse', 'primary', '80'],
  // ['--mdw-secondary', 'secondary', '40'],
  // ['--mdw-secondary-container', 'secondary', '90'],
  // ['--mdw-on-secondary', 'secondary', '100'],
  ['--mdw-on-secondary-container', 'secondary', '10'],
  // ['--mdw-tertiary', 'tertiary', '40'],
  // ['--mdw-tertiary-container', 'tertiary', '90'],
  // ['--mdw-on-tertiary', 'tertiary', '100'],
  // ['--mdw-on-tertiary-container', 'tertiary', '10'],
  // ['--mdw-error', 'error', '40'],
  // ['--mdw-error-container', 'error', '90'],
  // ['--mdw-on-error', 'error', '100'],
  // ['--mdw-on-error-container', 'error', '10'],
  // ['--mdw-neutral', 'neutral', '40'],
  // ['--mdw-neutral-variant', 'neutral-variant', '40'],
  ['--mdw-surface', 'neutral', '98'],
  // ['--mdw-surface-dim', 'neutral', '87'],
  // ['--mdw-surface-bright', 'neutral', '98'],
  // ['--mdw-surface-container-lowest', 'neutral', '100'],
  // ['--mdw-surface-container-low', 'neutral', '96'],
  // ['--mdw-surface-container', 'neutral', '94'],
  // ['--mdw-surface-container-high', 'neutral', '92'],
  // ['--mdw-surface-container-highest', 'neutral', '90'],
  // ['--mdw-surface-variant', 'neutral-variant', '90'],
  ['--mdw-on-surface', 'neutral', '10'],
  ['--mdw-on-surface-variant', 'neutral-variant', '30'],
  // ['--mdw-surface-inverse', 'neutral', '20'],
  // ['--mdw-on-surface-inverse', 'neutral', '95'],
  ['--mdw-surface-tint', 'primary', '40'],
  // ['--mdw-background', 'neutral', '98'],
  // ['--mdw-on-background', 'neutral', '10'],
  ['--mdw-outline', 'neutral-variant', '50'],
  // ['--mdw-outline-variant', 'neutral-variant', '80'],
  ['--mdw-shadow', 'neutral', '0'],
  ['--mdw-scrim', 'neutral', '0'],
]


export async function generateBrowser() {
  if (!document.body) await new Promise(resolve => document.addEventListener('DOMContentLoaded', () => resolve()));
  else await new Promise(resolve => requestAnimationFrame(resolve)); // make sure css is registered

  handleThemeLightDark();

  // do not run code below ofter initiation
  if (document.documentElement.classList.contains('mdw-initiated')) return;

  const pageContent = document.querySelector('#page-content') || document.querySelector('page-content');
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

  // Theme can be pre build or generated at runtime. 
  // Skip runtime generation if pre generated
  const computedStyles = getComputedStyle(document.body);
  const themeGenerated = !!computedStyles.getPropertyValue('--mdw-primary-0');
  if (themeGenerated) return;

  const primary = computedStyles.getPropertyValue('--mdw-primary-source');
  if (!primary) return;

  const secondary = computedStyles.getPropertyValue('--mdw-secondary-source');
  const tertiary = computedStyles.getPropertyValue('--mdw-tertiary-source');
  const neutral = computedStyles.getPropertyValue('--mdw-neutral-source');
  const neutralVariant = computedStyles.getPropertyValue('--mdw-neutral-variant-source');
  const error = computedStyles.getPropertyValue('--mdw-error-source');
  const customColors = [...document.styleSheets, ...document.adoptedStyleSheets]
    .filter(sheet => sheet.href === null || sheet.href.startsWith(window.location.origin))
    .flatMap(sheet => (
      [...sheet.cssRules]
        .filter(rule => rule.selectorText === ':root'))
        .flatMap(rule => {
          return [...rule.style]
            .filter(v => v.startsWith('--mdw-custom-color-'))
            .map(v => ({ name: v.replace('--mdw-custom-color-', ''), color: rule.style.getPropertyValue(v) }))
    }));
  
  const palette = generatePalette({
    coreColors: {
      primary,
      secondary,
      tertiary,
      neutral,
      'neutral-variant': neutralVariant,
      error
    },
    customColors
  });

  Object.entries(palette.palettes).forEach(([name, tones]) => {
    Object.entries(tones).forEach(([tone, color]) => {
      document.documentElement.style.setProperty(`--mdw-${name}-${tone}`, color);
    });
  });

  palette.alphas.forEach(v => {
    document.documentElement.style.setProperty(v[0], v[1]);
  });

  palette.customColors.forEach(customColor => {
    customColor.values.forEach(v => {
      document.documentElement.style.setProperty(v[0], v[1]);
    });
  });
}

export function generateBuild(config) {
  return generatePalette(config);
}




function handleThemeLightDark() {
  const localStorageColorScheme = localStorage.getItem('mdw-color-scheme');
  if (['light', 'dark'].includes(localStorageColorScheme)) {
    document.documentElement.classList.toggle('mdw-theme-dark', localStorageColorScheme === dark);
  } else if (!document.documentElement.classList.contains('mdw-theme-dark')) {
    const htmlColorScheme = getComputedStyle(document.body).colorScheme;
    const themePreferenceDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('mdw-theme-dark', themePreferenceDark === true && htmlColorScheme !== 'light');
  }
}

function generatePalette(colors) {
  if (!colors.coreColors.primary) return;

  const source = argbFromHex(colors.coreColors.primary);
  const palettes = corePalette(source);
  

  for (const [key, value] of Object.entries(colors.coreColors)) {
    if (key === 'primary' || !value) continue;

    const hct = getHTC(argbFromHex(value));
    const tones = generateTones(hct.hue, hct.chroma);
    palettes[key] = tones;
  }

  return {
    palettes,
    customColors: convertCustomColors(colors.customColors || [], source),
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
  };
}

function corePalette(argb, isContent = true) {
  const hct = getHTC(argb);
  const hue = hct.hue;
  const chroma = hct.chroma

  return isContent ? {
    primary: generateTones(hue, chroma),
    secondary: generateTones(hue, chroma / 3),
    tertiary: generateTones(hue + 60, chroma / 2),
    neutral: generateTones(hue, Math.min(chroma / 12, 4)),
    'neutral-variant': generateTones(hue, Math.min(chroma / 6, 8)),
    error: generateTones(25, 84)
  } : {
    primary: generateTones(hue, Math.max(48, chroma)),
    secondary: generateTones(hue, 16),
    tertiary: generateTones(hue + 60, 24),
    neutral: generateTones(hue, 4),
    'neutral-variant': generateTones(hue, 8),
    error: generateTones(25, 84)
  };
}

function getHTC(argb) {
  const cam = fromIntInViewingConditions(argb);
  const tone = 116 * labF(xyzFromArgb(argb)[1] / 100) - 16;
  return {
    argb,
    hue: cam.hue,
    chroma: cam.chroma,
    tone
  };
}

function generateTones(hue, chroma) {
  return Object.fromEntries(tones.map(tone => ([tone, hexFromArgb(solveToInt(hue, chroma, tone))])));
}

function fromIntInViewingConditions(argb) {
  const redL = linearized((argb & 16711680) >> 16);
  const greenL = linearized((argb & 65280) >> 8);
  const blueL = linearized(argb & 255);
  const x = .41233895 * redL + .35762064 * greenL + .18051042 * blueL;
  const y = .2126 * redL + .7152 * greenL + .0722 * blueL;
  const z = .01932141 * redL + .11916382 * greenL + .95034478 * blueL;
  const rD = viewingConditions.rgbD[0] * (.401288 * x + .650173 * y - .051461 * z);
  const gD = viewingConditions.rgbD[1] * (-.250268 * x + 1.204414 * y + .045854 * z);
  const bD = viewingConditions.rgbD[2] * (-.002079 * x + .048952 * y + .953127 * z);
  const rAF = Math.pow(viewingConditions.fl * Math.abs(rD) / 100, .42);
  const gAF = Math.pow(viewingConditions.fl * Math.abs(gD) / 100, .42);
  const bAF = Math.pow(viewingConditions.fl * Math.abs(bD) / 100, .42);
  const rA = 400 * Math.sign(rD) * rAF / (rAF + 27.13);
  const gA = 400 * Math.sign(gD) * gAF / (gAF + 27.13);
  const bA = 400 * Math.sign(bD) * bAF / (bAF + 27.13);
  const a = (11 * rA + -12 * gA + bA) / 11;
  const b = (rA + gA - 2 * bA) / 9;
  const atanDegrees = 180 * Math.atan2(b, a) / Math.PI;
  const hue = 0 > atanDegrees ? atanDegrees + 360 : 360 <= atanDegrees ? atanDegrees - 360 : atanDegrees;
  const j = 100 * Math.pow((40 * rA + 20 * gA + bA) / 20 * viewingConditions.nbb / viewingConditions.aw, viewingConditions.c * viewingConditions.z);
  const alpha = Math.pow(5E4 / 13 * .25 * (Math.cos((20.14 > hue ? hue + 360 : hue) * Math.PI / 180 + 2) + 3.8) * viewingConditions.nc * viewingConditions.ncb * Math.sqrt(a * a + b * b) / ((20 * rA + 20 * gA + 21 * bA) / 20 + .305), .9) * Math.pow(1.64 - Math.pow(.29, viewingConditions.n), .73);
  const chroma = alpha * Math.sqrt(j / 100);
  return {
    hue,
    chroma
  };
}


function solveToInt(hueDegrees, chroma, lstar) {
  if (1E-4 > chroma || 1E-4 > lstar || 99.9999 < lstar) {
    const component = delinearized(100 * labInvf((lstar + 16) / 116));
    return argbFromRgb(component, component, component);
  }

  hueDegrees = sanitizeDegreesDouble(hueDegrees);
  const hueRadians = hueDegrees / 180 * Math.PI;
  const y = 100 * labInvf((lstar + 16) / 116);

  let result = 0;
  let j = 11 * Math.sqrt(y);
  const tInnerCoeff = 1 / Math.pow(1.64 - Math.pow(.29, viewingConditions.n), .73);
  const p1 = 5E4 / 13 * (Math.cos(hueRadians + 2) + 3.8) * .25 * viewingConditions.nc * viewingConditions.ncb;
  const hSin = Math.sin(hueRadians);
  const hCos = Math.cos(hueRadians);
  for (let iterationRound = 0; 5 > iterationRound; iterationRound++) {
    const jNormalized = j / 100;
    const t = Math.pow((0 === chroma || 0 === j ? 0 : chroma / Math.sqrt(jNormalized)) * tInnerCoeff, 1 / .9);
    const p2 = viewingConditions.aw * Math.pow(jNormalized, 1 / viewingConditions.c / viewingConditions.z) / viewingConditions.nbb;
    const gamma = 23 * (p2 + .305) * t / (23 * p1 + 11 * t * hCos + 108 * t * hSin);
    const a = gamma * hCos;
    const b = gamma * hSin;
    const linrgb = matrixMultiply([inverseChromaticAdaptation((460 * p2 + 451 * a + 288 * b) / 1403), inverseChromaticAdaptation((460 * p2 - 891 * a - 261 * b) / 1403), inverseChromaticAdaptation((460 * p2 - 220 * a - 6300 * b) / 1403)], LINRGB_FROM_SCALED_DISCOUNT);

    if (0 > linrgb[0] || 0 > linrgb[1] || 0 > linrgb[2]) break;

    const fnj = Y_FROM_LINRGB[0] * linrgb[0] + Y_FROM_LINRGB[1] * linrgb[1] + Y_FROM_LINRGB[2] * linrgb[2];
    if (0 >= fnj) break;

    if (4 === iterationRound || .002 > Math.abs(fnj - y)) {
      if (100.01 < linrgb[0] || 100.01 < linrgb[1] || 100.01 < linrgb[2]) break;
      result = argbFromRgb(delinearized(linrgb[0]), delinearized(linrgb[1]), delinearized(linrgb[2]));
      break;
    }
    j -= (fnj - y) * j / (2 * fnj);
  }

  if (result !== 0) return result;


  let left = [-1, -1, -1]
  let right = left;
  let leftHue = 0;
  let rightHue = 0;
  let initialized = false;
  let uncut = true;

  for (let n = 0; 12 > n; n++) {
    let mid;
    const coordA2 = 1 >= n % 4 ? 0 : 100;
    const coordB2 = 0 === n % 2 ? 0 : 100;
    if (4 > n) {
      const r = (y - coordA2 * Y_FROM_LINRGB[1] - coordB2 * Y_FROM_LINRGB[2]) / Y_FROM_LINRGB[0];
      mid = 0 <= r && 100 >= r ? [r, coordA2, coordB2] : [-1, -1, -1];
    } else if (8 > n) {
      const g = (y - coordB2 * Y_FROM_LINRGB[0] - coordA2 * Y_FROM_LINRGB[2]) / Y_FROM_LINRGB[1];
      mid = 0 <= g && 100 >= g ? [coordB2, g, coordA2] : [-1, -1, -1];
    } else {
      const b = (y - coordA2 * Y_FROM_LINRGB[0] - coordB2 * Y_FROM_LINRGB[1]) / Y_FROM_LINRGB[2];
      mid = 0 <= b && 100 >= b ? [coordA2, coordB2, b] : [-1, -1, -1];
    }

    if (0 > mid[0]) continue;
    
    const midHue = hueOf(mid);
    if (!initialized) {
      right = left = mid;
      rightHue = leftHue = midHue;
      initialized = true;
    } else if (uncut || sanitizeRadians(midHue - leftHue) < sanitizeRadians(rightHue - leftHue)) {
      uncut = false;
      if (sanitizeRadians(hueRadians - leftHue) < sanitizeRadians(midHue - leftHue)) {
        right = mid;
        rightHue = midHue;
      } else {
        left = mid;
        leftHue = midHue;
      }
    }
  }

  leftHue = hueOf(left);
  
  for (let axis = 0; 3 > axis; axis++)
    if (left[axis] !== right[axis]) {
      let lPlane;
      let rPlane;

      if (left[axis] < right[axis]) {
        lPlane = Math.floor(trueDelinearized(left[axis]) - .5);
        rPlane = Math.ceil(trueDelinearized(right[axis]) - .5);
      } else {
        lPlane = Math.ceil(trueDelinearized(left[axis]) - .5);
        rPlane = Math.floor(trueDelinearized(right[axis]) - .5);
      }

      for (let i = 0; 8 > i && !(1 >= Math.abs(rPlane - lPlane)); i++) {
        const mPlane = Math.floor((lPlane + rPlane) / 2);
        const source = left[axis];
        const comp = (CRITICAL_PLANES[mPlane] - source) / (right[axis] - source);
        const mid = [left[0] + (right[0] - left[0]) * comp, left[1] + (right[1] - left[1]) * comp, left[2] + (right[2] - left[2]) * comp];
        const midHue = hueOf(mid);
        if (sanitizeRadians(hueRadians - leftHue) < sanitizeRadians(midHue - leftHue)) {
          right = mid;
          rPlane = mPlane;
        } else {
          left = mid;
          leftHue = midHue;
          lPlane = mPlane;
        }
      }
    }
  
  return argbFromRgb(delinearized((left[0] + right[0]) / 2), delinearized((left[1] + right[1]) / 2), delinearized((left[2] + right[2]) / 2));
}


function argbFromHex(hex) {
  hex = hex.replace('#', '');
  if (![3, 6].includes(hex.length)) throw Error(`Invalid hex value ${hex}`);

  const is6 = hex.length === 6;
  const r = parseInt(is6 ? hex.substring(0, 2) : hex.substring(0, 1).repeat(2), 16);
  const g = parseInt(is6 ? hex.substring(2, 4) : hex.substring(1, 2).repeat(2), 16);
  const b = parseInt(is6 ? hex.substring(4, 6) : hex.substring(2, 3).repeat(2), 16);

  return (-16777216 | (r & 255) << 16 | (g & 255) << 8 | b & 255) >>> 0;
}

function hexFromArgb(argb) {
  const g = argb >> 8 & 255;
  const b = argb & 255;
  const outParts = [(argb >> 16 & 255).toString(16), g.toString(16), b.toString(16)];
  for (const [i, part] of outParts.entries()) {
    if (part.length === 1) outParts[i] = '0' + part;
  }
  return '#' + outParts.join('');
}

function linearized(rgbComponent) {
  const normalized = rgbComponent / 255;
  return .040449936 >= normalized ? normalized / 12.92 * 100 : 100 * Math.pow((normalized + .055) / 1.055, 2.4);
}

function xyzFromArgb(argb) {
  return matrixMultiply([linearized(argb >> 16 & 255), linearized(argb >> 8 & 255), linearized(argb & 255)], SRGB_TO_XYZ);
}

function matrixMultiply(row, matrix) {
  return [row[0] * matrix[0][0] + row[1] * matrix[0][1] + row[2] * matrix[0][2], row[0] * matrix[1][0] + row[1] * matrix[1][1] + row[2] * matrix[1][2], row[0] * matrix[2][0] + row[1] * matrix[2][1] + row[2] * matrix[2][2]];
}

function labF(t) {
  return t > 216 / 24389 ? Math.pow(t, 1 / 3) : (24389 / 27 * t + 16) / 116;
}

function delinearized(rgbComponent) {
  const normalized = rgbComponent / 100;
  const input = Math.round(255 * (.0031308 >= normalized ? 12.92 * normalized : 1.055 * Math.pow(normalized, 1 / 2.4) - .055));
  return 0 > input ? 0 : 255 < input ? 255 : input;
}

function labInvf(ft) {
  const ft3 = ft * ft * ft;
  return ft3 > 216 / 24389 ? ft3 : (116 * ft - 16) / (24389 / 27);
}

function argbFromRgb(red, green, blue) {
  return (-16777216 | (red & 255) << 16 | (green & 255) << 8 | blue & 255) >>> 0;
}

function sanitizeDegreesDouble(degrees) {
  degrees %= 360;
  if (degrees < 0) degrees += 360;
  return degrees;
}

function inverseChromaticAdaptation(adapted) {
  const adaptedAbs = Math.abs(adapted);
  return Math.sign(adapted) * Math.pow(Math.max(0, 27.13 * adaptedAbs / (400 - adaptedAbs)), 1 / .42);
}

function hueOf(linrgb) {
  const scaledDiscount = matrixMultiply(linrgb, SCALED_DISCOUNT_FROM_LINRGB);
  const rA = chromaticAdaptation(scaledDiscount[0]);
  const gA = chromaticAdaptation(scaledDiscount[1]);
  const bA = chromaticAdaptation(scaledDiscount[2]);
  return Math.atan2((rA + gA - 2 * bA) / 9, (11 * rA + -12 * gA + bA) / 11);
}

function chromaticAdaptation(component) {
  const af = Math.pow(Math.abs(component), .42);
  return 400 * Math.sign(component) * af / (af + 27.13);
}

function sanitizeRadians(angle) {
  return (angle + 8 * Math.PI) % (2 * Math.PI);
}

function trueDelinearized(rgbComponent) {
  const normalized = rgbComponent / 100;
  return 255 * (.0031308 >= normalized ? 12.92 * normalized : 1.055 * Math.pow(normalized, 1 / 2.4) - .055);
}

// NOTE no blend implemented
function convertCustomColors(colors) {
  return colors.map(item => {
    const hct = getHTC(argbFromHex(item.color));
    const tones = generateTones(hct.hue, hct.chroma);

    return {
      name: item.name,
      color: item.color,
      values: Object.entries(tones).map(([tone, color]) => [`--mdw-custom-color-${item.name}-${tone}`, color]),

      palette: tones,
      light: {
        color: tones['40'],
        'on-color': tones['100'],
        'color-container': tones['90'],
        'on-color-container': tones['10']
      },
      dark: {
        color: tones['80'],
        'on-color': tones['20'],
        'color-container': tones['30'],
        'on-color-container': tones['90']
      }
    };
  });
}
