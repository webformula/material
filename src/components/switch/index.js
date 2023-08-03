import HTMLElementExtended from '../HTMLElementExtended.js';
import styles from './component.css' assert { type: 'css' };
import util from '../../core/util.js';
import Drag from '../../core/Drag.js';

customElements.define('mdw-switch', class MDWSwitch extends HTMLElementExtended {
  useShadowRoot = true;
  static styleSheets = styles;

  #disabled = false;
  #checked = false;
  #value = 'on';
  #click_bound = this.#click.bind(this);
  #focus_bound = this.#focus.bind(this);
  #blur_bound = this.#blur.bind(this);
  #focusKeydown_bound = this.#focusKeydown.bind(this);
  #drag;
  #onDrag_bound = this.#onDrag.bind(this);
  #onDragEnd_bound = this.#onDragEnd.bind(this);

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
    `;
  }

  connectedCallback() {
    this.tabIndex = 0;
    this.setAttribute('role', 'checkbox');
    this.setAttribute('aria-checked', 'false');
    this.setAttribute('aria-label', util.getTextFromNode(this));
    this.addEventListener('focus', this.#focus_bound);

    if (!this.hasAttribute('aria-label')) {
      const text = util.getTextFromNode(this);
      if (text) this.setAttribute('aria-label', text);
    }
  }

  disconnectedCallback() {
    util.removeClickTimeout(this.shadowRoot.querySelector('.track'), this.#click_bound);
    this.removeEventListener('focus', this.#focus_bound);
    this.removeEventListener('blur', this.#blur_bound);
    this.removeEventListener('keydown', this.#focusKeydown_bound);
    this.#drag.destroy();
  }

  afterRender() {
    util.addClickTimeout(this.shadowRoot.querySelector('.track'), this.#click_bound);
    this.#drag = new Drag(this.#thumb);
    this.#drag.onDrag(this.#onDrag_bound);
    this.#drag.onEnd(this.#onDragEnd_bound);
    this.#drag.enable();
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

  get #thumb() {
    return this.shadowRoot.querySelector('.thumb');
  }

  #click() {
    this.checked = !this.#checked;
    this.dispatchEvent(new Event('change'));
    this.blur();
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
    if (e.code === 'Space' || e.code === 'Enter') {
      this.#click();
      e.preventDefault();
    }
  }

  #onDrag({ distanceX }) {
    let x = distanceX;
    if (x < 0) x = 0;
    if (x > 20) x = 20;
    this.#thumb.style.left = `${x}px`;
  }

  #onDragEnd() {
    const position = parseInt(this.#thumb.style.left.replace('px', ''));
    const current = this.checked;
    if (position > 10) this.checked = true;
    else this.checked = false;
    this.#thumb.style.left = '';
    if (this.checked !== current) this.dispatchEvent(new Event('change'));
  }
});
