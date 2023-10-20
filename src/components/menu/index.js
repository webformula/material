import MDWPanelElement from '../panel/component.js';
import util from '../../core/util.js';

// TODO bottom sheet on mobile

customElements.define('mdw-menu', class MDWMenuElement extends MDWPanelElement {
  #control;
  #isContextMenu;
  #controlSelector;
  #onControlClick_bound = this.#onControlClick.bind(this);
  #onPanelOpen_bound = this.#onPanelOpen.bind(this);
  #onPanelClose_bound = this.#onPanelClose.bind(this);
  #onItemClick_bound = this.#onItemClick.bind(this);
  #openKeydown_bound = this.#openKeydown.bind(this);
  #rightClick_bound = this.#rightClick.bind(this);
  #abort;
  #textSearchOver_debounced = util.debounce(this.#textSearchOver, 240);
  #searchKeys = '';
  #searchItems;
  #contentMenuTarget;
  #nestedMenu;

  constructor() {
    super();

    this.clickOutsideClose = true;
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'menu');

    this.animation = 'expand';
    this.#isContextMenu = this.hasAttribute('context-menu');
    this.#abort = new AbortController();
    if (this.#isContextMenu) {
      document.addEventListener('contextmenu', this.#rightClick_bound, { signal: this.#abort.signal });
    } else {
      this.#controlSelector = this.getAttribute('control');
      if (this.#controlSelector) this.#control = document.querySelector(this.#controlSelector);
      else this.#control = this.parentElement;
      if (!this.#control) throw Error('No control found. Must provide the attributer "control" with a valid css selector');
      this.#control.classList.add('mdw-menu-control');
      if (this.#control.parentElement.nodeName === 'MDW-MENU') this.#nestedMenu = true;
      this.target = this.#control;
      this.#control.addEventListener('click', this.#onControlClick_bound, { signal: this.#abort.signal });
    }

    this.addEventListener('open', this.#onPanelOpen_bound, { signal: this.#abort.signal });
    this.addEventListener('close', this.#onPanelClose_bound, { signal: this.#abort.signal });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#abort.abort();
  }

  get contentMenuTarget() {
    return this.#contentMenuTarget;
  }

  #onControlClick(event) {
    if (event.target !== this.#control) return;
    if (this.#nestedMenu) this.positionSide = true;
    this.show();
  }

  #onPanelOpen() {
    this.addEventListener('click', this.#onItemClick_bound, { signal: this.#abort.signal });
    this.addEventListener('keydown', this.#openKeydown_bound, { signal: this.#abort.signal });
    this.querySelector('mdw-button')?.focus();
  }

  #onPanelClose() {
    this.removeEventListener('click', this.#onItemClick_bound);
    this.removeEventListener('keydown', this.#openKeydown_bound);
  }

  // delay close so button press animation is seen
  #onItemClick(event) {
    if (event.target.classList.contains('mdw-menu-control')) return;
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

  #rightClick(event) {
    if (this.open) {
      event.preventDefault();
      return;
    }
    const contextMenuParent = this.#checkForContextMenuAttribute(event.target);
    if (!contextMenuParent) return;
    event.preventDefault();
    this.setPosition(event.clientX, event.clientY);
    this.show();
    this.#contentMenuTarget = contextMenuParent;
  }

  #checkForContextMenuAttribute(node) {
    const id = this.id;
    let parentElement = node
    while (parentElement !== null && parentElement !== document.body) {
      if (parentElement.getAttribute('context-menu') === id) return parentElement;
      parentElement = parentElement.parentElement;
    }
  }
});
