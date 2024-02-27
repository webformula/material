import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };

const targetValues = ['_blank', '_parent', '_self', '_top'];


export default class WFCIconButtonElement extends HTMLComponentElement {
  static tag = 'wfc-icon-button';
  static useShadowRoot = true;
  static useTemplate = true;
  static shadowRootDelegateFocus = true;
  static styleSheets = styles;

  #abort;
  #target;
  #href;
  #ariaLabel;
  #toggle = false;
  #checked = false;
  #onClick_bound = this.#onClick.bind(this);
  #slotChange_bound = this.#slotChange.bind(this);


  constructor() {
    super();

    this.role = 'button';
    this.render();
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
      <div class="spinner"></div>
      <wfc-state-layer ripple></wfc-state-layer>
    `;
  }

  connectedCallback() {
    this.#abort = new AbortController();
    this.shadowRoot.addEventListener('slotchange', this.#slotChange_bound, { signal: this.#abort.signal });
    if (this.toggle) this.addEventListener('click', this.#onClick_bound, { signal: this.#abort.signal });
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
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
    }
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

  get ariaLabel() { return this.#ariaLabel; }
  set ariaLabel(value) {
    this.#ariaLabel = value;
    if (!value) this.shadowRoot.querySelector('button').removeAttribute('aria-label');
    else this.shadowRoot.querySelector('button').setAttribute('aria-label', value);
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

customElements.define(WFCIconButtonElement.tag, WFCIconButtonElement);
