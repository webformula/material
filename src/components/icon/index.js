import HTMLElementExtended from '../HTMLElementExtended.js';
import styles from './component.css' assert { type: 'css' };

// Wait for icon font to load
// document.fonts.ready.then(event => {
//   const iconFont = [...event].find(v => v.family.contains('Material Symbols'));
//   if (iconFont) document.querySelector('html').classList.add('mdw-material-icon-font-loaded');
// });

customElements.define('mdw-icon', class MDWIconElement extends HTMLElementExtended {
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = styles;

  constructor() {
    super();
  }

  template() {
    return /*html*/`<slot></slot>`;
  }
});


// https://fonts.google.com/icons?icon.style=Outlined&icon=
