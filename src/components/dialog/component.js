import MDWPanelElement from '../panel/component.js';
import './component.css';

export default class MDWDialogElement extends MDWPanelElement {
  #returnValue;
  #nextFocusable;
  #lastFocused;
  #onTab_bound = this.#onTab.bind(this);

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

  show() {
    super.show();

    const focusable = [...this.querySelectorAll('*')].find(e => e.tabindex > -1 || parseInt(e.getAttribute('tabindex') || -1) > -1);
    if (focusable) {
      this.#nextFocusable = focusable;
      this.#lastFocused = document.activeElement;
      window.addEventListener('keydown', this.#onTab_bound);
    }
  }

  close(returnValue) {
    if (this.open !== true) return;

    this.#returnValue = returnValue;
    super.close();
    if (this.#lastFocused) this.#lastFocused.focus();
  }

  #onTab(e) {
    if (e.code === 'Tab') {
      this.#nextFocusable.focus();
      this.#nextFocusable = undefined;
      e.preventDefault();
      window.removeEventListener('keydown', this.#onTab_bound);
    }
  }
}

customElements.define('mdw-dialog', MDWDialogElement);
