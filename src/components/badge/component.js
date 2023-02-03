import HTMLElementExtended from '../HTMLElementExtended.js';
import './component.css';

// TODO align at end of button with text

export default class MDWBadgeElement extends HTMLElementExtended {
  #value = '';

  constructor() {
    super();

    if (this.innerText === '0' || this.innerText.trim() === '') super.innerText = '';
    else this.value = this.innerText;
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
    super.innerText = value;
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
