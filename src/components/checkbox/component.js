import HTMLElementExtended from '../HTMLElementExtended.js';
import styleAsString from '!!raw-loader!./component.css';
import util from '../../core/util.js';
import Ripple from '../../core/Ripple.js';


export default class MDWCheckboxElement extends HTMLElementExtended {
  useShadowRoot = true;

  #checked = false;
  #indeterminate = false;
  #value = 'on';
  #disabled = false;
  #click_bound = this.#click.bind(this);
  #ripple;


  constructor() {
    super();
  }

  connectedCallback() {
    this.setAttribute('role', 'checkbox');
    this.tabIndex = 0;
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', util.getTextFromNode(this));
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#click_bound);
    this.#ripple.destroy();
  }

  afterRender() {
    this.addEventListener('click', this.#click_bound);
    this.#ripple = new Ripple({
      element: this.shadowRoot.querySelector('.ripple'),
      triggerElement: this,
      centered: true
    });
  }

  template() {
    return /*html*/`
      <div class="background">
        <svg version="1.1" focusable="false" viewBox="0 0 24 24">
          <path fill="none" stroke="white" d="M4.1,12.7 9,17.6 20.3,6.3" ></path>
        </svg>
        <div class="indeterminate-check"></div>
        <div class="ripple"></div>
      </div>

      <slot></slot>

      <style>
        ${styleAsString}
      </style>
    `;
  }


  static get observedAttributes() {
    return ['checked', 'indeterminate', 'disabled', 'value'];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === 'checked') this.checked = newValue !== null;
    else if (name === 'indeterminate') this.indeterminate = newValue !== null;
    else if (name === 'disabled') this.disabled = newValue !== null;
    else this[name] = newValue;
  }

  get checked() {
    return this.#checked;
  }
  set checked(value) {
    this.#checked = !!value;
    this.classList.toggle('mdw-checked', this.#checked);
    this.setAttribute('aria-checked', this.#checked.toString() || 'false');
  }

  get indeterminate() {
    return this.#indeterminate;
  }
  set indeterminate(value) {
    this.#indeterminate = !!value;
    this.classList.toggle('mdw-indeterminate', this.#indeterminate);
    if (value === true) this.setAttribute('aria-checked', 'mixed');
    else this.setAttribute('aria-checked', this.#checked.toString() || 'false');
  }

  get disabled() {
    return this.#disabled;
  }
  set disabled(value) {
    this.#disabled = !!value;
    this.toggleAttribute('disabled', this.#disabled);
  }

  get value() {
    return this.#value;
  }
  set value(value) {
    this.#value = value;
  }

  #click() {
    this.checked = !this.#checked;
    this.dispatchEvent(new Event('change'));
  }
}


customElements.define('mdw-checkbox', MDWCheckboxElement);
