import HTMLElementExtended from '../HTMLElementExtended.js';


// Wait for font to load
//   we want to hide icons until it is because font-display only waits for up to 3 seconds.
//   So if the font takes longer than that to load, we will see the icon text
const iconFont = [...document.fonts].find(v => v.family === 'Material Symbols Outlined');

// // icon font is optionally loaded by user
if (iconFont) iconFont.loaded.then(() => {
  document.querySelector('html').classList.add('mdw-material-icon-font-loaded');
});


customElements.define('mdw-icon', class MDWIconElement extends HTMLElementExtended {
  constructor() {
    super();
  }
});


// https://fonts.google.com/icons?icon.style=Outlined&icon=
