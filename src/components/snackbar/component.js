import MDWPanelElement from '../panel/component.js';


customElements.define('mdw-snackbar', class mdwSnackbarElement extends MDWPanelElement {
  constructor() {
    super();

    this.animation = 'transitionYReverse';
    this.clickOutsideClose = false;
  }

  connectedCallback() {
    super.connectedCallback();
    
    this.setAttribute('role', 'alertdialog');
  }
});
