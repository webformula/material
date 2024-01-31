import MDWSurfaceElement from '../surface/component.js';
import styles from './component.css' assert { type: 'css' };


class mdwSnackbarElement extends MDWSurfaceElement {
  static tag = 'mdw-snackbar';
  static styleSheets = styles;
  
  constructor() {
    super();

    this.role = 'alertdialog';
    this.allowClose = false;
    this.animation = 'translate-y';
    this.position = 'bottom left';
    this.fixed = true;
  }
}
customElements.define(mdwSnackbarElement.tag, mdwSnackbarElement);
