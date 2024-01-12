import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './badge.css' assert { type: 'css' };


customElements.define('mdw-badge', class MDWBadgeElement extends HTMLComponentElement {
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = styles;

  #value = '0';
  #displayValue = '';

  constructor() {
    super();

    // this.role = 'range';
    this.render();
    this.value = this.innerText;
  }

  static get observedAttributesExtended() {
    return [
      ['value', 'number']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  template() {
    return /*html*/`<slot></slot>`;
  }


  get value() { return this.#value; }
  set value(value) {
    this.#value = value;

    const num = parseInt(value);
    if (isNaN(num) || num <= 0) this.#displayValue = '';
    else if (num > 999) this.#displayValue = '999+';
    else this.#displayValue = `${num}`;

    this.classList.toggle('has-value', !!this.#displayValue);
    super.innerText = this.#displayValue;

    // '', '0', 0
    // if (value == 0) this.parentElement.setAttribute('aria-label', this.#parentLabel);
    // else if (this.#nonCounting) this.parentElement.setAttribute('aria-label', `[${this.#parentLabel}] New notification`);
    // else this.parentElement.setAttribute('aria-label', `[${this.#parentLabel}] ${this.value} New ${this.value === 1 ? 'notification' : 'notifications'}`);
  }

  get innerHTML() { return super.innerHTML; }
  set innerHTML(value) { this.value = value; }

  get innerText() { return super.innerText; }
  set innerText(value) { this.value = value; }
});
