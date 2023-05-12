import MDWPanelElement from '../panel/component.js';
import util from '../../core/util.js';
import styles from './component.css' assert { type: 'css' };
MDWPanelElement.registerGlobalStyleSheet(styles);

// TODO bottom sheet on mobile
// TODO sub menus

customElements.define('mdw-menu', class MDWMenuElement extends MDWPanelElement {
  #control;
  #controlSelector = this.getAttribute('control');
  #onControlClick_bound = this.#onControlClick.bind(this);
  #onPanelOpen_bound = this.#onPanelOpen.bind(this);
  #onPanelClose_bound = this.#onPanelClose.bind(this);
  #onItemClick_bound = this.#onItemClick.bind(this);
  #openKeydown_bound = this.#openKeydown.bind(this);
  #abort = new AbortController();
  #textSearchOver_debounced = util.debounce(this.#textSearchOver, 240);
  #searchKeys = '';
  #searchItems;

  constructor() {
    super();

    // if (!this.#controlSelector) throw Error('No control found. Must provide the attributer "control" with a valid css selector');
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'menu');

    if (this.#controlSelector) this.#control = document.querySelector(this.#controlSelector);
    else this.#control = this.parentElement;
    if (!this.#control) throw Error('No control found. Must provide the attributer "control" with a valid css selector');

    this.target = this.#control;
    this.animation = 'expand';

    this.#control.addEventListener('click', this.#onControlClick_bound, { signal: this.#abort.signal });
    this.addEventListener('open', this.#onPanelOpen_bound, { signal: this.#abort.signal });
    this.addEventListener('close', this.#onPanelClose_bound, { signal: this.#abort.signal });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#abort.abort();
  }

  #onControlClick() {
    this.show();
  }

  #onPanelOpen() {
    this.addEventListener('click', this.#onItemClick_bound, { signal: this.#abort.signal });
    this.addEventListener('keydown', this.#openKeydown_bound, { signal: this.#abort.signal });
    // fix before div height for tint layer
    this.style.setProperty('--mdw-menu-background-height', `${this.scrollHeight}px`);
    this.querySelector('mdw-button')?.focus();
  }

  #onPanelClose() {
    this.removeEventListener('click', this.#onItemClick_bound);
    this.removeEventListener('keydown', this.#openKeydown_bound);
  }

  // delay close so button press animation is seen
  #onItemClick(event) {
    if (event.target.nodeName !== 'MDW-BUTTON') return;
    event.target.dispatchEvent(new CustomEvent('selected', { bubbles: true }));

    setTimeout(() => {
      this.close();
    }, 40);
  }

  #openKeydown(e) {
    if (e.code === 'ArrowDown') {
      this.#focusNext();
      e.preventDefault();
    } else if (e.code === 'ArrowUp') {
      this.#focusPrevious();
      e.preventDefault();
    } else if (e.code === 'Escape') {
      this.close();
      this.#control.focus();
    } else if (![38, 40, 13].includes(e.keyCode)) return this.#textSearch(e.key);
  }

  #focusNext() {
    let nextFocus = document.activeElement?.nextElementSibling;
    if (!nextFocus) return;

    // try next sibling
    if (nextFocus.nodeName !== 'MDW-BUTTON') nextFocus = nextFocus.nextElementSibling;
    if (nextFocus?.nodeName === 'MDW-BUTTON') nextFocus.focus();
  }

  #focusPrevious() {
    let nextFocus = document.activeElement?.previousElementSibling;
    if (!nextFocus) return;

    // try next sibling
    if (nextFocus.nodeName !== 'MDW-BUTTON') nextFocus = nextFocus.previousElementSibling;
    if (nextFocus?.nodeName === 'MDW-BUTTON') nextFocus.focus();
  }

  // focus on element that starts with typed characters
  #textSearch(key) {
    this.#searchKeys += key.toLowerCase();
    if (!this.#searchItems) this.#searchItems = [...this.querySelectorAll('mdw-button')].map(element => ({
      element,
      text: util.getTextFromNode(element).toLowerCase()
    }));

    const match = this.#searchItems.find(({ text }) => text.startsWith(this.#searchKeys));
    if (match) match.element.focus();
    this.#textSearchOver_debounced();
  }

  #textSearchOver() {
    this.#searchKeys = '';
    this.#searchItems = undefined;
  }
});
