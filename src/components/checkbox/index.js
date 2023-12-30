import HTMLElementExtended from '../HTMLElementExtended.js';
import styles from './component.css' assert { type: 'css' };
import Ripple from '../../core/Ripple.js';


customElements.define('mdw-checkbox', class MDWCheckboxElement extends HTMLElementExtended {
  static useShadowRoot = true;
  static useTemplate = true;
  static shadowRootDelegateFocus = true;
  static styleSheets = styles;
  static formAssociated = true;

  #internals;
  #input;
  #abort;
  #ripple;
  #label;
  #value = 'on';
  #checked = false;
  #indeterminate = false;
  #selected = false;
  #touched = false;
  #click_bound = this.#click.bind(this);
  #focus_bound = this.#focus.bind(this);
  #blur_bound = this.#blur.bind(this);
  #focusKeydown_bound = this.#focusKeydown.bind(this);
  #focusMousedown_bound = this.#focusMousedown.bind(this);
  #slotChange_bound = this.#slotChange.bind(this);

  constructor() {
    super();

    this.#internals = this.attachInternals();
    this.role = 'checkbox';
  }

  static get observedAttributes() {
    return [
      'aria-label',
      'checked',
      'indeterminate',
      'disabled',
      'readonly',
      'value'
    ];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === 'aria-label') this.ariaLabel = newValue;
    this[name] = newValue;
  }

  template() {
    return /*html*/`
      <div class="container">
        <input type="checkbox">
        <div class="outline"></div>
        <div class="background"></div>
        <div class="state-layer"></div>
        <svg class="icon" viewBox="0 0 18 18" aria-hidden="true">
          <rect class="mark short" />
          <rect class="mark long" />
        </svg>
        <div class="ripple"></div>
      </div>
      <slot class="label"></slot>
    `; 
  }

  connectedCallback() {
    this.#abort = new AbortController();
  }

  afterRender() {
    this.#input = this.shadowRoot.querySelector('input');
    this.#input.value = this.value;
    this.#input.checked = this.checked;
    this.#input.disabled = this.disabled;
    this.#input.indeterminate = this.indeterminate;
    this.#input.required = this.required;
    this.setAttribute('aria-checked', this.#checked.toString());
    if (!this.hasAttribute('aria-label')) this.ariaLabel = 'switch';

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
    if (this.rendered) this.#input.value = this.#value;
    this.#internals.setFormValue(this.#checked ? this.#value : null, this.#checked ? 'checked' : undefined);
  }

  get checked() { return this.#checked; }
  set checked(value) {
    value = value !== null && value !== false;
    this.#checked = value;
    if (this.rendered) this.#input.checked = this.#checked;
    this.#internals.setFormValue(this.#checked ? this.value : null, this.#checked ? 'checked' : undefined);
    this.classList.toggle('checked', this.#checked);

    if (this.indeterminate) {
      this.#indeterminate = false;
      this.classList.remove('indeterminate');
      if (this.rendered) this.#input.indeterminate = this.#indeterminate;
    }

    this.#selected = this.#checked || this.#indeterminate;
    this.classList.toggle('selected', this.#selected);
    this.setAttribute('aria-checked', this.#checked.toString());
  }

  get indeterminate() { return this.#indeterminate; }
  set indeterminate(value) {
    value = value !== null && value !== false;
    this.#indeterminate = value;
    if (this.rendered) this.#input.indeterminate = this.#indeterminate
    this.classList.toggle('indeterminate', this.#indeterminate);

    if (this.checked) {
      this.#checked = false;
      this.classList.remove('checked');
      if (this.rendered) this.#input.checked = this.#checked;
    }
    this.#internals.setFormValue(this.#checked ? this.value : null, this.#checked ? 'checked' : undefined);
    this.#selected = this.#checked || this.#indeterminate;
    this.classList.toggle('selected', this.#selected);
  }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(value) {
    value = value !== null && value !== false;
    this.toggleAttribute('disabled', value);
    if (this.rendered) this.#input.toggleAttribute('disabled', value);
  }

  get required() { return this.hasAttribute('required'); }
  set required(value) {
    value = value !== null && value !== false;
    this.toggleAttribute('required', value);
    if (this.rendered) this.#input.toggleAttribute('required', value);
  }

  get ariaLabel() { return this.hasAttribute('aria-label'); }
  set ariaLabel(value) {
    if (`${value}` === this.getAttribute('aria-label')) return;
    this.setAttribute('aria-label', value);
  }

  get validationMessage() { return this.#internals.validationMessage; }
  get validity() { return this.#internals.validity; }
  get willValidate() { return this.#internals.willValidate; }



  reset() {
    this.#touched = false;
    this.value = this.getAttribute('value') ?? '';
    this.checked = this.getAttribute('checked');
    this.indeterminate = this.getAttribute('indeterminate');
  }
  formResetCallback() { this.reset(); }

  checkValidity() { return this.#internals.checkValidity(); }
  reportValidity() {
    this.#updateValidityDisplay();
  }
  setCustomValidity(value = '') {
    if (this.rendered) {
      this.#input.setCustomValidity(value);
      this.#updateValidityDisplay();
    }
  }



  #click() {
    this.checked = !this.#checked;
    this.dispatchEvent(new Event('change'));
    this.#updateValidity();
    if (this.classList.contains('invalid')) this.#updateValidityDisplay();
  }

  #updateValidity() {
    this.#touched = true;
    this.#internals.setValidity(this.#input.validity, this.#input.validationMessage || '');
  }

  #updateValidityDisplay() {
    if (!this.rendered) return;
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
    if (this.#touched) {
      this.#updateValidity();
      this.#updateValidityDisplay();
    }
    this.removeEventListener('blur', this.#blur_bound);
    this.removeEventListener('keydown', this.#focusKeydown_bound);
  }

  #focusKeydown(e) {
    if (e.code === 'Space') {
      this.checked = !this.checked;
      if (this.classList.contains('invalid')) this.#updateValidityDisplay();
      this.dispatchEvent(new Event('change'));
      e.preventDefault();
    }
  }

  #slotChange() {
    this.#label = this.innerText;
    if (!this.hasAttribute('aria-label')) this.ariaLabel = this.#label;
    this.shadowRoot.querySelector('.label').classList.toggle('has-label', !!this.#label);
  }
});
