import HTMLElementExtended from '../HTMLElementExtended.js';
import './tab.css';

// TODO accessability

customElements.define('mdw-tab', class MDWTabElement extends HTMLElementExtended {
  #active = false;
  #value = '';


  constructor() {
    super();
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
});
