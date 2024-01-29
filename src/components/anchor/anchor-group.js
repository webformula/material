import HTMLComponentElement from '../HTMLComponentElement.js';

customElements.define('mdw-anchor-group', class MDWAnchorGroupElement extends HTMLComponentElement {
  static useShadowRoot = false;

  #control;
  #open = false;
  #controlClick_bound = this.#controlClick.bind(this);

  constructor() {
    super();
  }

  connectedCallback() {
    this.#control = this.querySelector('mdw-anchor[control]');
    this.#control.addEventListener('click', this.#controlClick_bound);
    if (this.querySelector('mdw-anchor.current')) {
      this.classList.add('has-current');
      this.open = true;
    }
  }

  disconnectedCallback() {
    this.#control.removeEventListener('click', this.#controlClick_bound);
  }

  get open() {
    return this.#open;
  }
  set open(value) {
    if (this.#open === !!value) return;
    
    this.#open = !!value;
    if (this.#open) {
      this.#control.classList.add('open');
      if (!this.parentElement.classList.contains('mdw-state-rail')) this.style.setProperty('--mdw-navigation-drawer-group-height', `${this.#fullHeight}px`);
    } else {
      this.style.setProperty('--mdw-navigation-drawer-group-height', '56px');
      this.#control.classList.remove('open');
    }
  }

  get #fullHeight() {
    return [...this.querySelectorAll('mdw-anchor')].length * 58;
  }

  #controlClick(event) {
    this.open = !this.open;
    event.preventDefault();
    event.stopPropagation();
  }
});
