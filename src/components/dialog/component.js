import MDWPanelElement from '../panel/component.js';
import util from '../../core/util.js';
import dialogService from './service.js';
import device from '../../core/device.js';


export default class MDWDialogElement extends MDWPanelElement {
  #returnValue;
  #lastFocused;
  #removeOnClose = false;
  #focusableElements = [];
  #focusableIndex = -1;
  #onTab_bound = this.#onTab.bind(this);
  #isFullscreen = false;

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'dialog');
    this.#isFullscreen = this.classList.contains('mdw-fullscreen');
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
    window.removeEventListener('keydown', this.#onTab_bound);
    util.unlockPageScroll();
    super.disconnectedCallback();
    dialogService.untrack(this);
  }

  get returnValue() {
    return this.#returnValue;
  }

  get removeOnClose() {
    return this.#removeOnClose;
  }
  set removeOnClose(value) {
    this.#removeOnClose = !!value;
  }

  show(scrim = true) {
    if (this.#isFullscreen && device.state === 'compact') this.animation = 'scale';
    else this.animation = 'translateY';
    super.show(scrim);
    util.lockPageScroll();
    this.#focusableElements = util.getFocusableElements(this);
    if (this.#focusableElements.length > 0) {
      this.#lastFocused = document.activeElement;
      // this.#focusableElements[0].focus();
      window.addEventListener('keydown', this.#onTab_bound);
    }

    const scrollable = this.scrollHeight > this.offsetHeight;
    this.classList.toggle('mdw-scroll', scrollable);
    if (scrollable) this.scrollTop = 0;

    return dialogService.track(this);
  }

  // proxy for mdwDialog.close
  async close(returnValue) {
    window.removeEventListener('keydown', this.#onTab_bound);
    await dialogService.close(returnValue);
  }

  // original panel close
  // This should not be called directly
  async panelClose(returnValue) {
    if (this.open !== true) return;
    window.removeEventListener('keydown', this.#onTab_bound);
    util.unlockPageScroll();
    this.#returnValue = returnValue;
    await super.close();
    if (this.#lastFocused) this.#lastFocused.focus();
  }

  #onTab(e) {
    if (e.code === 'Tab') {
      this.#focusableIndex += 1;
      if (!this.#focusableElements[this.#focusableIndex]) this.#focusableIndex = 0;
      this.#focusableElements[this.#focusableIndex].focus();
      e.preventDefault();
    }
  }
}

customElements.define('mdw-dialog', MDWDialogElement);
