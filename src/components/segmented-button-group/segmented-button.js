import MDWButtonElement from '../button/component.js';
import { segmentedButtonShadowRoot } from '../../styles.js';


customElements.define('mdw-segmented-button', class MDWSegmentedButtonElement extends MDWButtonElement {
  useShadowRoot = true;
  useTemplate = false;
  static styleSheets = segmentedButtonShadowRoot;

  #checked = false;
  #value = this.getAttribute('value') || '';
  useRipple = false;
  #useCheckedIcon = this.parentElement.classList.contains('mdw-checked-icon');


  constructor() {
    super();

    if (this.hasAttribute('checked')) this.classList.add('mdw-checked');
    if (this.#useCheckedIcon) this.classList.add('mdw-checked-icon');
  }

  static get observedAttributes() {
    return ['value', 'checked'];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === 'checked') this.checked = newValue !== null;
    else this[name] = newValue;
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'radio');
  }

  get checked() {
    return this.#checked;
  }
  set checked(value) {
    this.#checked = !!value;
    this.classList.toggle('mdw-checked', this.#checked);
    this.parentElement.updateSelection(this.value, this.checked);
  }

  get value() {
    return this.#value;
  }
  set value(value) {
    this.#value = value;
  }

  template() {
    return /* html */`
      ${!this.#useCheckedIcon ? '' : /*html*/`
        <svg version="1.1" focusable="false" viewBox="0 0 16 16">
          <path fill="none" stroke="white" d="M5,8 7.7,10 12,5.5" ></path>
        </svg>
      `}
      <div class="slot-container"><slot></slot></div>
    `;
  }
});
