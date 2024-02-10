import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };

class WFCAvatarElement extends HTMLComponentElement {
  static tag = 'wfc-avatar';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = styles;

  #checked = false;

  constructor() {
    super();

    this.render();
    setTimeout(() => {
      this.classList.add('animation');
    }, 50);
  }

  get checked() {
    return this.#checked;
  }
  set checked(value) {
    this.#checked = !!value;
    this.classList.toggle('checked', this.#checked);
    this.setAttribute('aria-checked', this.#checked.toString());
  }

  template() {
    return /* html */`
      <slot></slot>
      <svg version="1.1" focusable="false" viewBox="0 0 24 24">
        <path fill="none" stroke="white" stroke-width="2" d="M4.1,12.7 9,17.6 20.3,6.3" ></path>
      </svg>
    `;
  }
};

customElements.define(WFCAvatarElement.tag, WFCAvatarElement);
