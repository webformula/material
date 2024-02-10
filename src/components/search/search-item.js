import WFCMenuItemElement from "../menu/menu-item.js";
import util from '../../core/util.js';

class WFCSearchItemElement extends WFCMenuItemElement {
  static tag = 'wfc-search-item';
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
}
customElements.define(WFCSearchItemElement.tag, WFCSearchItemElement);
