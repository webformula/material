import HTMLElementExtended from "../HTMLElementExtended.js";
import styles from './menu-item.css' assert { type: 'css' };
import Ripple from '../../core/Ripple.js';

export default class MDWMenuItemElement extends HTMLElementExtended {
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = styles;

  #ripple;
  #focus_bound = this.#focus.bind(this);
  #blur_bound = this.#blur.bind(this);
  #focusKeydown_bound = this.#focusKeydown.bind(this);


  constructor() {
    super();

    this.role = 'menuitem';
    this.tabIndex = 0;
  }

  template() {
    return /*html*/`
      <slot name="start"></slot>
      <slot class="default-slot"></slot>
      <slot name="end"></slot>
      <div class="state-layer"></div>
      <div class="ripple"></div>
      <slot name="sub-menu"></slot>
    `;
  }

  afterRender() {
    super.afterRender();

    this.addEventListener('focus', this.#focus_bound);
    this.#ripple = new Ripple({
      element: this.shadowRoot.querySelector('.ripple'),
      triggerElement: this
    });

    this.hasSubMenu = !!this.querySelector('[slot="sub-menu"]');
  }

  get contextTarget() { return this.parentElement.contextTarget; }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.#ripple) this.#ripple.destroy();
    this.removeEventListener('focus', this.#focus_bound);
    this.removeEventListener('blur', this.#blur_bound);
    this.removeEventListener('keydown', this.#focusKeydown_bound);
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
    if (e.key === 'Enter') this.click();
  }
};

customElements.define('mdw-menu-item', MDWMenuItemElement);
