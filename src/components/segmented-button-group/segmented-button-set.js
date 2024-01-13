import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './segmented-button-set.css' assert { type: 'css' };



customElements.define('mdw-segmented-button-set', class MDWSegmentedButtonSetElement extends HTMLComponentElement {
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = styles;

  #multiple = false;
  #onclick_bound = this.#onclick.bind(this);


  constructor() {
    super();

    this.role = 'radiogroup';
    this.render();
  }

  template() {
    return /*html*/`<slot></slot>`;
  }

  connectedCallback() {
    this.addEventListener('click', this.#onclick_bound);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#onclick_bound);
  }

  static get observedAttributesExtended() {
    return [
      ['value', 'string'],
      ['multiple', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get value() { return [...this.querySelectorAll('mdw-segmented-button.checked')].map(e => e.value).join(','); }
  set value(value) {
    const valueArray = value.split(',');
    [...this.querySelectorAll('mdw-segmented-button')].forEach(item => {
      item.checked = valueArray.includes(item.value);
    });
  }

  get multiple() { return this.#multiple; }
  set multiple(value) { this.#multiple = !!value; }
  

  deselect() {
    const currentSelected = this.querySelector('mdw-segmented-button.checked');
    if (currentSelected) currentSelected.checked = false;
  }

  #onclick(event) {
    if (this.#multiple) {
      event.target.checked = !event.target.checked;
      return;
    }

    this.deselect();
    event.target.checked = true;
  }
});
