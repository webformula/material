import MDWSurfaceElement from '../surface/component.js';
import styles from './menu.css' assert { type: 'css' };
import util from '../../core/util.js';

// TODO nested arrow icon

export default class MDWMenuElement extends MDWSurfaceElement {
  static tag = 'mdw-menu';
  static styleSheets = styles;

  #abort;
  #searchKeys = '';
  #searchItems;
  #isSubMenu = false;
  #isContextMenu;
  #contextMenuId;
  #contextTarget;
  #disableLetterFocus = false;
  #textSearchOver_debounced = util.debounce(this.#textSearchOver, 240);
  #anchorClick_bound = this.#anchorClick.bind(this);
  #onItemClick_bound = this.#onItemClick.bind(this);
  #openKeydown_bound = this.#openKeydown.bind(this);
  #rightClick_bound = this.#rightClick.bind(this);


  constructor() {
    super();

    this.role = 'menu';
    this.allowClose = true;
    this.animation = 'height';
  }

  template() {
    return /*html*/`
      <div class="surface">
        <div class="surface-content">
          <div class="item-padding">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }

  connectedCallback(override  = false) {
    super.connectedCallback();
    this.#abort = new AbortController();
    if (override) return;

    this.#isSubMenu = this.getAttribute('slot') === 'sub-menu';
    if (this.#isSubMenu) {
      this.anchorElement = this.parentElement;
      this.fixed = true;
      this.position = 'top right';

      // set parent delay adding in self delay
      this.anchorElement.parentElement.closeDelay = 60;
      setTimeout(() => {
        this.anchorElement.parentElement.closeDelay += this.closeDelay;
      });
    }
    this.#isContextMenu = this.hasAttribute('context-menu');
    this.#contextMenuId = this.getAttribute('context-menu');
    if (this.#isContextMenu) {
      this.positionMouse = true;
      document.addEventListener('contextmenu', this.#rightClick_bound, { signal: this.#abort.signal });
    } else if (this.anchorElement) {
      this.anchorElement.addEventListener('click', this.#anchorClick_bound, { signal: this.#abort.signal });
    } else {
      this.parentElement.addEventListener('click', this.#anchorClick_bound, { signal: this.#abort.signal });
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.#abort) this.#abort.abort();
  }


  get contextTarget() { return this.#contextTarget; }
  get disableLetterFocus() { return this.#disableLetterFocus; }
  set disableLetterFocus(value) { this.#disableLetterFocus = !!value; }



  onShow() {
    // ignore when extended for select
    if (this.role !== 'select') this.addEventListener('click', this.#onItemClick_bound, { signal: this.#abort.signal });
    window.addEventListener('keydown', this.#openKeydown_bound, { signal: this.#abort.signal });
  }

  onHide() {
    // ignore when extended for select
    if (this.role !== 'select')  this.removeEventListener('click', this.#onItemClick_bound);
    window.removeEventListener('keydown', this.#openKeydown_bound);
    this.#contextTarget = undefined;
  }

  #anchorClick() {
    this.show();
  }

  // delay close so button press animation is seen
  #onItemClick(event) {
    if (event.target.role !== 'menuitem') return;
    if (event.target.hasSubMenu) return;
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
    } else if (e.code === 'Escape' && this.allowClose) {
      this.close();
      // TODO work out what to do here
      if (this.nodeName !== 'MDW-SELECT' && this.anchorElement) this.anchorElement.focus();

    // picks first filtered item based on style.order if focus is on input
    } else if (e.code === 'Enter' && this.nodeName === 'MDW-SELECT' && this.#disableLetterFocus) {
      const available = [...this.querySelectorAll('mdw-option:not(.filtered)')].find(v => v.style.order === '0');
      if (available) available.click();

    // focus on item based on character presses
    } else if (!this.#disableLetterFocus && ![38, 40, 13].includes(e.keyCode)) return this.#textSearch(e.key);
  }

  #focusNext() {
    const sorted = this.#getFocusableElement().sort(c => c.style.order === '0' ? -1 : 0);
    const focusedIndex = sorted.findIndex(c => c === document.activeElement);
    const item = sorted[focusedIndex + 1];
    if (item) item.focus();
  }

  #focusPrevious() {
    const sorted = this.#getFocusableElement().sort(c => c.style.order === '0' ? -1 : 0);
    let focusedIndex = sorted.findIndex(c => c === document.activeElement);
    if (focusedIndex === -1) focusedIndex = sorted.length;

    // at top
    if (focusedIndex === 0) {
      // if mdw-select[filter] then focus on textfield
      if (this.nodeName === 'MDW-SELECT' && this.hasAttribute('filter')) this.shadowRoot.querySelector('mdw-textfield').focus();
      if (this.nodeName === 'MDW-SEARCH') this.shadowRoot.querySelector('input').focus();
      return;
    }
    const item = sorted[focusedIndex - 1];
    if (item) item.focus()
  }

  // focus on element that starts with typed characters
  #textSearch(key) {
    this.#searchKeys += key.toLowerCase();
    if (!this.#searchItems) this.#searchItems = this.#getFocusableElement().map(element => ({
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

  async #rightClick(event) {
    if (this.#contextMenuId && !this.#iscontextMenuParent(event.target)) {
      this.close();
      return;
    }

    event.preventDefault();
    await this.close();
    this.show();
    this.#contextTarget = event.target;
  }

  #iscontextMenuParent(node) {
    let parentElement = node
    while (parentElement !== null && parentElement !== document.body) {
      if (parentElement.getAttribute('context-menu') === this.#contextMenuId) return parentElement;
      parentElement = parentElement.parentElement;
    }
  }

  #getFocusableElement() {
    return util.getFocusableElements(this, element => {
      return element.classList.contains('filtered');
    });
  }
};

customElements.define(MDWMenuElement.tag, MDWMenuElement);
