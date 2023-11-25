import HTMLElementExtended from '../HTMLElementExtended.js';
import Ripple from '../../core/Ripple.js';
import util from '../../core/util.js';
import dialog from '../dialog/service.js';
import styles from './component.css' assert { type: 'css' };

export default class MDWButtonElement extends HTMLElementExtended {
  static useShadowRoot = true;
  static styleSheets = styles;

  #form = null;
  #name = '';
  #type = 'submit';
  #value = '';
  #toggled = false;
  useRipple = !this.classList.contains('mdw-no-ripple');
  #isToggle = this.classList.contains('mdw-icon-toggle-button');
  #isAsync = this.classList.contains('mdw-async');
  #ripple;
  #asyncMouseup_bound = this.#asyncMouseup.bind(this);
  #handleToggle_bound = this.#handleToggle.bind(this);
  #formSubmit_bound = this.#formSubmit.bind(this);
  #formFocusIn_bound = this.#formFocusIn.bind(this);
  #formSubmitted_bound = this.#formSubmitted.bind(this);
  #formCloseClickInterceptor_bound = this.#formCloseClickInterceptor.bind(this);
  #formReset_bound = this.#formReset.bind(this);
  #focus_bound = this.#focus.bind(this);
  #blur_bound = this.#blur.bind(this);
  #focusKeydown_bound = this.#focusKeydown.bind(this);
  #focusMousedown_bound = this.#focusMousedown.bind(this);
  #formState;
  #onclickAttribute;
  #abort;
  

  constructor() {
    super();
  }

