import HTMLElementExtended from '../HTMLElementExtended.js';
import sheet from './radio.css' assert { type: 'css' };
import util from '../../core/util.js';

// TODO accessability

customElements.define('mdw-radio', class MDWRadio extends HTMLElementExtended {
  useShadowRoot = true;

  #value = 'on';
  #checked = false;
  #disabled = false;


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

      <style>${this.stringifyStyleSheet(sheet)}</style>
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
    this.setAttribute('role', 'radio');
    this.setAttribute('aria-label', util.getTextFromNode(this));
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
});
