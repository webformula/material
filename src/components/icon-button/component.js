import HTMLComponentElement from '../HTMLComponentElement.js';
import Ripple from '../../core/Ripple.js';
import styles from './component.css' assert { type: 'css' };

const targetValues = ['_blank', '_parent', '_self', '_top'];


export default class MDWIconButtonElement extends HTMLComponentElement {
  static useShadowRoot = true;
  static useTemplate = true;
  static shadowRootDelegateFocus = true;
  static styleSheets = styles;

  #abort;
  #ripple;
  #ariaLabel;
  #target;
  #href;
  #button;
  #toggle = false;
  #checked = false;
  #focus_bound = this.#focus.bind(this);
  #blur_bound = this.#blur.bind(this);
  #focusMousedown_bound = this.#focusMousedown.bind(this);
  #focusKeydown_bound = this.#focusKeydown.bind(this);
  #onClick_bound = this.#onClick.bind(this);
  #slotChange_bound = this.#slotChange.bind(this);


  constructor() {
    super();

    this.role = 'button';
    this.render();
    this.#button = this.shadowRoot.querySelector('button');
  }


  static get observedAttributesExtended() {
    return [
      ['aria-label', 'string'],
      ['href', 'string'],
      ['target', 'string'],
      ['toggle', 'boolean'],
      ['checked', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  template() {
    return /*html*/`
      <button>
        <slot class="default-slot"></slot>
        <slot name="selected"></slot>
      </button>
      <div class="state-layer"></div>
      <div class="spinner"></div>
      <div class="ripple"></div>
    `;
  }

  connectedCallback() {
    this.#abort = new AbortController();
    this.#ripple = new Ripple({
      element: this.shadowRoot.querySelector('.ripple'),
      triggerElement: this
    });

    this.addEventListener('focus', this.#focus_bound, { signal: this.#abort.signal });
    this.addEventListener('mousedown', this.#focusMousedown_bound, { signal: this.#abort.signal });
    this.shadowRoot.addEventListener('slotchange', this.#slotChange_bound, { signal: this.#abort.signal });
    if (this.toggle) this.addEventListener('click', this.#onClick_bound, { signal: this.#abort.signal });
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
    if (this.#ripple) this.#ripple.destroy();
  }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(value) { this.toggleAttribute('disabled', !!value); }

  get href() { return this.#href; }
  set href(value) {
    this.#href = value;
    if (!value) {
      this.removeAttribute('href');
    } else {
      this.setAttribute('href', value);
      if (!this.#ariaLabel) this.ariaLabel = value.replace(/\//g, ' ').trim();
    }
  }

  get ariaLabel() { return this.#ariaLabel; }
  set ariaLabel(value) {
    this.#ariaLabel = value;
    this.setAttribute('aria-label', value);
  }

  get target() { return this.#target; }
  set target(value) {
    if (value && !targetValues.includes(value)) throw Error(`Invalid target value. Valid values ${targetValues.join(', ')}`);
    this.#target = value;
  }

  get toggle() { return this.#toggle; }
  set toggle(value) {
    this.#toggle = !!value;
  }

  get checked() { return this.#checked; }
  set checked(value) {
    this.#checked = !!value;
    this.classList.toggle('selected', this.#checked);
  }


  // prevent focus on click
  #focusMousedown(event) {
    event.preventDefault();
  }

  #focus() {
    this.addEventListener('blur', this.#blur_bound, { signal: this.#abort.signal });
    this.addEventListener('keydown', this.#focusKeydown_bound, { signal: this.#abort.signal });
  }

  #blur() {
    this.removeEventListener('blur', this.#blur_bound, { signal: this.#abort.signal });
    this.removeEventListener('keydown', this.#focusKeydown_bound, { signal: this.#abort.signal });
  }

  #focusKeydown(e) {
    if (e.key === 'Enter') this.#ripple.trigger();
  }

  #onClick() {
    this.checked = !this.checked;
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  #slotChange(event) {
    if (event.target.name === 'selected') {
      this.classList.toggle('selected-icon', event.target.assignedElements().length > 0);
    }
  }
};

customElements.define('mdw-icon-button', MDWIconButtonElement);
