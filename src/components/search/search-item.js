import MDWMenuItemElement from "../menu/menu-item.js";
import util from '../../core/util.js';

customElements.define('mdw-search-item', class MDWSearchItemElement extends MDWMenuItemElement {
  #value;
  #displayValue;

  constructor() {
    super();

    this.role = 'option';
  }

  connectedCallback() {
    super.connectedCallback();
    this.#displayValue = util.getTextFromNode(this);
    this.#value = this.getAttribute('value') || this.#displayValue;
  }

  get value() {
    return this.#value;
  }
  set value(value) {
    this.#value = value;
  }

  get displayValue() {
    return this.#displayValue;
  }
});
