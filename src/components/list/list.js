import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './list.css' assert { type: 'css' };

class WFCListElement extends HTMLComponentElement {
  static tag = 'wfc-list';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = styles;

  #selectionMode = false
  #isSelectionMode = false;
  #onChange_bound = this.#onChange.bind(this);

  constructor() {
    super();

    this.role = 'list';
    this.render();
  }

  template() {
    return /*html*/`
      <slot></slot>
    `;
  }

  disconnectedCallback() {
    this.removeEventListener('change', this.#onChange_bound);
  }


  static get observedAttributesExtended() {
    return [
      ['value', 'string'],
      ['selection-mode', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }


  get value() {
    return [...this.querySelectorAll('wfc-list-item')]
      .filter(e => e.selected)
      .map(e => e.value || e.getAttribute('id'))
      .join(',');
  }
  set value(value) {
    const valueArray = value.split(',');
    [...this.querySelectorAll('wfc-list-item')]
      .forEach(item => item.selected = valueArray.includes(item.value));
  }

  get values() {
    return [...this.querySelectorAll('wfc-list-item')]
      .filter(e => e.selected)
      .map(e => e.value || e.getAttribute('id'));
  }
  set values(value) {
    [...this.querySelectorAll('wfc-list-item')]
      .forEach(item => item.selected = value.includes(item.value));
  }

  get selectionMode() {
    return this.#selectionMode;
  }
  set selectionMode(value) {
    this.#selectionMode = !!value;
    if (this.#selectionMode) {
      this.addEventListener('change', this.#onChange_bound);
    } else {
      this.removeEventListener('change', this.#onChange_bound);
    }
  }


  
  exitSelectionMode() {
    this.#isSelectionMode = false;
    [...this.querySelectorAll('wfc-list-item')].forEach(e => {
      e.selectionMode = false;
      e.selected = false;
    });
    this.dispatchEvent(new Event('exit-selection-mode', { bubbles: true }));
  }


  #onChange(event) {
    if (event.detail !== 'longpress' || this.#isSelectionMode) {
      if (this.values.length === 0) this.exitSelectionMode();
      return;
    }
    this.#isSelectionMode = true;
    [...this.querySelectorAll('wfc-list-item')].forEach(e => e.selectionMode = true);
    this.dispatchEvent(new Event('enter-selection-mode', { bubbles: true }));
  }
}
customElements.define(WFCListElement.tag, WFCListElement);
