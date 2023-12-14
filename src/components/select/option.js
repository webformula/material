import HTMLElementExtended from "../HTMLElementExtended.js";
import styles from './option.css' assert { type: 'css' };
import Ripple from '../../core/Ripple.js';
import util from '../../core/util.js';

// TODO selected style in panel
customElements.define('mdw-option', class MDWOptionGroupElement extends HTMLElementExtended {
  static useShadowRoot = true;
  static styleSheets = styles;

  #value;
  #ripple;

  constructor() {
    super();
    this.#handleTrailingIcon();
  }

  template() {
    return /*html*/`
      <span class="text">
        <slot></slot>
      </span>
      <div class="ripple"></div>
    `;
  }

  connectedCallback() {
    this.tabIndex = -1;
    this.setAttribute('role', 'option');

    this.#value = this.getAttribute('value') || util.getTextFromNode(this);
  }

  afterRender() {
    this.#ripple = new Ripple({
      element: this.shadowRoot.querySelector('.ripple'),
      triggerElement: this
    });
  }

  disconnectedCallback() {
    if (this.#ripple) this.#ripple.destroy();
  }

  get value() {
    return this.#value;
  }
  set value(value) {
    this.#value = value;
  }

  // auto add class .mdw-trailing to icon so t will space correctly
  #handleTrailingIcon() {
    const icon = this.querySelector('mdw-icon');
    if (!icon) return;

    let previous = icon.previousSibling;
    while (previous) {
      if (previous.nodeType === 3 && previous.textContent.trim() !== '') break;
      previous = previous.previousSibling;
    }

    if (previous) icon.classList.add('mdw-trailing');
  }
});
