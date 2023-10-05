import HTMLElementExtended from '../HTMLElementExtended.js';

customElements.define('mdw-navigation-drawer-group', class MDWNavigationDrawerGroupElement extends HTMLElementExtended {
  #control = this.querySelector('a[group]');
  #open = false;
  #controlClick_bound = this.#controlClick.bind(this);


  constructor() {
    super();

    if (!this.#control) throw Error('requires a control anchor: a[group] (no href)');
  }

  connectedCallback() {
    this.#control.addEventListener('click', this.#controlClick_bound);
  }

  disconnectedCallback() {
    this.#control.removeEventListener('click', this.#controlClick_bound);
  }

  get open() {
    return this.#open;
  }
  set open(value) {
    this.#open = !!value;
    if (this.#open) {
      this.#control.classList.add('mdw-open');
      if (!this.parentElement.classList.contains('mdw-state-rail')) this.style.setProperty('--mdw-navigation-drawer-group-height', `${this.#fullHeight}px`);
    } else {
      this.style.setProperty('--mdw-navigation-drawer-group-height', '56px');
      this.#control.classList.remove('mdw-open');
    }
  }

  get #fullHeight() {
    return this.offsetHeight, this.scrollHeight;
  }

  #controlClick() {
    this.open = !this.open;
  }
});
