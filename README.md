## @webfurmula/material
Material design v3 web components. Performant, light-weight, full features, optimized for multiple devices.
[Webformula material docs](http://material.webformula.io/)

### Highlights
- ⚡ Lightweight - 79KB compressed
- ⚡ Performant - Uses native web components
- ⚡ 0 dependencies
- ⚡ Optimized for all screens and devices
- ⚡ Simple to use
- ⚡ Style and color control

### About
Material design V3 web components that are full featured, performant and simple to use. These components are robust and work with all modern browsers. Built with mobile in mind, adapting to small screens and touch inputs. Our goal is reduce the complexity and increase usability.

## Table of Contents  
- [Getting started](#gettingstarted)
  - [Installation](#installation)
  - [Importing components](#importing)
  - [Importing styles](#importingstyles)
  - [Building theme](#buildingTheme)


# Getting started
<a name="gettingstarted"></a>


## **Installation**
<a name="installation"></a>

```bash
npm install @webformula/material
```


## **Importing components**
<a name="importing"></a>

```javascript
// import everything
import '@webformula/material';

// importing individual components. Use to optimize file sizes
import '@webformula/material/components/badge';
import '@webformula/material/components/bottom-app-bar';
import '@webformula/material/components/bottom-sheet';
import '@webformula/material/components/button';
import '@webformula/material/components/card';
import '@webformula/material/components/checkbox';
import '@webformula/material/components/chip';
import '@webformula/material/components/date-picker';
import '@webformula/material/components/dialog';
import '@webformula/material/components/fab';
import '@webformula/material/components/form';
import '@webformula/material/components/icon';
import '@webformula/material/components/list';
import '@webformula/material/components/menu';
import '@webformula/material/components/navigation';
import '@webformula/material/components/progress-circular';
import '@webformula/material/components/progress-linear';
import '@webformula/material/components/radio';
import '@webformula/material/components/scrim';
import '@webformula/material/components/search';
import '@webformula/material/components/segmented-button';
import '@webformula/material/components/select';
import '@webformula/material/components/side-sheet';
import '@webformula/material/components/slider';
import '@webformula/material/components/snackbar';
import '@webformula/material/components/switch';
import '@webformula/material/components/tab';
import '@webformula/material/components/textfield';
import '@webformula/material/components/time-picker';
import '@webformula/material/components/tooltip';
import '@webformula/material/components/top-app-bar';

// importing services.These are also available on 'window'
import {
  wfcDate,
  wfcDevice,
  wfcDialog,
  wfcUtil,
  wfcSnackbar
} from '@webformula/material/services';

// importing individual services
import util from  '@webformula/material/services/util';
```
```html
<!-- import in index.html - NOT recommended -->
<script src="https://cdn.jsdelivr.net/gh/webformula/material@latest/dist/material.js"></script>
```


## **Importing Styles**
<a name="importingstyles"></a>
You may want to copy and serve `theme.css` in your app. This is where you configure you custom theme. If you want to use the default dark and light theme, then you can use the one in the repo.

```css
/* theme.css should be loaded first */
  
/* import in app css */
@import('@webformula/materia.theme.css');
```
```html
<!-- import in index.html -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/webformula/material@latest/dist/theme.css">
```


### **Font loading** You can use google fonts to load custom fonts
`theme.css` should be the first file imported or loaded
`theme.css` can be customized to update light and dark color schemes. If you use the one in the repo it will be the default schemes.
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link
  href="https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght@8..144,300;8..144,400;8..144,500&display=swap"
  rel="stylesheet">
```

### **Icon loading** Uses material icon font
For icons this uses Googles Material icon font. All component required icons are packed in with library. Only needed if using the wfc-icon component
```html
<!--
  Load material icons via google fonts.
  All component required icons are packed in with library.
  Only needed if using the wfc-icon component
-->
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```


## **Building theme**
<a name="buildingTheme"></a>
Theme css can be generated at build time.

`build.js` build script
```javascript
import generate from '@webformula/material/themeGenerator';

// generate(input path, output path)
generate({
  coreColors: {
    // primary is the only required color
    primary: '#6750A4',

    // By default these generate from the primary
    // You can override them here
    secondary: '#625B71',
    tertiary: '#7D5260',
    neutral: '#67616f',
    neutralVariant: '#605666',
    error: '#B3261E'
  },

  // Specify custom colors to use in app
  customColors: [
    {
      name: 'customColor',
      color: '#5b7166'
    }
  ]
}, './colorTokens.css');
```
