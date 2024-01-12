import HTMLComponentElement from '../HTMLComponentElement.js';

export default class MDWCarouselItemElement extends HTMLComponentElement {
  #width = null;


  constructor() {
    super();
  }

  connectedCallback() {
    if (!this.width) {
      const img = this.querySelector('img');
      if (img) {
        const width = img.getAttribute('width');
        if (width) this.width = width;
        else if (img.complete) this.width = img.offsetWidth;
        else {
          img.onload = () => {
            this.width = img.offsetWidth;
          };
        }
      } else this.width = this.offsetWidth;
    }
  }

  static get observedAttributes() {
    return ['width'];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get width() {
    return this.#width;
  }

  set width(value) {
    value = parseInt(value);
    const changed = value !== this.#width;
    this.#width = value;
    if (changed) this.dispatchEvent(new Event('mdw-carousel-item-change', { bubbles: true }));
  }
}

customElements.define('mdw-carousel-item', MDWCarouselItemElement);
