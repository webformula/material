import HTMLElementExtended from '../HTMLElementExtended.js';


class MDWTabPanelElement extends HTMLElementExtended {
  static tag = 'mdw-tab-panel';
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
    this.toggleAttribute('active', this.#active);
  }

  get value() {
    return this.#value;
  }
  set value(value) {
    this.#value = value;
  }

  connectedCallback() {
    setTimeout(() => {
      this.classList.add('mdw-animation');
    }, 50);
  }
}
customElements.define(MDWTabPanelElement.tag, MDWTabPanelElement);
