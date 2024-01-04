import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './anchor.css' assert { type: 'css' };
import { expand_more_FILL0_wght400_GRAD0_opsz24 } from '../../core/svgs.js';


customElements.define('mdw-anchor', class MDWAnchorElement extends HTMLComponentElement {
  static useShadowRoot = true;
  static useTemplate = true;
  static shadowRootDelegateFocus = true;
  static styleSheets = styles;

  #link;
  #ariaLabel;
  #ariaLabelOriginal;
  #badge;
  #blur_bound = this.#blur.bind(this);
  #focusKeydown_bound = this.#focusKeydown.bind(this);
  #focus_bound = this.#focus.bind(this);
  #slotChange_bound = this.#slotChange.bind(this);
  

  constructor() {
    super();

    this.role = 'link';
    this.render();
    this.#link = this.shadowRoot.querySelector('a');
    // make sure aria label is set. Badge will alter the value
    this.ariaLabel = this.getAttribute('aria-label');
  }

  static get observedAttributesExtended() {
    return [
      ['aria-label', 'string'],
      ['href', 'string'],
      ['badge', 'number']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  template() {
    return /*html*/`
      <a>
        <slot name="leading-icon"></slot>
        <slot class="default-slot"></slot>
        <span class="badge-display"></span>
      </a>
      <span class="arrow">${expand_more_FILL0_wght400_GRAD0_opsz24}</span>
    `;
  }

  connectedCallback() {
    this.addEventListener('focusin', this.#focus_bound);
    this.shadowRoot.addEventListener('slotchange', this.#slotChange_bound);
  }

  disconnectedCallback() {
    this.removeEventListener('focusin', this.#focus_bound);
    this.removeEventListener('blur', this.#blur_bound);
    this.removeEventListener('keydown', this.#focusKeydown_bound);
    this.shadowRoot.removeEventListener('slotchange', this.#slotChange_bound);
  }


  get href() { return this.#link.href; }
  set href(value) {
    if (!value) {
      this.removeAttribute('href');
      this.#link.removeAttribute('href');
    } else {
      this.setAttribute('href', value);
      this.#link.setAttribute('href', value);
      if (!this.#ariaLabel) this.ariaLabel = value.replace(/\//g, ' ').trim();
    }
  }

  get ariaLabel() { return this.#ariaLabel; }
  set ariaLabel(value) {
    value = value || (this.getAttribute('href') || '').replace(/\//g, ' ').trim();
    this.#ariaLabel = value;
    if (!this.#ariaLabelOriginal) this.#ariaLabelOriginal = value;
    this.setAttribute('aria-label', value);
  }

  get badge() { return this.#badge; }
  set badge(value) {
    if (value === 0) value = '';
    if (value > 999) value = '999+';
    this.#badge = value;
    this.shadowRoot.querySelector('.badge-display').innerText = value;
    if (!value) this.ariaLabel = this.#ariaLabelOriginal;
    else this.ariaLabel = `[${this.#ariaLabelOriginal}] ${value} New ${value === 1 ? 'notification' : 'notifications'}`;
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
    // TODO should we skip to first sub navigation in nav or jump to first element on page
    if (e.code === 'Tab') {
      const pageContent = document.querySelector('#page-content') || document.querySelector('page-content');
      const firstFocusablePageContent = [...pageContent.querySelectorAll('*')].find(e => e.tabindex > -1 || parseInt(e.getAttribute('tabindex') || -1) > -1);
      if (firstFocusablePageContent) firstFocusablePageContent.focus();
      e.preventDefault();
    } if (e.code === 'Enter' || e.code === 'Space') {
      this.click();
      this.blur();
      e.preventDefault();
    } else if (e.code === 'ArrowDown') {
      this.#focusNext(e.target);
      e.preventDefault();
    } else if (e.code === 'ArrowUp') {
      this.#focusPrevious(e.target);
      e.preventDefault();
    }
  }

  #focusNext(focusedElement) {
    const anchors = this.#anchorElements();
    const focusedIndex = anchors.findIndex(a => a === focusedElement);
    let item = anchors[focusedIndex + 1];
    if (item && item.hasAttribute('control')) {
      item.parentElement.open = true;
      item = anchors[focusedIndex + 2];
    }
    if (item) item.focus();
  }

  #focusPrevious(focusedElement) {
    const anchors = this.#anchorElements();
    const focusedIndex = anchors.findIndex(a => a === focusedElement);
    if (focusedIndex <= 0) return;
    let item = anchors[focusedIndex - 1];
    if (item && item.hasAttribute('control')) {
      item.parentElement.open = false;
      item = anchors[focusedIndex - 2];
    }
    if (item) item.focus();
  }

  #anchorElements() {
    let nav = this.parentElement;
    if (nav.nodeName === 'MDW-ANCHOR-GROUP') nav = this.parentElement.parentElement;
    return [...nav.querySelectorAll('mdw-anchor')];
  }

  #slotChange(event) {
    if (event.target.classList.contains('default-slot') && ![...event.target.assignedNodes()].map(n => n.data.trim()).join('')) {
      this.classList.add('no-text');
    }
  }
});
