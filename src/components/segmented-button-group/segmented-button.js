import WFCButtonElement from '../button/index.js';
import styles from './segmented-button.css' assert { type: 'css' };
import buttonStyles from '../button/component.css' assert { type: 'css' };


class WFCSegmentedButtonElement extends WFCButtonElement {
  static tag = 'wfc-segmented-button';
  static useShadowRoot = true;
  static useTemplate = true;
  static shadowRootDelegateFocus = true;
  static styleSheets = [buttonStyles, styles];

  #checked = false;
  #value;
  #noCheckmark = false;


  constructor() {
    super();

    this.role = 'radio';
    this.ariaChecked = false;
  }

  template() {
    return /*html*/`
      <button>
        <div class="check">
          <svg viewBox="0 0 40 40">
            <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>
        <slot name="leading-icon"></slot>
        <slot class="default-slot"></slot>
      </button>
      <div class="spinner"></div>
    `;
  }

  static get observedAttributesExtended() {
    return [
      ['value', 'string'],
      ['checked', 'boolean'],
      ['no-checkmark', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  connectedCallback() {
    super.connectedCallback();

    setTimeout(() => {
      this.classList.add('animation');
    }, 350);
  }

  get checked() { return this.#checked; }
  set checked(value) {
    this.#checked = !!value;
    this.classList.toggle('checked', this.#checked);
    this.ariaChecked = this.#checked;
  }

  get value() { return this.#value; }
  set value(value) { this.#value = value; }

  get noCheckmark() { return this.#noCheckmark; }
  set noCheckmark(value) {
    this.#noCheckmark = !!value;
    this.classList.toggle('no-checkmark', this.#noCheckmark);
  }
}
customElements.define(WFCSegmentedButtonElement.tag, WFCSegmentedButtonElement);
