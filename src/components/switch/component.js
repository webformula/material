import HTMLElementExtended from '../HTMLElementExtended.js';
import sheet from './component.css' assert { type: 'css' };
import util from '../../core/util.js';


customElements.define('mdw-switch', class MDWSwitch extends HTMLElementExtended {
  useShadowRoot = true;

  #disabled = false;
  #checked = false;
  #value = 'on';
  #click_bound = this.#click.bind(this);

  constructor() {
    super();
  }

  template() {
    return /* html */`
      <slot></slot>
      <div class="track">
        <div class="thumb">
          <svg version="1.1" focusable="false" viewBox="0 0 16 16">
            <path fill="none" stroke="white" d="M5,8 7.7,10 12,5.5" ></path>
          </svg>
        </div>
      </div>

      <style>${this.stringifyStyleSheet(sheet)}</style>
    `;
  }

  connectedCallback() {
    this.tabIndex = 0;
    this.setAttribute('role', 'checkbox');
    this.setAttribute('aria-label', util.getTextFromNode(this));
  }

  disconnectedCallback() {
    this.shadowRoot.querySelector('.track').removeEventListener('click', this.#click_bound);
  }

  afterRender() {
    this.shadowRoot.querySelector('.track').addEventListener('click', this.#click_bound);
  }

  static get observedAttributes() {
    return ['checked', 'disabled', 'value'];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === 'checked') this.checked = newValue !== null;
    else if (name === 'disabled') this.disabled = newValue !== null;
    else this[name] = newValue;
  }

  get checked() {
    return this.#checked;
  }
  set checked(value) {
    this.#checked = !!value;
    this.classList.toggle('mdw-checked', this.#checked);
    this.setAttribute('aria-checked', this.#checked.toString() || 'false');
  }

  get disabled() {
    return this.#disabled;
  }
  set disabled(value) {
    this.#disabled = !!value;
    this.toggleAttribute('disabled', this.#disabled);
  }

  get value() {
    return this.#value;
  }
  set value(value) {
    this.#value = value;
  }

  #click() {
    this.checked = !this.#checked;
    this.dispatchEvent(new Event('change'));
  }
});
