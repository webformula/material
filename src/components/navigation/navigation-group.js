import HTMLElementExtended from '../HTMLElementExtended.js';
import './navigation-group.css';
import Panel from '../panel/service.js';

customElements.define('mdw-navigation-group', class MDWNavigationGroupElement extends HTMLElementExtended {
  #control = this.querySelector('mdw-anchor[group]');
  #open = false;
  #controlClick_bound = this.#controlClick.bind(this);


  constructor() {
    super();

    if (!this.#control) throw Error('requires a control anchor: mdw-anchor[group] (no href)');
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
      if (this.parentElement.classList.contains('mdw-state-rail')) this.#copyToSecondary();
      else this.style.setProperty('--mdw-navigation-group-height', `${this.#fullHeight}px`);
    } else {
      this.style.setProperty('--mdw-navigation-group-height', '56px');
      this.#control.classList.remove('mdw-open');
    }
  }

  get #fullHeight() {
    return this.offsetHeight, this.scrollHeight;
  }

  updateActive() {
    if (this.querySelector('mdw-anchor.mdw-active')) {
      this.#control.classList.add('mdw-active');
      this.open = true;
    } else {
      this.#control.classList.remove('mdw-active');
    }
  }

  #controlClick() {
    this.open = !this.open;
  }

  #copyToSecondary() {
    // console.log([...this.children].filter(e => !e.hasAttribute('group')))
  }
});
