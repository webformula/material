import HTMLElementExtended from '../HTMLElementExtended.js';
import sheet from './component.css' assert { type: 'css' };

// TODO accessability

customElements.define('mdw-avatar', class MDWAvatarElement extends HTMLElementExtended {
  useShadowRoot = true;
  #checked = false;

  constructor() {
    super();
  }

  get checked() {
    return this.#checked;
  }
  set checked(value) {
    this.#checked = !!value;
    this.classList.toggle('mdw-checked', this.#checked);
  }

  template() {
    return /* html */`
      <slot></slot>
      <svg version="1.1" focusable="false" viewBox="0 0 24 24">
        <path fill="none" stroke="white" stroke-width="2" d="M4.1,12.7 9,17.6 20.3,6.3" ></path>
      </svg>

      <style>${this.stringifyStyleSheet(sheet)}</style>
    `;
  }
});
