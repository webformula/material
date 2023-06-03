import HTMLElementExtended from '../HTMLElementExtended.js';
import styles from './radio.css' assert { type: 'css' };
import util from '../../core/util.js';


customElements.define('mdw-radio', class MDWRadio extends HTMLElementExtended {
  useShadowRoot = true;
  static styleSheets = styles;

  #value = 'on';
  #checked = false;
  #disabled = false;
  #focus_bound = this.#focus.bind(this);
  #blur_bound = this.#blur.bind(this);
  #focusKeydown_bound = this.#focusKeydown.bind(this);


  constructor() {
    super();

    if (this.parentElement.classList.contains('mdw-label-left')) this.classList.add('mdw-label-left');
  }

  template() {
    return /*html*/`
      <div class="background">
        <div class="ripple"></div>
      </div>

      <slot></slot>
    `;
  }

  static get observedAttributes() {
    return ['checked', 'value', 'disabled'];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === 'checked') this.checked = newValue !== null;
    else if (name === 'disabled') this.disabled = newValue !== null;
    else this[name] = newValue;
  }

  connectedCallback() {
    this.tabIndex = 0;
    this.setAttribute('role', 'radio');
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', util.getTextFromNode(this));
    this.addEventListener('focus', this.#focus_bound);
  }

  disconnectedCallback() {
    this.removeEventListener('focus', this.#focus_bound);
    this.removeEventListener('blur', this.#blur_bound);
    this.removeEventListener('keydown', this.#focusKeydown_bound);
  }

  get value() {
    return this.#value;
  }
  set value(value) {
    this.#value = value;
  }

  get checked() {
    return this.#checked;
  }
  set checked(value) {
    this.#checked = !!value;
    this.classList.toggle('mdw-checked', this.#checked);
    this.setAttribute('aria-checked', this.#checked.toString() || 'false');
  }

  get disabled() {
    return this.#disabled;
  }
  set disabled(value) {
    this.#disabled = !!value;
    this.toggleAttribute('disabled', this.#disabled);
  }

  #focus() {
    this.addEventListener('blur', this.#blur_bound);
    this.addEventListener('keydown', this.#focusKeydown_bound);
  }

  #blur() {
    this.removeEventListener('blur', this.#blur_bound);
    this.removeEventListener('keydown', this.#focusKeydown_bound);
  }

  #focusKeydown(e) {
    if (e.shiftKey && e.code === 'Tab') {
      if (this.previousElementSibling?.nodeName === 'MDW-RADIO') this.previousElementSibling.focus();
    }
    if (e.code === 'Space') {
      this.click();
      e.preventDefault();
    }

    if (e.code === 'ArrowUp') {
      if (this.previousElementSibling?.nodeName === 'MDW-RADIO') {
        this.previousElementSibling.focus();
        this.previousElementSibling.click();
        e.preventDefault();
      }
    }

    if (e.code === 'ArrowDown') {
      if (this.nextElementSibling?.nodeName === 'MDW-RADIO') {
        this.nextElementSibling.focus();
        this.nextElementSibling.click();
        e.preventDefault();
      }
    }
  }
});
