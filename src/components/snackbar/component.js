import MDWSurfaceElement from '../surface/component.js';
import styles from './component.css' assert { type: 'css' };


customElements.define('mdw-snackbar', class mdwSnackbarElement extends MDWSurfaceElement {
  static styleSheets = styles;
  
  constructor() {
    super();

    this.role = 'alertdialog';
    this.allowClose = false;
    this.animation = 'translate-y';
    this.position = 'bottom left';
    this.fixed = true;
  }
});
