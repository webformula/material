import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import Ripple from '../../core/Ripple.js';


class MDWCheckboxElement extends HTMLComponentElement {
  static tag = 'mdw-checkbox';
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
    
    this.render();
    this.#input = this.shadowRoot.querySelector('input');
  }

  static get observedAttributesExtended() {
    return [
      ['aria-label', 'string'],
      ['checked', 'boolean'],
      ['indeterminate', 'boolean'],
      ['disabled', 'boolean'],
      ['readonly', 'boolean'],
      ['value', 'string']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
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
    this.#input.value = this.value;
    this.#input.checked = this.checked;
    this.#input.disabled = this.disabled;
    this.#input.indeterminate = this.indeterminate;
    this.#input.required = this.required;
    this.setAttribute('aria-checked', this.#checked.toString());

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



  get value() { return this.#value }
  set value(value) {
    this.#value = value;
    this.#input.value = this.#value;
    this.#internals.setFormValue(this.#checked ? this.#value : null, this.#checked ? 'checked' : undefined);
  }

  get checked() { return this.#checked }
  set checked(value) {
    this.#checked = value;
    this.#input.checked = this.#checked;
    this.#internals.setFormValue(this.#checked ? this.value : null, this.#checked ? 'checked' : undefined);
    this.classList.toggle('checked', this.#checked);

    if (this.indeterminate) {
      this.#indeterminate = false;
      this.classList.remove('indeterminate');
      this.#input.indeterminate = this.#indeterminate;
    }

    this.#selected = this.#checked || this.#indeterminate;
    this.classList.toggle('selected', this.#selected);
    this.setAttribute('aria-checked', this.#checked.toString());
  }

  get indeterminate() { return this.#indeterminate; }
  set indeterminate(value) {
    this.#indeterminate = value;
    this.#input.indeterminate = this.#indeterminate
    this.classList.toggle('indeterminate', this.#indeterminate);

    if (this.checked) {
      this.#checked = false;
      this.classList.remove('checked');
      this.#input.checked = this.#checked;
    }
    this.#internals.setFormValue(this.#checked ? this.value : null, this.#checked ? 'checked' : undefined);
    this.#selected = this.#checked || this.#indeterminate;
    this.classList.toggle('selected', this.#selected);
  }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(value) {
    this.toggleAttribute('disabled', value);
    this.#input.toggleAttribute('disabled', value);
  }

  get required() { return this.hasAttribute('required'); }
  set required(value) {
    this.toggleAttribute('required', value);
    this.#input.toggleAttribute('required', value);
  }

  get ariaLabel() { return this.#input.ariaLabel; }
  set ariaLabel(value) {
    this.#input.ariaLabel = value;
  }

  get validationMessage() { return this.#internals.validationMessage; }
  get validity() { return this.#internals.validity; }
  get willValidate() { return this.#internals.willValidate; }



  reset() {
    this.#touched = false;
    this.value = this.getAttribute('value') ?? '';
    this.indeterminate = this.hasAttribute('indeterminate');
    this.checked = this.hasAttribute('checked');
  }
  formResetCallback() { this.reset(); }

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
    this.checked = !this.#checked;
    this.dispatchEvent(new Event('change', { bubbles: true }));
    this.#updateValidity();
    if (this.classList.contains('invalid')) this.#updateValidityDisplay();
  }

  #updateValidity() {
    this.#touched = true;
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
      this.dispatchEvent(new Event('change', { bubbles: true }));
      this.#ripple.trigger();
      e.preventDefault();
    }
  }

  #slotChange() {
    this.#label = this.innerText;
    if (!this.ariaLabel) this.ariaLabel = this.#label;
    this.shadowRoot.querySelector('.label').classList.toggle('has-label', !!this.#label);
  }
}
customElements.define(MDWCheckboxElement.tag, MDWCheckboxElement);
