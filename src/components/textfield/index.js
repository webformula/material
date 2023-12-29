import HTMLElementExtended from '../HTMLElementExtended.js';
import styles from './component.css' assert { type: 'css' };
import { error_FILL1_wght400_GRAD0_opsz24 } from '../../core/svgs.js';
import Formatter from './Formatter.js';
import util from '../../core/util.js';

const dashCaseRegex = /-([a-z])/g;

// TODO character count
// TODO on enter suggestion fill

export default class MDWTextfieldElement extends HTMLElementExtended {
  static useShadowRoot = true;
  static useTemplate = false;
  static shadowRootDelegateFocus = true;
  static styleSheets = styles;
  static formAssociated = true;

  #internals;
  #input;
  #focusValue;
  #dirty = false;
  #touched = false;
  #value = '';
  #label = '';
  #supportingText = '';
  #errorText = '';
  #invalidIcon;
  #customValidityMessage;
  #abort;
  #formatter;
  #suggestion;
  #slotChange_bound = this.#slotChange.bind(this);
  #onInput_bound = this.#onInput.bind(this);
  #onBlur_bound = this.#onBlur.bind(this);
  #onFocus_bound = this.#onFocus.bind(this);
  #onSelect_bound = this.#onSelect.bind(this);


  constructor() {
    super();
    this.#internals = this.attachInternals();
  }

  // TODO update
  static get observedAttributes() {
    return [
      'aria-label',
      'autocomplete',
      'disabled',
      'format',
      'label',
      'mask',
      'max',
      'min',
      'step',
      'maxlength',
      'minlength',
      'pattern',
      'pattern-restrict',
      'prefix-text',
      'readonly',
      'suffix-text',
      'supporting-text',
      'suggestion',
      'error-text',
      'type',
      'value'];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === 'value' && this.#dirty) return;
    name = name.replace(dashCaseRegex, (_, s) => s.toUpperCase());
    this[name] = newValue;
  }

