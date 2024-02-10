import HTMLComponentElement from '../HTMLComponentElement.js';

class WFCAnchorGroupElement extends HTMLComponentElement {
  static tag = 'wfc-anchor-group';
  static useShadowRoot = false;

  #control;
  #open = false;
  #controlClick_bound = this.#controlClick.bind(this);

  constructor() {
    super();
  }

  connectedCallback() {
    this.#control = this.querySelector('wfc-anchor[control]');
    this.#control.addEventListener('click', this.#controlClick_bound);
    if (this.querySelector('wfc-anchor.current')) {
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
      if (!this.parentElement.classList.contains('wfc-state-rail')) this.style.setProperty('--wfc-navigation-drawer-group-height', `${this.#fullHeight}px`);
    } else {
      this.style.setProperty('--wfc-navigation-drawer-group-height', '56px');
      this.#control.classList.remove('open');
    }
  }

  get #fullHeight() {
    return [...this.querySelectorAll('wfc-anchor')].length * 58;
  }

  #controlClick(event) {
    this.open = !this.open;
    event.preventDefault();
    event.stopPropagation();
  }
}

customElements.define(WFCAnchorGroupElement.tag, WFCAnchorGroupElement);