  connectedCallback() {
    this.#abort = new AbortController();
    this.#handleTrailingIcon();
    if (this.parentElement.nodeName === 'MDW-MENU') this.classList.add('mdw-menu');
    this.tabIndex = 0;
    if (this.parentElement.nodeName === 'MDW-MENU') this.setAttribute('role', 'menuitem');
    else this.setAttribute('role', 'button');

    // this needs to be added asap so it blocks all outside events
    if (this.#form && this.#type === 'cancel') {
      this.addEventListener('click', this.#formCloseClickInterceptor_bound, { signal: this.#abort.signal });
    }

    this.addEventListener('focus', this.#focus_bound, { signal: this.#abort.signal });
    this.addEventListener('mousedown', this.#focusMousedown_bound, { signal: this.#abort.signal });
  }

  afterRender() {
    if (!this.hasAttribute('aria-label')) {
      if (this.classList.contains('mdw-icon-button') || this.classList.contains('mdw-icon-toggle-button')) {
        const text = this.querySelector('mdw-icon')?.innerText;
        if (text) this.setAttribute('aria-label', text);
      } else {
        const text = util.getTextFromNode(this);
        if (text) this.setAttribute('aria-label', text);
      }
    }
    if (this.#isAsync) this.addEventListener('mouseup', this.#asyncMouseup_bound, { signal: this.#abort.signal });
    if (this.classList.contains('mdw-icon-toggle-button')) {
      this.addEventListener('click', this.#handleToggle_bound, { signal: this.#abort.signal });
    }
    if (this.#form && this.#type === 'submit') {
      this.addEventListener('click', this.#formSubmit_bound, { signal: this.#abort.signal });
    }
    if (this.#form && this.#type === 'reset') {
      this.addEventListener('click', this.#formReset_bound, { signal: this.#abort.signal });
    }
    if (this.#form && this.#type === 'cancel') {
      this.#form.addEventListener('focusin', this.#formFocusIn_bound, { signal: this.#abort.signal });
      this.#form.addEventListener('submit', this.#formSubmitted_bound, { signal: this.#abort.signal });
    }
    if (this.useRipple) {
      this.#ripple = new Ripple({
        element: this.shadowRoot.querySelector('.ripple'),
        triggerElement: this,
        ignoreElements: [this.querySelector('mdw-menu')]
      });
    }

    this.classList.add('mdw-animation');
  }

  disconnectedCallback() {
    if (this.#ripple)  this.#ripple.destroy();
    this.#abort.abort();
  }

  template() {
    return /*html*/`
      <span class="text">
        <slot></slot>
      </span>
      <span class="spinner"></span>
      <div class="ripple"></div>
    `;
  }

  static get observedAttributes() {
    return ['form', 'type', 'toggled'];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === 'toggled') this.toggled = newValue !== null;
    else this[name] = newValue;
  }

  get form() {
    return this.#form
  }
  set form(value) {
    this.#form = document.querySelector(`form#${value}`) || document.querySelector(`mdw-form#${value}`);
  }

  get name() {
    return this.#name;
  }
  set name(value) {
    this.#name = value;
  }

  get type() {
    return this.#type;
  }
  set type(value) {
    this.#type = value;
  }

  get value() {
    return this.#value;
  }
  set value(value) {
    this.#value = value;
  }
  
  get disabled() {
    return this.hasAttribute('disabled');
  }
  set disabled(value) {
    this.toggleAttribute('disabled', !!value);
  }

  get toggled() {
    if (!this.#isToggle) throw Error('Cannot toggle. To enable add class "mdw-icon-toggle-button"');
    return this.#toggled;
  }
  set toggled(value) {
    if (!this.#isToggle) throw Error('Cannot toggle. To enable add class "mdw-icon-toggle-button"');
    this.#toggled = !!value;
    this.classList.toggle('mdw-toggled', this.#toggled);
  }

  pending() {
    this.classList.add('mdw-async-pending');
    this.shadowRoot.querySelector('.spinner').innerHTML = `
      <mdw-progress-circular diameter="28" class="mdw-indeterminate${this.classList.contains('mdw-filled') ? ' mdw-on-filled' : ''}${this.classList.contains('mdw-filled-tonal') ? ' mdw-on-filled-tonal' : ''}"></mdw-progress-circular>
    `;
  }

  resolve() {
    this.classList.remove('mdw-async-pending');
    this.shadowRoot.querySelector('.spinner').innerHTML = '';
  }

  // prevent focus on click
  #focusMousedown(event) {
    event.preventDefault();
  }

  #asyncMouseup() {
    this.pending();
  }

  // auto add class .mdw-trailing to icon so it will space correctly
  #handleTrailingIcon() {
    const icon = this.querySelector('mdw-icon');
    if (!icon) return;

    let previous = icon.previousSibling;
    while (previous) {
      if (previous.nodeType === 3 && previous.textContent.trim() !== '') break;
      previous = previous.previousSibling;
    }
    
    if (previous) icon.classList.add('mdw-trailing');
  }

  #handleToggle() {
    this.toggled = !this.toggled;
  }

  #formSubmit(event) {
    if (!this.#form.hasAttribute('novalidate')) {
      const invalids = this.#getFormValidityElements().filter(element => !element.reportValidity());
      if (invalids.length > 0) return event.preventDefault();
    }
    this.#form.submit();
    this.#form.dispatchEvent(new SubmitEvent('submit', { submitter: event.target }));
  }

  #formFocusIn() {
    if (this.#formState === undefined) this.#formState = this.#getFormState();

    // temporarily remove onclick to prevent firing while form has changes
    setTimeout(() => {
      const current = this.#getFormState();
      if (current !== this.#formState) {
        if (this.hasAttribute('onclick')) {
          this.#onclickAttribute = this.getAttribute('onclick');
          this.removeAttribute('onclick');
        }
      } else if (this.#onclickAttribute) {
        this.setAttribute('onclick', this.#onclickAttribute);
        this.#onclickAttribute = undefined;
      }
    }, 100);
  }

  // prevent cancel from firing
  async #formCloseClickInterceptor(event) {
    if (this.#formState !== undefined && this.#getFormState() !== this.#formState) {
      event.stopImmediatePropagation();
      
      const action = await dialog.simple({
        message: 'Discard changes?',
        actionConfirm: true,
        actionConfirmLabel: 'Cancel',
        actionCancel: true,
        actionCancelLabel: 'Discard'
      });

      // actions reversed for button position
      if (action === 'cancel') {
        // reset state and retrigger click
        this.#formState = undefined;
        if (this.#onclickAttribute) {
          this.setAttribute('onclick', this.#onclickAttribute);
          this.#onclickAttribute = undefined;
        }
        this.click();
      }
    }
  }

  #formSubmitted() {
    this.#formState = undefined;
    this.disabled = false;
  }

  #formReset() {
    this.#form.reset();
  }

  #getFormState() {
    return this.#getFormElements().map(e => (
      ['MDW-CHECKBOX', 'MDW-SWITCH'].includes(e.nodeName) ? e.checked : e.value
    )).toString();
  }

  #getFormValidityElements() {
    return [
      ...this.#form.querySelectorAll('input'),
      ...this.#form.querySelectorAll('mdw-checkbox'),
      ...this.#form.querySelectorAll('mdw-select'),
      // ...this.#form.querySelectorAll('mdw-switch'),
      // ...this.#form.querySelectorAll('mdw-slider'),
      // ...this.#form.querySelectorAll('mdw-slider-range'),
      // ...this.#form.querySelectorAll('mdw-radio-group')
    ];
  }

  #getFormElements() {
    return [
      ...this.#form.querySelectorAll('input'),
      ...this.#form.querySelectorAll('mdw-checkbox'),
      ...this.#form.querySelectorAll('mdw-switch'),
      ...this.#form.querySelectorAll('mdw-slider'),
      ...this.#form.querySelectorAll('mdw-slider-range'),
      ...this.#form.querySelectorAll('mdw-select'),
      ...this.#form.querySelectorAll('mdw-radio-group')
    ];
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
}


customElements.define('mdw-button', MDWButtonElement);
