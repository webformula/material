import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };

class WFCSwitchElement extends HTMLComponentElement {
  static tag = 'wfc-switch';
  static useShadowRoot = true;
  static useTemplate = true;
  static shadowRootDelegateFocus = true;
  static styleSheets = styles;
  static formAssociated = true;


  #internals;
  #input;
  #abort;
  #value = 'on';
  #checked = false;
  #touched = false;
  #click_bound = this.#click.bind(this);
  #focus_bound = this.#focus.bind(this);
  #blur_bound = this.#blur.bind(this);
  #focusKeydown_bound = this.#focusKeydown.bind(this);
  #slotChange_bound = this.#slotChange.bind(this);

  constructor() {
    super();

    this.#internals = this.attachInternals();
    this.role = 'switch';
    this.render();
    this.#input = this.shadowRoot.querySelector('input');
  }

  static get observedAttributesExtended() {
    return [
      ['aria-label', 'string'],
      ['checked', 'boolean'],
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
      <slot class="label"></slot>
      <div class="container">
        <input type="checkbox" role="switch">
        <div class="track">
          <div class="thumb-container">
            <div class="thumb">
              <div class="icon icon-on">
                <svg viewBox="0 0 24 24">
                  <path d="M9.55 18.2 3.65 12.3 5.275 10.675 9.55 14.95 18.725 5.775 20.35 7.4Z" />
                </svg>
              </div>
              <div class="icon icon-off">
                <svg viewBox="0 0 24 24">
                  <path d="M6.4 19.2 4.8 17.6 10.4 12 4.8 6.4 6.4 4.8 12 10.4 17.6 4.8 19.2 6.4 13.6 12 19.2 17.6 17.6 19.2 12 13.6Z" />
                </svg>
              </div>

            <wfc-state-layer></wfc-state-layer>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    this.#abort = new AbortController();

    this.#input.value = this.value;
    this.#input.checked = this.checked;
    this.#input.disabled = this.disabled;
    this.#input.required = this.required;
    this.setAttribute('aria-checked', this.#checked.toString());

    this.addEventListener('click', this.#click_bound, { signal: this.#abort.signal });
    this.addEventListener('focus', this.#focus_bound, { signal: this.#abort.signal });
    this.shadowRoot.addEventListener('slotchange', this.#slotChange_bound, { signal: this.#abort.signal });
    this.#updateValidity();
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
  }



  get value() { return this.#value; }
  set value(value) {
    this.#value = value;
    this.#input.value = this.#value;
    this.#internals.setFormValue(this.#checked ? this.#value : null, this.#checked ? 'checked' : undefined);
  }

  get ariaLabel() { return this.#input.ariaLabel; }
  set ariaLabel(value) {
    this.#input.ariaLabel = value;
  }

  get checked() { return this.#checked; }
  set checked(value) {
    this.#checked = value;
    this.#input.checked = this.#checked;
    this.#internals.setFormValue(this.#checked ? this.value : null, this.#checked ? 'checked' : undefined);
    this.classList.toggle('checked', this.#checked);
    this.setAttribute('aria-checked', this.#checked.toString());
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

  get validationMessage() { return this.#internals.validationMessage; }
  get validity() { return this.#internals.validity; }
  get willValidate() { return this.#internals.willValidate; }

  reset() {
    this.#touched = false;
    this.value = this.getAttribute('value') ?? '';
    this.checked = this.getAttribute('checked');
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
      this.shadowRoot.querySelector('wfc-state-layer').triggerRipple();
      e.preventDefault();
    }
  }

  #slotChange() {
    if (!this.ariaLabel) this.ariaLabel = this.innerText;
  }
}
customElements.define(WFCSwitchElement.tag, WFCSwitchElement);
