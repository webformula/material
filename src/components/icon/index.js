import HTMLElementExtended from '../HTMLElementExtended.js';


// Wait for icon font to load
document.fonts.ready.then(event => {
  const iconFont = [...event].find(v => v.family === 'Material Symbols Outlined');
  if (iconFont) document.querySelector('html').classList.add('mdw-material-icon-font-loaded');
});


customElements.define('mdw-icon', class MDWIconElement extends HTMLElementExtended {
  constructor() {
    super();
  }
});


// https://fonts.google.com/icons?icon.style=Outlined&icon=
