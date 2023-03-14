import HTMLElementExtended from '../HTMLElementExtended.js';
import sheet from './component.css' assert { type: 'css' };
import util from '../../core/util.js';
import Ripple from '../../core/Ripple.js';
import './global.css';


// TODO error style

export default class MDWCheckboxElement extends HTMLElementExtended {
  useShadowRoot = true;

  #checked = false;
  #indeterminate = false;
  #value = 'on';
  #disabled = false;
  #click_bound = this.#click.bind(this);
  #onInvalid_bound = this.#onInvalid.bind(this);
  #ripple;
  #input;
  #focus_bound = this.#focus.bind(this);
  #blur_bound = this.#blur.bind(this);
  #focusKeydown_bound = this.#focusKeydown.bind(this);


  constructor() {
    super();

    this.classList.add('mdw-no-animation');
  }

  connectedCallback() {
    this.setAttribute('role', 'checkbox');
    this.tabIndex = 0;
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', util.getTextFromNode(this) || 'checkbox');
    this.addEventListener('focus', this.#focus_bound);

    if (!this.hasAttribute('aria-label')) {
      const text = util.getTextFromNode(this);
      if (text) this.setAttribute('aria-label', text);
    }
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#click_bound);
    this.removeEventListener('focus', this.#focus_bound);
    this.removeEventListener('blur', this.#blur_bound);
    this.#input.removeEventListener('invalid', this.#onInvalid_bound);
    this.#ripple.destroy();
  }

  afterRender() {
    this.#input = this.shadowRoot.querySelector('input');
    this.#input.checked = this.#checked;
    this.#input.indeterminate = this.#indeterminate;
    this.#input.value = this.#value;
    if (this.hasAttribute('required')) {
      this.#input.required = true;
      this.#input.addEventListener('invalid', this.#onInvalid_bound);
    }

    this.addEventListener('click', this.#click_bound);
    this.#ripple = new Ripple({
      element: this.shadowRoot.querySelector('.ripple'),
      triggerElement: this,
      centered: true
    });

    setTimeout(() => {
      this.classList.remove('mdw-no-animation');
    }, 200);
  }

  template() {
    return /*html*/`
      <input type="checkbox">
      <div class="background">
        <svg version="1.1" focusable="false" viewBox="0 0 24 24">
          <path fill="none" stroke="white" d="M4.1,12.7 9,17.6 20.3,6.3" ></path>
        </svg>
        <div class="indeterminate-check"></div>
        <div class="ripple"></div>
      </div>

      <slot></slot>

      <style>${this.stringifyStyleSheet(sheet)}</style>
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
    if (this.#input) this.#input.checked = this.#checked;
    this.classList.toggle('mdw-checked', this.#checked);
    this.setAttribute('aria-checked', this.#checked.toString() || 'false');
    this.#onInvalid();
  }

  get indeterminate() {
    return this.#indeterminate;
  }
  set indeterminate(value) {
    this.#indeterminate = !!value;
    if (this.#input) this.#input.indeterminate = this.#indeterminate
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
    if (this.#input) this.#input.value = value;
  }

  get validity() {
    return this.#input.validity;
  }

  reportValidity() {
    return this.#input.reportValidity();
  }

  checkValidity() {
    return this.#input.checkValidity();
  }

  #click() {
    this.checked = !this.#checked;
    this.#onInvalid();
    this.blur();
    this.dispatchEvent(new Event('change'));
  }

  #onInvalid() {
    if (!this.#input) return;
    this.classList.toggle('mdw-invalid', !this.#input.validity.valid);
  }

  #focus() {
    this.addEventListener('blur', this.#blur_bound);
    this.addEventListener('keydown', this.#focusKeydown_bound);
  }

  #blur() {
    this.removeEventListener('blur', this.#blur_bound);
    this.removeEventListener('keydown', this.#focusKeydown_bound);
  }

  #focusKeydown(e) {
    if (e.code === 'Space') {
      this.checked = !this.checked;
      e.preventDefault();
    }
  }
}


customElements.define('mdw-checkbox', MDWCheckboxElement);
