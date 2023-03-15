import HTMLElementExtended from '../HTMLElementExtended.js';
import './list.css';
import util from '../../core/util.js';

customElements.define('mdw-list', class MDWListElement extends HTMLElementExtended {
  #value = '';
  #selectable = this.classList.contains('mdw-select') || this.classList.contains('mdw-select-multiple');
  #multiSelect = this.classList.contains('mdw-select-multiple');
  #subHeaders = [...this.querySelectorAll('.mdw-sub-header')];
  #scrollParent = this.#getScrollParent(this);
  #scroll_bound = this.#scroll.bind(this);

  constructor() {
    super();
  }

  connectedCallback() {
    this.setAttribute('role', 'list');
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'list');
    if (this.#subHeaders.length > 0) this.#scrollParent.addEventListener('scroll', this.#scroll_bound);
  }

  disconnectedCallback() {
    if (this.#subHeaders.length > 0) this.#scrollParent.removeEventListener('scroll', this.#scroll_bound);
  }

  static get observedAttributes() {
    return ['value'];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get value() {
    return this.#value;
  }

  set value(value) {
    if (value === null || value === undefined) value = '';
    value = `${value}`;
    this.#value = value;
    const valueArray = value.split(',');

    // if we call checked before the component is connected, it will overwrite the setter/getter
    util.nextAnimationFrameAsync().then(() => {
      [...this.querySelectorAll('mdw-list-item')].forEach(item => {
        item.setCheckedWithoutUpdate(valueArray.includes(item.value));
      });
    });
  }

  get selectable() {
    return this.#selectable;
  }

  updateSelection(value, checked) {
    if (this.#multiSelect) {
      const valueArray = this.value.split(',');
      if (checked === true) valueArray.push(value);
      else {
        const matchIndex = valueArray.indexOf(value);
        valueArray.splice(matchIndex, 1)
      }
      this.#value = valueArray.filter(v => !!v.trim()).join(',');

    } else {
      if (checked === true) {
        const currentChecked = [...this.querySelectorAll('mdw-list-item.mdw-checked')].filter(i => i.value !== value);
        currentChecked.forEach(v => v.setCheckedWithoutUpdate(false));
        this.#value = value;
      } else this.#value = ''; 
    }
  }

  #getScrollParent(node) {
    if (!node) return;
    if (node.nodeName === 'BODY') return node;
    if (node.scrollHeight > node.offsetHeight) return node;
    return this.#getScrollParent(node.parentNode);
  }

  #scroll() {
    this.classList.toggle('mdw-scrolled', this.#scrollParent.scrollTop !== 0);
    const top = this.#scrollParent.getBoundingClientRect().y;
    this.#subHeaders.forEach(element => {
      if (top >= element.getBoundingClientRect().y - 42) element.classList.add('mdw-stuck');
      else element.classList.remove('mdw-stuck');
    });
  }
});
