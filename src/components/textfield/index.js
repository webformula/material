import HTMLElementExtended from '../HTMLElementExtended.js';
import util from '../../core/util.js';
import { error_FILL1_wght400_GRAD0_opsz24 } from '../../core/svgs.js';
import Formatter from './Formatter.js';

const handleReportValidityScrollIntoView = util.debounce(input => {
  // check if already on screen
  const bounds = input.getBoundingClientRect();
  if (bounds.y >= 0 && (bounds.y + bounds.height) <= window.innerHeight) return;
  input.scrollIntoView({ behavior: 'smooth', block: 'center' });
}, 100);


export default class MDWTextfieldElement extends HTMLElementExtended {
  #input;
  #setNotchWidth_bound = this.#setNotchWidth.bind(this);
  #unsetNotchWidth_bound = this.#unsetNotchWidth.bind(this);
  #onInvalid_bound = this.#onInvalid.bind(this);
  #onInput_bound = this.#onInput.bind(this);
  #clear_bound = this.clear.bind(this);
  #originalSupportingText;
  #autocomplete;
  #formatter;
  #abort;


  constructor() {
    super();

    this.classList.add('mdw-no-animation');
    this.#input = this.querySelector('input');
    this.#formatter = new Formatter(this);
    const inputPattern = this.#input.pattern;
    if (inputPattern) this.pattern = inputPattern;
  }

  connectedCallback() {
    this.#input.setAttribute('placeholder', this.#input.getAttribute('placeholder') || ' ');
    if (this.pattern) this.#formatter.enable();

    this.#abort = new AbortController();
    this.#input.addEventListener('invalid', this.#onInvalid_bound, { signal: this.#abort.signal });
    this.#input.addEventListener('input', this.#onInput_bound, { signal: this.#abort.signal });
    
    const inputClearIcon = this.querySelector('mdw-icon.mdw-input-clear');
    if (inputClearIcon) inputClearIcon.addEventListener('click', this.#clear_bound, { signal: this.#abort.signal });

    const label = this.querySelector('label');
    if (label && !label.hasAttribute('for')) {
      const id = this.#input.id;
      if (!id) this.#input.id = `mdw-textfield-${util.uid()}`;
      label.setAttribute('for', this.#input.id);
    }

    this.#handleDisabledInput();
    this.#overrideInputSetCustomValidity();
    if (this.querySelector('.mdw-outlined-border-container + mdw-icon')) this.classList.add('mdw-has-leading-icon');

    const isOutlined = this.classList.contains('mdw-outlined');
    if (isOutlined) {
      this.insertAdjacentHTML('afterbegin', `
        <div class="mdw-outlined-border-container">
          <div class="mdw-outlined-leading"></div>
          <div class="mdw-outlined-notch"></div>
          <div class="mdw-outlined-trailing"></div>
        </div>
      `);

      this.#input.addEventListener('focus', this.#setNotchWidth_bound, { signal: this.#abort.signal });
      this.#input.addEventListener('blur', this.#unsetNotchWidth_bound, { signal: this.#abort.signal });
    }

    requestAnimationFrame(() => {
      if (isOutlined && (this.#input.value || this.#input.type === 'date' || this.#input.type === 'month' || this.#input.type === 'time' || this.#input.placeholder !== ' ')) this.#setNotchWidth();

      this.#originalSupportingText = this.querySelector('.mdw-supporting-text')?.innerText;

      if (!this.#input.hasAttribute('aria-label')) {
        const text = this.querySelector('label')?.innerText;
        if (text) this.#input.setAttribute('aria-label', text);
      }
    });

    setTimeout(() => {
      this.classList.remove('mdw-no-animation');
    }, 100);
  }

  disconnectedCallback() {
    this.#abort.abort();
    this.#formatter.disable();
  }

  static get observedAttributes() {
    return ['disabled', 'pattern',  'mask', 'format'];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === 'disabled') this.disabled = newValue !== null;
    if (name === 'pattern') this.pattern = newValue;
    if (name === 'mask') this.mask = newValue;
    if (name === 'format') this.format = newValue;
  }

  get autocomplete() {
    return this.#autocomplete;
  }
  set autocomplete(value) {
    this.#autocomplete = value;
    this.#setAutocomplete();
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }
  set disabled(value) {
    this.toggleAttribute('disabled', !!value);
    this.#input.blur();
    this.#input.toggleAttribute('disabled', !!value);
  }

  get pattern() {
    return this.#formatter.pattern;
  }
  set pattern(value) {
    this.#formatter.pattern = value;
  }

  get mask() {
    return this.#formatter.mask;
  }
  set mask(value) {
    this.#formatter.mask = value;
  }

  get format() {
    return this.#formatter.format;
  }
  set format(value) {
    this.#formatter.format = value;
  }

  get value() {
    return this.#input.value;
  }

  get formattedValue() {
    return this.#formatter.formattedValue;
  }

  get maskedValue() {
    return this.#formatter.maskedValue;
  }

  setCustomValidity(value = '') {
    this.#input.setCustomValidity(value);
  }

  reportValidity() {
    return this.#input.reportValidity();
  }

  clear(event) {
    this.#input.value = '';

    // prevent label from moving and focus
    if (event && event.target.classList.contains('mdw-input-clear')) {
      this.classList.add('mdw-raise-label');
      this.#input.focus();
      setTimeout(() => {
        this.classList.remove('mdw-raise-label');
      });
    }
  }

  #handleDisabledInput() {
    if (this.#input.hasAttribute('disabled')) this.setAttribute('disabled', '');
    else this.removeAttribute('disabled');

    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'disabled');
    const originalSet = descriptor.set;
    const that = this;
    descriptor.set = function (value) {
      that.toggleAttribute('disabled', !!value);
      originalSet.apply(this, arguments);
    };
    Object.defineProperty(this.#input, 'disabled', descriptor);
  }

  // change supporting text for invalid input when user called setCustomValidity()
  #overrideInputSetCustomValidity() {
    const originalSetCustomValidity = this.#input.setCustomValidity;
    this.#input.setCustomValidity = str => {
      originalSetCustomValidity.call(this.#input, str);
      this.#onInput();
    };


    const originalReportValidity = this.#input.reportValidity;
    this.#input.reportValidity = () => {
      handleReportValidityScrollIntoView(this.#input);
      const valid = originalReportValidity.call(this.#input);
      this.#updateInputValidity(!valid);
      return valid;
    };
  }
  
  #onInput() {
    this.#updateInputValidity(!this.#input.checkValidity());
    this.#setAutocomplete();
  }

  #updateInputValidity(invalid = false) {
    const supportingTextElement = this.querySelector('.mdw-supporting-text:not(.mdw-disable-default)');
    const invalidIcon = this.querySelector('.mdw-invalid-icon');
    
    if (invalid) {
      this.classList.add('mdw-invalid');
      if (supportingTextElement) supportingTextElement.innerText = this.#input.validationMessage;
      if (!invalidIcon) this.insertAdjacentHTML('beforeend', `<div class="mdw-invalid-icon">${error_FILL1_wght400_GRAD0_opsz24}</div>`);
    } else {
      this.classList.remove('mdw-invalid');
      if (supportingTextElement) supportingTextElement.innerText = this.#originalSupportingText;
      if (invalidIcon) invalidIcon.remove();
    }
  }

  #onInvalid(event) {
    event.preventDefault();
  }

