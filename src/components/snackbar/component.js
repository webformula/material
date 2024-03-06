import WFCSurfaceElement from '../surface/component.js';
import styles from './component.css' assert { type: 'css' };

class wfcSnackbarElement extends WFCSurfaceElement {
  static tag = 'wfc-snackbar';
  static styleSheets = styles;
  
  constructor() {
    super();

    this.role = 'alertdialog';
    this.allowClose = false;
    this.animation = 'opacity';
    this.position = 'bottom left';
    this.fixed = true;
  }
}
customElements.define(wfcSnackbarElement.tag, wfcSnackbarElement);