  connectedCallback() {
    this.#abort = new AbortController();
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
    if (this.#formatter) this.#formatter.disable();
  }

  afterRender() {
    this.#input = this.shadowRoot.querySelector('.text-field input');
    this.#input.value = this.value;
    // if (this.#customValidityMessage) this.#input.setCustomValidity(this.#customValidityMessage);
    this.#internals.setValidity(this.#input.validity, this.#input.validationMessage, this.#input);
    // if (this.#customValidityMessage) this.#updateValidityDisplay();
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', this.#label || 'input');

    this.shadowRoot.addEventListener('slotchange', this.#slotChange_bound, { signal: this.#abort.signal });
    this.#input.addEventListener('input', this.#onInput_bound, { signal: this.#abort.signal });
    this.#input.addEventListener('select', this.#onSelect_bound, { signal: this.#abort.signal });
    this.addEventListener('focus', this.#onFocus_bound, { signal: this.#abort.signal });
    this.addEventListener('blur', this.#onBlur_bound, { signal: this.#abort.signal });

    this.classList.toggle('has-value', !!this.value);

    setTimeout(() => {
      this.shadowRoot.querySelector('.text-field label').classList.remove('no-animation');
    }, 100);
  }

  template() {
    return /*html*/`
      <div class="text-field${!this.#label ? '' : ' label'}">
        <slot name="leading-icon"></slot>
        ${this.prefixText ? `<div class="prefix-text">${this.prefixText}</div>` : ''}
        <input
          ${this.hasAttribute('value') ? `value="${this.getAttribute('value')}"` : ''}
          ${this.hasAttribute('type') ? `type="${this.getAttribute('type')}"` : ''}
          ${this.autocomplete ? `autocomplete="${this.autocomplete}"` : ''}
          ${this.multiple ? 'multiple' : ''}
          ${this.disabled ? 'disabled' : ''}
          ${this.min ? `min="${this.min}"` : ''}
          ${this.max ? `max="${this.max}"` : ''}
          ${this.step ? `step="${this.step}"` : ''}
          ${this.minlength ? `minlength="${this.minlength}"` : ''}
          ${this.maxlength ? `maxlength="${this.maxlength}"` : ''}
          ${this.pattern ? `pattern=${this.pattern}` : ''}
          placeholder="${this.placeholder || ' '}"
          ${this.readonly ? 'readonly' : ''}
          ${this.required ? 'required' : ''}
        />
        <label class="no-animation">${this.label}</label>
        ${!this.classList.contains('outlined') ? '' : `
        <div class="outlined-border-container">
          <div class="outlined-leading"></div>
          <div class="outlined-notch">${this.label}</div>
          <div class="outlined-trailing"></div>
        </div>
        `}
        <div class="suggestion"></div>
        ${this.suffixText ? `<span class="suffix-text">${this.suffixText}</span>` : ''}
        <slot name="trailing-icon"></slot>
        <div class="supporting-text" title="${this.#supportingText}">${this.#supportingText}</div>
      </div>
    `.replace(/^\s*\n/gm, '').replace(/^\s{6}/gm, '');
  }




  get ariaLabel() { return this.getAttribute('aria-label'); }
  set ariaLabel(value) {
    if (`${value}` === this.getAttribute('aria-label') || `${value}` === 'label') return;

    if (value) this.setAttribute('aria-label', value);
    else this.removeAttribute('aria-label');
  }

  get autocomplete() { return this.getAttribute('autocomplete'); }
  set autocomplete(value) {
    if (value) this.setAttribute('autocomplete', value);
    else this.removeAttribute('autocomplete');
  }

  get label() { return this.#label; }
  set label(value) {
    if (!this.rendered) {
      this.#label = `${value || ''}`;
      return;
    }
    const labelEl = this.shadowRoot.querySelector('.text-field label');
    if (labelEl.innerText === value) return;
    this.#label = `${value || ''}`;
    this.shadowRoot.querySelector('.text-field').classList.toggle('label', !!this.#label);
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', this.#label);
  }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(value) {
    value = value !== null && value !== false;
    this.toggleAttribute('disabled', value);
    if (value) this.blur();
    if (this.rendered) this.#input.toggleAttribute('disabled', value);
  }

  get form() { return this.#internals.form; }

  get format() { return this.getAttribute('format'); }
  set format(value) {
    this.#addFormatter();
    this.#formatter.format = value;
    if (this.format === value) return;
    this.setAttribute('format', value);
  }

  get formattedValue() { return this.#formatter ? this.#formatter.formattedValue : this.value; }

  get mask() { return this.getAttribute('mask'); }
  set mask(value) {
    this.#addFormatter();
    this.#formatter.mask = value;
    if (this.mask === value) return;
    this.setAttribute('mask', value);
  }

  get maskedValue() { return this.#formatter ? this.#formatter.maskedValue : this.value; }

  get max() { return this.getAttribute('max'); }
  set max(value) {
    if (`${value}` === this.getAttribute('max')) return;
    this.setAttribute('max', value);
    if (this.rendered) this.#input.setAttribute('max', value);
  }

  get min() { return this.getAttribute('min'); }
  set min(value) {
    if (`${value}` === this.getAttribute('min')) return;
    this.setAttribute('min', value);
    if (this.rendered) this.#input.setAttribute('min', value);
  }

  get step() { return this.getAttribute('step'); }
  set step(value) {
    if (`${value}` === this.getAttribute('step')) return;
    this.setAttribute('step', value);
    if (this.rendered) this.#input.setAttribute('step', value);
  }

  get maxlength() { return this.getAttribute('maxlength'); }
  set maxlength(value) {
    if (`${value}` === this.getAttribute('maxlength')) return;
    this.setAttribute('maxlength', value);
    if (this.rendered) this.#input.setAttribute('maxlength', value);
  }

  get minlength() { return this.getAttribute('minlength'); }
  set minlength(value) {
    if (`${value}` === this.getAttribute('minlength')) return;
    this.setAttribute('minlength', value);
    if (this.rendered) this.#input.setAttribute('minlength', value);
  }

  get multiple() { return this.hasAttribute('multiple'); }
  set multiple(value) {
    value = value !== null && value !== false;
    this.toggleAttribute('multiple', value);
    if (this.rendered) this.#input.toggleAttribute('multiple', value);
  }

  get pattern() { return this.getAttribute('pattern'); }
  set pattern(value) {
    this.#addFormatter();
    this.#formatter.pattern = value;
    if (value) this.#formatter.enable();
    else this.#formatter.disable();

    if (this.pattern === value) return;
    this.setAttribute('pattern', value);
    if (this.rendered) this.#input.setAttribute('pattern', value);
  }

  get patternRestrict() { return this.getAttribute('pattern-restrict'); }
  set patternRestrict(value) {
    value = value !== null && value !== false;
    if (this.#formatter) this.#formatter.patternRestrict = value;
    this.toggleAttribute('pattern', value);
  }

  get placeholder() { return this.getAttribute('placeholder'); }
  set placeholder(value) {
    if (value) this.setAttribute('placeholder', value);
    else this.removeAttribute('placeholder');
    if (this.rendered) this.#input.setAttribute('placeholder', value || ' ');
  }

  get prefixText() { return this.getAttribute('prefix-text'); }
  set prefixText(value) {
    if (`${value}` === this.getAttribute('prefix-text')) return;
    this.setAttribute('prefix-text', value);
    if (this.rendered) this.shadowRoot.querySelector('.text-field .prefix-text').innerText = value || '';
  }
  get suffixText() { return this.getAttribute('suffix-text'); }
  set suffixText(value) {
    if (`${value}` === this.getAttribute('suffix-text')) return;
    this.setAttribute('suffix-text', value);
    if (this.rendered) this.shadowRoot.querySelector('.text-field .suffix-text').innerText = value || '';
  }

  get readonly() { return this.hasAttribute('readonly'); }
  set readonly(value) {
    value = value !== null && value !== false;
    this.toggleAttribute('readonly', value);
    if (value) this.blur();
    if (this.rendered) this.#input.toggleAttribute('readonly', value);
  }

  get required() { return this.hasAttribute('required'); }
  set required(value) {
    value = value !== null && value !== false;
    this.toggleAttribute('required', value);
    if (this.rendered) this.#input.toggleAttribute('required', value);
  }

  get selectionDirection() { return this.#input?.selectionDirection || 0; }
  set selectionDirection(value = 0) {
    if (this.rendered) this.#input.selectionDirection = value;
  }

  get selectionEnd() { return this.#input?.selectionEnd || 0; }
  set selectionEnd(value = 0) {
    if (this.rendered) this.#input.selectionEnd = value;
  }

  get selectionStart() { return this.#input?.selectionStart || 0; }
  set selectionStart(value = 0) {
    if (this.rendered) this.#input.selectionStart = value;
  }

  get supportingText() { return this.#supportingText; }
  set supportingText(value) {
    this.#supportingText = value || '';
    if (this.rendered && (!this.#errorText || this.checkValidity())) {
      const el = this.shadowRoot.querySelector('.text-field .supporting-text');
      el.innerText = this.#supportingText;
      el.setAttribute('title', this.#supportingText)
    }
  }

  get errorText() { return this.#errorText; }
  set errorText(value) {
    this.#errorText = value || '';
    if (this.rendered && !this.checkValidity()) {
      const el = this.shadowRoot.querySelector('.text-field .supporting-text');
      el.innerText = this.#errorText;
      el.setAttribute('title', this.#errorText)
    }
  }

  get type() { return this.getAttribute('type') || 'text'; }
  set type(value) {
    if (`${value}` === this.getAttribute('type')) return;
    this.setAttribute('type', value);
  }

  get value() {
    if (this.#formatter) return this.#formatter.value;
    return this.#value;
  }
  set value(value) {
    if (this.#formatter) {
      this.#formatter.value = value;
      this.#value = this.#formatter.value;
    } else {
      this.#value = value;
      if (this.rendered) this.#input.value = this.#value;
    }

    this.#internals.setFormValue(this.#value);
    this.classList.toggle('has-value', !!this.#value);
  }

  get suggestion() {
    return this.#suggestion;
  }
  set suggestion(value) {
    this.#suggestion = value;
    if (this.rendered) this.#setSuggestion();
  }

  get validationMessage() { return this.#internals.validationMessage; }
  get validity() { return this.#internals.validity; }
  get willValidate() { return this.#internals.willValidate; }



  clear() {
    this.#dirty = false;
    this.value = '';
  }

  reset() {
    this.#dirty = false;
    this.#touched = false;
    this.value = this.getAttribute('value') ?? '';
    this.#updateValidity();
    this.#updateValidityDisplay(true);
  }
  formResetCallback() { this.reset(); }
  
  checkValidity() { return this.#internals.checkValidity(); }
  reportValidity() {
    this.#updateValidityDisplay();
    // calling this will show browser native popover
    // return this.#internals.reportValidity();
  }
  updateValidity() {
    this.#updateValidity();
  }
  setCustomValidity(value = '') {
    this.#customValidityMessage = value;
    if (this.rendered) {
      this.#input.setCustomValidity(value);
      this.#updateValidityDisplay();
    }
  }
  
  select() { if (this.rendered) this.#input.select(); }
  setRangeText(replacement, start, end, selectMode) {
    if (this.rendered) this.#input.setRangeText(replacement, start, end, selectMode);
  }
  setSelectionRange(selectionStart, selectionEnd, selectionDirection) {
    if (this.rendered) this.#input.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
  }



  #setSupportingText() {
    const valid = this.checkValidity();
    const supportingTextElement = this.shadowRoot.querySelector('.text-field .supporting-text');
    const value = valid ? this.#supportingText : this.#errorText || this.#input.validationMessage;
    supportingTextElement.innerText = value;
    supportingTextElement.setAttribute('title', value)
  }

  #addFormatter() {
    if (!this.#formatter) {
      this.#formatter = new Formatter(this);
      this.#formatter.onInput = this.#onFormatterInput.bind(this);
      this.#formatter.patternRestrict = this.hasAttribute('pattern-restrict');
    }
  }

  #slotChange(event) {
    if (event.target.name === 'leading-icon') {
      const hasLeadingIcon = event.target.assignedElements({ flatten: true }).length > 0;
      this.shadowRoot.querySelector('.text-field').classList.toggle('leading-icon', hasLeadingIcon);
    }

    if (event.target.name === 'trailing-icon') {
      const hasTrailingIcon = event.target.assignedElements({ flatten: true }).length > 0;
      this.shadowRoot.querySelector('.text-field').classList.toggle('trailing-icon', hasTrailingIcon);
    }
  }

  #onInput() {
    this.#value = this.#input.value;
    this.#dirty = true;
    this.#setSuggestion();
    this.#updateValidity();
    // only update display if invalid while in focus
    if (this.classList.contains('invalid')) this.#updateValidityDisplay();
  }

  #onFormatterInput() {
    const changed = this.#value !== this.#formatter.value;
    this.#value = this.#formatter.value;
    this.#dirty = true;
    this.#updateValidity();
    // only update display if invalid while in focus
    if (this.classList.contains('invalid')) this.#updateValidityDisplay();
    if (changed) this.dispatchEvent(new Event('input'));
  }

  #updateValidity() {
    this.#touched = true;
    this.#internals.setFormValue(this.#input.value);
    this.#internals.setValidity(this.#input.validity, this.#input.validationMessage, this.#input);
  }

  #updateValidityDisplay(valid = this.#input.checkValidity()) {
    this.classList.toggle('invalid', !valid);

    if (!valid) {
      if (!this.#invalidIcon) {
        this.#invalidIcon = document.createElement('div');
        this.#invalidIcon.classList.add('invalid-icon');
        this.#invalidIcon.innerHTML = error_FILL1_wght400_GRAD0_opsz24;
      }

      this.shadowRoot.querySelector('.text-field').appendChild(this.#invalidIcon);
    } else if (this.#invalidIcon) {
      this.#invalidIcon.remove();
    }

    this.#setSupportingText();
  }

  #onFocus() {
    if (this.readonly) return;
    this.#focusValue = this.value;
  }

  #onBlur() {
    if (this.readonly) return;
    // do not update if no text was changed
    if (this.#touched) {
      this.#updateValidity();
      this.#updateValidityDisplay();
    }
    this.#dirty = false;
    if (this.value !== this.#focusValue) this.dispatchEvent(new Event('change'));
    this.classList.toggle('has-value', !!this.value);
  }

  #onSelect() {
    this.dispatchEvent(new Event('select'));
  }

  #setSuggestion() {
    if (typeof this.#suggestion !== 'string') return;
    const suggestionElement = this.shadowRoot.querySelector('.text-field .suggestion');

    const match = this.#suggestion.match(new RegExp(`^${this.#input.value}(.*)`, 'i'));
    const value = !match || match[0] === match[1] ? '' : match[1];

    suggestionElement.innerText = value;
    const offset = util.getTextWidthFromInput(this.#input);
    suggestionElement.style.left = `${offset + 16}px`;
  }
}

customElements.define('mdw-textfield', MDWTextfieldElement);
