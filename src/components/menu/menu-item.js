import HTMLComponentElement from "../HTMLComponentElement.js";
import styles from './menu-item.css' assert { type: 'css' };
import Ripple from '../../core/Ripple.js';

export default class WFCMenuItemElement extends HTMLComponentElement {
  static tag = 'wfc-menu-item';
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
    this.render();
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

  connectedCallback() {
    this.addEventListener('focus', this.#focus_bound);
    this.hasSubMenu = !!this.querySelector('[slot="sub-menu"]');
    this.#ripple = new Ripple({
      element: this.shadowRoot.querySelector('.ripple'),
      triggerElement: this
    });
  }

  disconnectedCallback() {
    if (this.#ripple) this.#ripple.destroy();
    this.removeEventListener('focus', this.#focus_bound);
    this.removeEventListener('blur', this.#blur_bound);
    this.removeEventListener('keydown', this.#focusKeydown_bound);
  }

  get contextTarget() { return this.parentElement.contextTarget; }
  get label() { return [...this.shadowRoot.querySelector('.default-slot').assignedNodes()].map(e => e.data).join('').trim() || this.getAttribute('value'); }
  get value() { return this.getAttribute('value') || this.label; }


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

customElements.define(WFCMenuItemElement.tag, WFCMenuItemElement);
