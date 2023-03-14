import MDWPanelElement from '../panel/component.js';
import './component.css';

export default class MDWDialogElement extends MDWPanelElement {
  #returnValue;

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'dialog');
  }

  get returnValue() {
    return this.#returnValue;
  }

  close(returnValue) {
    if (this.open !== true) return;

    this.#returnValue = returnValue;
    super.close();
  }
}

customElements.define('mdw-dialog', MDWDialogElement);
