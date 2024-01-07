import HTMLComponentElement from '../HTMLComponentElement.js';
import Ripple from '../../core/Ripple.js';
import styles from './component.css' assert { type: 'css' };

const targetValues = ['_blank', '_parent', '_self', '_top'];

// TODO anchor

export default class MDWButtonElement extends HTMLComponentElement {
  static useShadowRoot = true;
  static useTemplate = true;
  static shadowRootDelegateFocus = true;
  static styleSheets = styles;

  #abort;
  #ripple;
  #ariaLabel;
  #target;
  #href;
  #type;
  #button;
  #value;
  #form;
  #formState;
  #async = false;
  #focus_bound = this.#focus.bind(this);
  #blur_bound = this.#blur.bind(this);
  #focusMousedown_bound = this.#focusMousedown.bind(this);
  #asyncMouseup_bound = this.pending.bind(this);
  #formClick_bound = this.#formClick.bind(this);
  #formFocusIn_bound = this.#formFocusIn.bind(this);
  #focusKeydown_bound = this.#focusKeydown.bind(this);


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
      ['type', 'string'],
      ['value', 'string'],
      ['form', 'string'],
      ['async', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  template() {
    return /*html*/`
      <button>
        <slot name="leading-icon"></slot>
        <slot class="default-slot"></slot>
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

    if (this.#async) this.addEventListener('mouseup', this.#asyncMouseup_bound, { signal: this.#abort.signal });
    this.addEventListener('focus', this.#focus_bound, { signal: this.#abort.signal });
    this.addEventListener('mousedown', this.#focusMousedown_bound, { signal: this.#abort.signal });
    if (this.#form) {
      this.addEventListener('click', this.#formClick_bound, { signal: this.#abort.signal });
      this.#form.addEventListener('focusin', this.#formFocusIn_bound, { signal: this.#abort.signal });
    }
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
      // this.#link.removeAttribute('href');
    } else {
      this.setAttribute('href', value);
      // this.#link.setAttribute('href', value);
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

  get type() { return this.#type; }
  set type(value) {
    this.#type = value;
    this.#button.setAttribute('type', value);
    if (['reset', 'cancel', 'submit'].includes(value) && !this.#form && this.parentElement.nodeName === 'FORM') {
      this.#form = this.parentElement;
    }
  }

  get value() { return this.#value; }
  set value(value) {
    this.#value = value;
    this.#button.setAttribute('value', value);
  }

  get form() { return this.#form }
  set form(value) {
    this.#form = document.querySelector(`form#${value}`);
  }

  get async() { return this.#async }
  set async(value) {
    this.#async = !!value;
  }

  get formNoValidate() { return this.hasAttribute('formnovalidate'); }
  set formNoValidate(value) {
    if (!!value) this.setAttribute('formnovalidate', '');
    else this.removeAttribute('formnovalidate');
  }


  pending() {
    this.classList.add('async-pending');
    this.shadowRoot.querySelector('.spinner').innerHTML = `
      <mdw-progress-circular diameter="28" class="mdw-indeterminate${this.classList.contains('filled') ? ' mdw-on-filled' : ''}${this.classList.contains('filled-tonal') ? ' mdw-on-filled-tonal' : ''}"></mdw-progress-circular>
    `;
  }

  resolve() {
    this.classList.remove('async-pending');
    this.shadowRoot.querySelector('.spinner').innerHTML = '';
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
    if (e.key === 'Enter') this.click();
  }

  #formClick(event) {
    switch (this.#type) {
      case 'reset':
        this.#form.reset();
        break;

      case 'submit':
        if (!this.formNoValidate && !this.#form.hasAttribute('novalidate') && !this.#form.checkValidity()) {
          const formElements = [...this.#form.elements];
          formElements.forEach(element => element.reportValidity());
          const firstInvalid = formElements.find(e => !e.checkValidity());
          const bounds = firstInvalid.getBoundingClientRect();
          if (!(bounds.y >= 0 && (bounds.y + bounds.height) <= window.innerHeight)) {
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          firstInvalid.focus({ preventScroll: true });
        } else {
          this.#formRequestSubmit();
        }
        break;

      case 'cancel':
        // TODO cancel
        if (this.#formState !== undefined && this.#getFormState() !== this.#formState) {
          // const action = await dialog.simple({
          //   message: 'Discard changes?',
          //   actionConfirm: true,
          //   actionConfirmLabel: 'Cancel',
          //   actionCancel: true,
          //   actionCancelLabel: 'Discard'
          // });
          const action = 'cancel';

          // actions reversed for button position
          if (action === 'cancel') {
            // reset state and retrigger click
            this.#formState = undefined;
            // if (this.#onclickAttribute) {
            //   this.setAttribute('onclick', this.#onclickAttribute);
            //   this.#onclickAttribute = undefined;
            // }
            this.click();
          }
        }
        break;

      default:
        if (this.#form.method === 'dialog') {
          this.#formRequestSubmit();
        }
    }
  }

  #formRequestSubmit() {
    const previousNoValidate = this.#form.noValidate;
    if (this.formNoValidate) this.#form.noValidate = true;
    // intercept submit so we can inject submitter
    this.#form.addEventListener('submit', (submitEvent) => {
      Object.defineProperty(submitEvent, 'submitter', {
        configurable: true,
        enumerable: true,
        get: () => this,
      });
    }, { capture: true, once: true });
    this.#form.requestSubmit();
    if (this.formNoValidate) this.#form.noValidate = previousNoValidate;
  }

  // used to track changes based on values
  #getFormState() {
    return [...this.#form.elements].map(e => e.type === 'checkbox' ? e.checked : e.value).toString();
  }

  #formFocusIn() {
    if (this.#formState === undefined) this.#formState = this.#getFormState();

    // temporarily remove onclick to prevent firing while form has changes
    // setTimeout(() => {
    //   const current = this.#getFormState();
    //   if (current !== this.#formState) {
    //     if (this.hasAttribute('onclick')) {
    //       this.#onclickAttribute = this.getAttribute('onclick');
    //       this.removeAttribute('onclick');
    //     }
    //   } else if (this.#onclickAttribute) {
    //     this.setAttribute('onclick', this.#onclickAttribute);
    //     this.#onclickAttribute = undefined;
    //   }
    // }, 100);
  }
};

customElements.define('mdw-button', MDWButtonElement);
