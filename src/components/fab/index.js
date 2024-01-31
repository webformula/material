import HTMLComponentElement from '../HTMLComponentElement.js';
import Ripple from '../../core/Ripple.js';
import util from '../../core/util.js';
import styles from './component.css' assert { type: 'css' };

class MDWFabElement extends HTMLComponentElement {
  static tag = 'mdw-fab';
  static useShadowRoot = true;
  static styleSheets = styles;
  static useTemplate = true;
  static shadowRootDelegateFocus = true;

  #ripple;
  #autoHide;
  #autoHideLabel;
  #maxWidth;
  #scrollDirectionChange_bound = this.#scrollDirectionChange.bind(this);


  constructor() {
    super();

    this.role = 'button';
    this.render();
  }

  static get observedAttributesExtended() {
    return [
      ['auto-hide', 'boolean'],
      ['auto-hide-label', 'boolean']
    ];
  }

  get autoHide() { return this.#autoHide; }
  set autoHide(value) {
    this.#autoHide = !!value;
    this.classList.toggle('auto-hide', this.#autoHide);

    this.style.maxWidth = '';
    this.classList.remove('hide-label');
    if (!this.#autoHide) util.untrackScrollDirectionChange(this.#scrollDirectionChange_bound);
    if (this.#autoHide || this.#autoHideLabel) this.#enableAutoHide();
  }

  get autoHideLabel() { return this.#autoHideLabel; }
  set autoHideLabel(value) {
    this.#autoHideLabel = !!value;
    this.classList.toggle('auto-hide-label', this.#autoHideLabel);

    if (!this.#autoHideLabel) {
      util.untrackScrollDirectionChange(this.#scrollDirectionChange_bound);
      this.style.maxWidth = '';
      this.classList.remove('hide-label');
    }
    if (this.#autoHide || this.#autoHideLabel) this.#enableAutoHide();
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  connectedCallback() {
    this.#ripple = new Ripple({
      element: this.shadowRoot.querySelector('.ripple'),
      triggerElement: this,
      // ignoreElements: [this.querySelector('mdw-menu')]
    });
  }

  disconnectedCallback() {
    if (this.#autoHideLabel || this.#autoHide) util.untrackScrollDirectionChange(this.#scrollDirectionChange_bound);
    this.#ripple.destroy();
  }

  template() {
    return /* html */`
      <button>
        <slot class="icon"></slot>
        <slot name="label"></slot>
      </button>
      <div class="state-layer"></div>
      <div class="ripple"></div>
    `;
  }

  #scrollDirectionChange(direction) {
    if (direction === 1) {
      this.style.maxWidth = `${this.#maxWidth}px`;
      if (this.#autoHide) {
        this.classList.remove('hide');
      } else {
        this.classList.remove('hide-label');
      }
    } else {
      this.style.maxWidth = '0px';
      if (this.#autoHide) {
        this.classList.add('hide');
      } else {
        this.classList.add('hide-label');
      }
    }
  }

  #initialAutoHideLabel = false;
  #enableAutoHide() {
    if (this.#autoHideLabel && !this.#initialAutoHideLabel) {
      this.#initialAutoHideLabel = true;
      const observer = new IntersectionObserver(entries => {
        this.#maxWidth = entries[0].boundingClientRect.width;
        this.style.maxWidth = `${this.#maxWidth}px`;
        observer.disconnect();

        if (document.documentElement.scrollTop !== 0) this.#scrollDirectionChange(-1);
        util.trackScrollDirectionChange(this.#scrollDirectionChange_bound);
        setTimeout(() => this.classList.add('mdw-animation'));
      });
      observer.observe(this);
    } else {
      if (document.documentElement.scrollTop !== 0) this.#scrollDirectionChange(-1);
      util.trackScrollDirectionChange(this.#scrollDirectionChange_bound);
      setTimeout(() => this.classList.add('mdw-animation'));
    }
  }
}
customElements.define(MDWFabElement.tag, MDWFabElement);
