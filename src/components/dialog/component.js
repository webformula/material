import MDWPanelElement from '../panel/component.js';
import util from '../../core/util.js';

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
    const headline = this.querySelector('.mdw-headline');
    if (headline) {
      const text = util.getTextFromNode(headline);
      if (text) {
        if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', text);
        if (!headline.hasAttribute('role')) headline.setAttribute('role', 'heading');
        if (!headline.hasAttribute('aria-label')) headline.setAttribute('aria-label', headline.innerText);
        if (!headline.hasAttribute('aria-level')) headline.setAttribute('aria-level', '2');
      }
    }
  }

  disconnectedCallback() {
    util.unlockPageScroll();
    super.disconnectedCallback();
  }

  get returnValue() {
    return this.#returnValue;
  }

  show(scrim = true) {
    super.show(scrim);
    util.lockPageScroll();

    const focusable = [...this.querySelectorAll('*')].find(e => e.tabindex > -1 || parseInt(e.getAttribute('tabindex') || -1) > -1);
    if (focusable) {
      this.#nextFocusable = focusable;
      this.#lastFocused = document.activeElement;
      window.addEventListener('keydown', this.#onTab_bound);
    }
  }

  close(returnValue) {
    if (this.open !== true) return;
    util.unlockPageScroll();

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
