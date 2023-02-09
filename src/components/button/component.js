import HTMLElementExtended from '../HTMLElementExtended.js';
import styleAsString from '!!raw-loader!./component.css';
import Ripple from '../../core/Ripple.js';
import util from '../../core/util.js';
import dialog from '../dialog/service.js';


export default class MDWButtonElement extends HTMLElementExtended {
  useShadowRoot = true;

  #form = null;
  #name = '';
  #type = 'submit';
  #value = '';
  #toggled = false;
  useRipple = !this.classList.contains('mdw-no-ripple');
  #isToggle = this.classList.contains('mdw-icon-toggle-button');
  #isAsync = this.classList.contains('mdw-async');
  #ripple;
  #mouseUp_bound = this.#mouseup.bind(this);
  #handleToggle_bound = this.#handleToggle.bind(this);
  #formSubmit_bound = this.#formSubmit.bind(this);
  #onFromData_bound = this.#onFromData.bind(this);
  #formFocusIn_bound = this.#formFocusIn.bind(this);
  #formSubmitted_bound = this.#formSubmitted.bind(this);
  #formCloseClickInterceptor_bound = this.#formCloseClickInterceptor.bind(this);
  #formState;
  #onclickAttribute;
  #abort = new AbortController();


  constructor() {
    super();
    this.#handleTrailingIcon();
    if (this.parentElement.nodeName === 'MDW-MENU') this.classList.add('mdw-menu');
  }

  connectedCallback() {
    this.tabIndex = 0;
    this.setAttribute('role', 'button');
    if (!this.hasAttribute('aria-label')) {
      const text = util.getTextFromNode(this);
      if (text) this.setAttribute('aria-label', text);
    }

    // this needs to be added asap so it blocks all outside events
    if (this.#form && this.#type === 'cancel') {
      this.addEventListener('click', this.#formCloseClickInterceptor_bound, { signal: this.#abort.signal });
    }
  }

  afterRender() {
    this.addEventListener('mouseup', this.#mouseUp_bound, { signal: this.#abort.signal });
    if (this.classList.contains('mdw-icon-toggle-button')) {
      this.addEventListener('click', this.#handleToggle_bound, { signal: this.#abort.signal });
    }
    if (this.#form && this.#type === 'submit') {
      this.addEventListener('click', this.#formSubmit_bound, { signal: this.#abort.signal });
      this.#form.addEventListener('formdata', this.#onFromData_bound, { signal: this.#abort.signal });
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
      <style>${styleAsString}</style>
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

  #mouseup() {
    if (this.#isAsync) this.pending();
    this.blur();
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

  // TODO workout validation
  #onFromData({ formData }) {
    // all non native form elements with name attribute
    //   if no name attribute then formData will not pickup
    [
      // ...this.#form.querySelectorAll('mdw-checkbox[name]'),
      // ...this.#form.querySelectorAll('mdw-switch[name]'),
      // ...this.#form.querySelectorAll('mdw-slider[name]'),
      // ...this.#form.querySelectorAll('mdw-slider-range[name]'),
      ...this.#form.querySelectorAll('mdw-select[name]'),
      // ...this.#form.querySelectorAll('mdw-radio-group[name]')
    ].forEach(element => {
      const name = element.getAttribute('name');
      const value = element.value;
      if (element.nodeName === 'MDW-CHECKBOX' || element.nodeName === 'MDW-SWITCH') {
        if (formData.has(name)) {
          if (element.checked === true) formData.set(name, value);
          else formData.delete(name);
        } else if (element.checked === true) formData.append(name, value);
      } else {
        if (formData.has(name)) formData.set(name, value);
        else formData.append(name, value);
      }
    });
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

        // TODO do we want to reset form? Could use formState
      }
    }
  }

  #formSubmitted() {
    this.#formState = undefined;
    this.disabled = false;
  }

  #getFormState() {
    return this.#getFormElements().map(e => (
      ['MDW-CHECKBOX', 'MDW-SWITCH'].includes(e.nodeName) ? e.checked : e.value
    )).toString();
  }

  #getFormValidityElements() {
    return [
      ...this.#form.querySelectorAll('input'),
      // ...this.#form.querySelectorAll('mdw-checkbox'),
      // ...this.#form.querySelectorAll('mdw-switch'),
      // ...this.#form.querySelectorAll('mdw-slider'),
      // ...this.#form.querySelectorAll('mdw-slider-range'),
      ...this.#form.querySelectorAll('mdw-select'),
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
}


customElements.define('mdw-button', MDWButtonElement);
