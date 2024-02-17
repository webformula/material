import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import util from '../../core/util.js';


class WFCTopAppBarElement extends HTMLComponentElement {
  static tag = 'wfc-top-app-bar';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = styles;


  #position = 0;
  #fixed = false;
  #compress = false;
  #medium = false;
  #large = false;
  #height = 64;
  #scrollTrack_bound = this.#scrollTrack.bind(this);

  constructor() {
    super();

    this.render();
    document.body.classList.add('has-top-app-bar');
  }

  template() {
    return /*html*/`
    <slot name="leading-icon"></slot>
    <slot class="default-slot"></slot>
    <slot name="trailing-icon"></slot>
    `;
  }

  connectedCallback() {
    util.trackPageScroll(this.#scrollTrack_bound);
  }

  disconnectedCallback() {
    util.untrackPageScroll(this.#scrollTrack_bound);
  }

  static get observedAttributesExtended() {
    return [
      ['fixed', 'boolean'],
      ['compress', 'boolean'],
      ['medium', 'boolean'],
      ['large', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get fixed() { return this.#fixed; }
  set fixed(value) {
    this.#fixed = !!value;
    this.toggleAttribute('fixed', this.#fixed);
  }

  get compress() { return this.#compress; }
  set compress(value) {
    this.#compress = !!value;
    this.toggleAttribute('compress', this.#compress);
  }

  get medium() { return this.#medium; }
  set medium(value) {
    this.#medium = !!value;
    this.toggleAttribute('medium', this.#medium);
    document.body.classList.toggle('top-app-bar-medium', this.#medium);
    this.#height = this.#medium ? 112 : 64;
  }

  get large() { return this.#large; }
  set large(value) {
    this.#large = !!value;
    this.toggleAttribute('large', this.#large);
    document.body.classList.toggle('top-app-bar-large', this.#large);
    this.#height = this.#large ? 152 : 64;
  }

  #scrollTrack({ isScrolled, distance, scrollTop }) {
    if (this.#fixed) {
      this.classList.toggle('scrolled', isScrolled);
    } else if (this.#compress) {
      this.#position += distance;
      if (this.#position > this.#height - 64) this.#position = this.#height - 64;
      if (this.#position < 0) this.#position = 0;
      this.classList.toggle('scrolled', scrollTop > 64);
      this.style.setProperty('--wfc-top-app-bar-scroll-position', `-${this.#position}px`);
    } else {
      this.#position += distance;
      if (this.#position > this.#height) this.#position = this.#height;
      if (this.#position < 0) this.#position = 0;
      this.classList.toggle('scrolled', scrollTop > this.#height && this.#position < this.#height);
      this.style.top = `-${this.#position}px`;
    }
  }
}

customElements.define(WFCTopAppBarElement.tag, WFCTopAppBarElement);
