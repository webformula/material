import WFCSurfaceElement from '../surface/component.js';
import styles from './component.css' assert { type: 'css' };

// TODO animation reverse

class wfcSnackbarElement extends WFCSurfaceElement {
  static tag = 'wfc-snackbar';
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
customElements.define(wfcSnackbarElement.tag, wfcSnackbarElement);