  updateNotch() {
    if (this.#input.value) this.#setNotchWidth();
    else this.#unsetNotchWidth();
  }

  #setNotchWidth() {
    const label = this.querySelector('label');
    if (!label) return;

    const notch = this.querySelector('.mdw-outlined-notch');
    const computedStyle = getComputedStyle(notch);
    // already open
    if (computedStyle.width !== '0px') return;

    this.querySelector('.mdw-outlined-notch').style.width = `${label.offsetWidth * 0.9}px`;
    // font size changes and we need to recalculate width because of animation
    setTimeout(() => {
      this.querySelector('.mdw-outlined-notch').style.width = `${label.offsetWidth + 4}px`;
    }, 165)
  }

  #unsetNotchWidth() {
    if ((this.#input.value) || this.#input.type === 'date' || this.#input.type === 'time' || this.#input.type === 'month' || this.#input.placeholder !== ' ') return;
    const label = this.querySelector('label');
    if (!label) return;
    this.querySelector('.mdw-outlined-notch').style.width = '0';
  }

  #setAutocomplete() {
    if (typeof this.#autocomplete !== 'string') return;
    if (!this.querySelector('.mdw-autocomplete')) this.insertAdjacentHTML('beforeend', `<div class="mdw-autocomplete"></div>`);
    const autoCompleteElement = this.querySelector('.mdw-autocomplete');

    const match = this.#autocomplete.match(new RegExp(`^${this.#input.value}(.*)`, 'i'));
    const value = !match || match[0] === match[1] ? '' : match[1];

    autoCompleteElement.innerText = value;
    const offset = util.getTextWidthFromInput(this.#input);
    autoCompleteElement.style.left = `${offset + 16}px`;
  }
}


customElements.define('mdw-textfield', MDWTextfieldElement);
