import HTMLComponentElement from '../HTMLComponentElement.js';
import Ripple from '../../core/Ripple.js';
import styles from './radios.css' assert { type: 'css' };


export default class MDWRadioElement extends HTMLComponentElement {
  static useShadowRoot = true;
  static useTemplate = true;
  static shadowRootDelegateFocus = true;
  static styleSheets = styles;
  static formAssociated = true;

  #abort;
  #internals;
  #ripple;
  #input;
  #value = 'on';
  #name;
  #checked = false;
  #click_bound = this.#click.bind(this);
  #focus_bound = this.#focus.bind(this);
  #blur_bound = this.#blur.bind(this);
  #focusKeydown_bound = this.#focusKeydown.bind(this);
  #focusMousedown_bound = this.#focusMousedown.bind(this);
  #slotChange_bound = this.#slotChange.bind(this);


  constructor() {
    super();

    this.#internals = this.attachInternals();
    this.role = 'radio';
    this.render();
    this.#input = this.shadowRoot.querySelector('.container input');
    this.ariaChecked = false;
    this.#internals.ariaChecked = false;
  }


  static get observedAttributesExtended() {
    return [
      ['aria-label', 'string'],
      ['checked', 'boolean'],
      ['value', 'string'],
      ['disabled', 'boolean'],
      ['name', 'string']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }


  template() {
    return /*html*/`
      <div class="container">
        <div class="background"></div>
        <input type="radio" />
        <div class="state-layer"></div>
        <div class="ripple"></div>
      </div>
      <slot class="label"></slot>
    `;
  }

  connectedCallback() {
    this.#input.value = this.value;
    this.#input.checked = this.checked;
    this.#input.disabled = this.disabled;

    this.#abort = new AbortController();
    this.addEventListener('click', this.#click_bound, { signal: this.#abort.signal });
    this.addEventListener('focus', this.#focus_bound, { signal: this.#abort.signal });
    this.addEventListener('mousedown', this.#focusMousedown_bound, { signal: this.#abort.signal });
    this.shadowRoot.addEventListener('slotchange', this.#slotChange_bound, { signal: this.#abort.signal });
    this.#updateValidity();

    this.#ripple = new Ripple({
      element: this.shadowRoot.querySelector('.ripple'),
      triggerElement: this,
      centered: true
    });
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
    if (this.#ripple) this.#ripple.destroy();
  }


  get value() { return this.#value; }
  set value(value) {
    this.#value = value;
    this.#input.value = this.#value;
    this.#internals.setFormValue(this.checked ? this.#value : null, this.checked ? 'checked' : undefined);
  }

  get ariaLabel() { return this.#input.ariaLabel; }
  set ariaLabel(value) {
    this.#input.ariaLabel = value;
  }

  get checked() { return this.#checked }
  set checked(value) {
    this.#checked = value;
    this.#input.checked = this.#checked;
    this.#internals.setFormValue(this.#checked ? this.value : null, this.checked ? 'checked' : undefined);

    const current = this.#checked === true && document.querySelector(`mdw-radio[name="${this.name}"].checked`);
    if (current) current.checked = false;

    this.classList.toggle('checked', this.#checked);
    this.#internals.ariaChecked = this.#checked;
    this.ariaChecked = this.#checked;
  }

  get name() { return this.#name }
  set name(value) {
    this.#name = value;
    this.#input.name = this.#name;
    this.#internals.setFormValue(this.checked ? this.value : null, this.checked ? 'checked' : undefined);
  }


  checkValidity() { return this.#internals.checkValidity(); }
  reportValidity() {
    this.#updateValidityDisplay();
    return this.checkValidity();
  }
  setCustomValidity(value = '') {
    this.#input.setCustomValidity(value);
    this.#updateValidityDisplay();
  }


  #click() {
    if (this.checked) return;

    this.checked = true;
    this.dispatchEvent(new Event('change', { bubbles: true }));
    this.#updateValidity();
    if (this.classList.contains('invalid')) this.#updateValidityDisplay();
  }

  #updateValidity() {
    // this.#touched = true;
    this.#internals.setValidity(this.#input.validity, this.#input.validationMessage || '');
  }

  #updateValidityDisplay() {
    this.classList.toggle('invalid', !this.#input.validity.valid);
  }

  #focus() {
    this.addEventListener('blur', this.#blur_bound, { signal: this.#abort.signal });
    this.addEventListener('keydown', this.#focusKeydown_bound, { signal: this.#abort.signal });
  }

  // prevent focus on click
  #focusMousedown(event) {
    event.preventDefault();
  }

  #blur() {
    // if (this.#touched) {
      this.#updateValidity();
      this.#updateValidityDisplay();
    // }
    this.removeEventListener('blur', this.#blur_bound);
    this.removeEventListener('keydown', this.#focusKeydown_bound);
  }

  #focusKeydown(e) {
    if (e.code === 'Space') {
      if (this.checked) return;

      this.checked = true;
      if (this.classList.contains('invalid')) this.#updateValidityDisplay();
      this.dispatchEvent(new Event('change', { bubbles: true }));
      this.#ripple.trigger();
      e.preventDefault();
    }

    if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
      const radios = [...document.querySelectorAll(`mdw-radio[name="${this.name}"]`)];
      const index = radios.indexOf(this);
      if (e.code === 'ArrowUp' && index > 0) {
        radios[index - 1].focus();
        radios[index - 1].click();
        e.preventDefault();
      }

      if (e.code === 'ArrowDown' && index < radios.length - 1) {
        radios[index + 1].focus();
        radios[index + 1].click();
        e.preventDefault();
      }
    }
  }

  #slotChange() {
    if (!this.ariaLabel) this.ariaLabel = this.innerText;
    this.shadowRoot.querySelector('.label').classList.toggle('has-label', !!this.innerText);
  }
};

customElements.define('mdw-radio', MDWRadioElement);
