import HTMLComponentElement from '../HTMLComponentElement.js';
import util from '../../core/util.js';
import styles from './component.css' assert { type: 'css' };

class WFCFabElement extends HTMLComponentElement {
  static tag = 'wfc-fab';
  static useShadowRoot = true;
  static styleSheets = styles;
  static useTemplate = true;
  static shadowRootDelegateFocus = true;

  #autoHide;
  #autoHideLabel;
  #maxWidth;
  #scrollDirectionChange_bound = this.#scrollDirectionChange.bind(this);


  constructor() {
    super();

    this.role = 'button';
    this.render();
    if (this.parentElement.nodeName === 'WFC-BOTTOM-APP-BAR') {
      this.classList.add('wfc-animation');
    }
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
    this.toggleAttribute('auto-hide', this.#autoHide);

    this.style.maxWidth = '';
    this.classList.remove('hide-label');
    if (!this.#autoHide) util.untrackScrollDirectionChange(this.#scrollDirectionChange_bound);
    if (this.#autoHide || this.#autoHideLabel) this.#enableAutoHide();
  }

  get autoHideLabel() { return this.#autoHideLabel; }
  set autoHideLabel(value) {
    this.#autoHideLabel = !!value;
    this.toggleAttribute('auto-hide-label', this.#autoHideLabel);

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

  disconnectedCallback() {
    if (this.#autoHideLabel || this.#autoHide) util.untrackScrollDirectionChange(this.#scrollDirectionChange_bound);
  }

  template() {
    return /* html */`
      <button>
        <slot class="icon"></slot>
        <slot name="label"></slot>
      </button>
      <wfc-state-layer ripple></wfc-state-layer>
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
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.#maxWidth = this.offsetWidth;
          this.style.maxWidth = `${this.#maxWidth}px`;

          if (document.documentElement.scrollTop !== 0) this.#scrollDirectionChange(-1);
          util.trackScrollDirectionChange(this.#scrollDirectionChange_bound);
          requestAnimationFrame(() => this.classList.add('wfc-animation'));
        });
      });
    } else {
      if (document.documentElement.scrollTop !== 0) this.#scrollDirectionChange(-1);
      util.trackScrollDirectionChange(this.#scrollDirectionChange_bound);
      setTimeout(() => this.classList.add('wfc-animation'));
    }
  }
}
customElements.define(WFCFabElement.tag, WFCFabElement);
