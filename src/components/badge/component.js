import HTMLElementExtended from '../HTMLElementExtended.js';
import './component.css';

export default class MDWBadgeElement extends HTMLElementExtended {
  #value = '';
  #nonCounting = false;
  #parentLabel;

  constructor() {
    super();

    if (this.classList.contains('mdw-non-counting')) this.#nonCounting = true;
  }

  connectedCallback() {
    // make sure this happens after parent
    requestAnimationFrame(() => {
      this.#parentLabel = this.parentElement.getAttribute('aria-label') || '';
      this.value = this.innerText;
    });
  }


  get value() {
    return this.#value || '0';
  }

  set value(value) {
    value = parseInt(value);
    if (isNaN(value) || value <= 0) value = '';
    if (value > 999) value = '999+';

    this.#value = value;
    this.classList.toggle('mdw-has-value', !!value);
    if (this.#nonCounting) super.innerText = '';
    else super.innerText = value;

    // '', '0', 0
    if (value == 0) this.parentElement.setAttribute('aria-label', this.#parentLabel);
    else if (this.#nonCounting) this.parentElement.setAttribute('aria-label', `[${this.#parentLabel}] New notification`);
    else this.parentElement.setAttribute('aria-label', `[${this.#parentLabel}] ${this.value} New ${this.value === 1 ? 'notification' : 'notifications'}`);
  }

  get innerHTML() {
    return super.innerHTML;
  }
  set innerHTML(value) {
    this.value = value;
  }

  get innerText() {
    return super.innerText;
  }
  set innerText(value) {
    this.value = value;
  }
}

customElements.define('mdw-badge', MDWBadgeElement);
