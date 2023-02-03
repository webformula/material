import HTMLElementExtended from '../HTMLElementExtended.js';
import styleAsString from '!!raw-loader!./component.css';
import Ripple from '../../core/Ripple.js';
import util from '../../core/util.js';


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


  constructor() {
    super();
    this.#handleTrailingIcon();

    if (this.parentElement.nodeName === 'MDW-MENU') this.classList.add('mdw-menu')
  }

  connectedCallback() {
    this.tabIndex = 0;
    this.setAttribute('role', 'button');
    if (!this.hasAttribute('aria-label')) {
      const text = util.getTextFromNode(this);
      if (text) this.setAttribute('aria-label', text);
    }
    this.addEventListener('mouseup', this.#mouseUp_bound);

    if (this.classList.contains('mdw-icon-toggle-button')) {
      this.addEventListener('click', this.#handleToggle_bound);
    }
  }

  afterRender() {
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
    this.removeEventListener('mouseup', this.#mouseUp_bound);

    if (this.classList.contains('mdw-icon-toggle-button')) {
      this.removeEventListener('click', this.#handleToggle_bound);
    }
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

  // auto add class .mdw-trailing to icon so t will space correctly
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
}


customElements.define('mdw-button', MDWButtonElement);
