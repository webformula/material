import HTMLElementExtended from '../HTMLElementExtended.js';
import './tab.css';
import util from '../../core/util.js';

customElements.define('mdw-tab', class MDWTabElement extends HTMLElementExtended {
  #active = false;
  #value = '';
  #focus_bound = this.#focus.bind(this);
  #blur_bound = this.#blur.bind(this);
  #focusKeydown_bound = this.#focusKeydown.bind(this);


  constructor() {
    super();
  }

  connectedCallback() {
    this.tabIndex = 0;
    this.addEventListener('focus', this.#focus_bound);

    if (!this.hasAttribute('aria-label')) {
      const text = util.getTextFromNode(this);
      this.setAttribute('aria-label', text || 'tab');
    }
  }

  disconnectedCallback() {
    this.removeEventListener('focus', this.#focus_bound);
    this.removeEventListener('blur', this.#blur_bound);
    this.removeEventListener('keydown', this.#focusKeydown_bound);
  }

  static get observedAttributes() {
    return ['active', 'value'];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === 'active') this.active = newValue !== null;
    else this[name] = newValue;
  }

  get active() {
    return this.#active;
  }
  set active(value) {
    this.#active = !!value;
    // this.classList.toggle('mdw-active', this.#active);
    this.toggleAttribute('active', this.#active);
    if (this.#active === true) this.parentElement.update();
  }

  get value() {
    return this.#value;
  }
  set value(value) {
    this.#value = value;
  }

  #focus() {
    this.addEventListener('blur', this.#blur_bound);
    this.addEventListener('keydown', this.#focusKeydown_bound);
  }

  #blur() {
    this.removeEventListener('blur', this.#blur_bound);
    this.removeEventListener('keydown', this.#focusKeydown_bound);
  }

  #focusKeydown(e) {
    if (e.code === 'Space' || e.code === 'Enter') {
      this.click();
      e.preventDefault();
    }
  }
});
