import HTMLElementExtended from '../HTMLElementExtended.js';
import Ripple from '../../core/Ripple.js';
import util from '../../core/util.js';
import styles from './component.css' assert { type: 'css' };
// TODO lowered
customElements.define('mdw-fab', class MDWFabElement extends HTMLElementExtended {
  static useShadowRoot = true;
  static styleSheets = styles;

  #ripple;
  #autoHide;
  #autoHideLabel;
  #scrollDirectionChange_bound = this.#scrollDirectionChange.bind(this);


  constructor() {
    super();
  }

  connectedCallback() {
    this.tabIndex = 0;
    this.#autoHide = this.classList.contains('mdw-auto-hide');
    this.#autoHideLabel = !this.#autoHide && this.classList.contains('mdw-auto-hide-label');
    this.setAttribute('role', 'button');
    if (!!util.getTextFromNode(this)) this.classList.add('mdw-has-label');
    this.#handleTrailingIcon();
  }

  afterRender() {
    if (this.#autoHideLabel || this.#autoHide) util.trackScrollDirectionChange(this.#scrollDirectionChange_bound);
    this.#ripple = new Ripple({
      element: this.shadowRoot.querySelector('.ripple'),
      triggerElement: this,
      ignoreElements: [this.querySelector('mdw-menu')]
    });
    setTimeout(() => {
      this.classList.add('mdw-animation');
    }, 50);
  }

  disconnectedCallback() {
    if (this.#autoHideLabel || this.#autoHide) util.untrackScrollDirectionChange(this.#scrollDirectionChange_bound);
    this.#ripple.destroy();
  }

  template() {
    return /* html */`
      <slot></slot>
      <div class="ripple"></div>
    `;
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

  #scrollDirectionChange(direction) { 
    if (direction === 1) {
      this.style.maxWidth = `${this.offsetWidth + this.scrollWidth}px`;
      if (this.#autoHideLabel) {
        this.classList.remove('mdw-hide-label');
      } else {
        this.classList.remove('mdw-hide');
      }
    } else {
      this.style.maxWidth = '';
      if (this.#autoHideLabel) {
        this.classList.add('mdw-hide-label');
      } else {
        this.classList.add('mdw-hide');
      }
    }
  }
});
