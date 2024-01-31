import HTMLComponentElement from '../HTMLComponentElement.js';
import util from '../../core/util.js';

// TODO refactor
// TODO FAB

export default class MDWBottomAppBarElement extends HTMLComponentElement {
  static tag = 'mdw-bottom-app-bar';

  #autoHide;
  #scrollDirectionChange_bound = this.#scrollDirectionChange.bind(this);
  #hashchange_bound = this.#hashchange.bind(this);


  constructor() {
    super();

    document.body.classList.add('has-bottom-app-bar');
    if (this.classList.contains('always-show')) document.body.classList.add('bottom-app-bar-always-show');
    this.#autoHide = this.classList.contains('auto-hide');
    if (this.#autoHide) document.body.classList.add('bottom-app-bar-auto-hide');
  }

  connectedCallback() {
    if (this.#autoHide) util.trackScrollDirectionChange(this.#scrollDirectionChange_bound);

    if (this.querySelector('mdw-bottom-app-bar-secondary[hash]')) {
      [...this.querySelectorAll('mdw-bottom-app-bar-secondary')].forEach(element => {
        const id = element.getAttribute('id');
        element.setAttribute('id', id || `bottom-app-bar-secondary-${util.uid()}`);
      })
      window.addEventListener('hashchange', this.#hashchange_bound);
      this.#hashchange();
    }
  }

  disconnectedCallback() {
    if (this.#autoHide) util.untrackScrollDirectionChange(this.#scrollDirectionChange_bound);
    window.removeEventListener('hashchange', this.#hashchange_bound);
  }

  async showPrimary() {
    const primary = this.querySelector('mdw-bottom-app-bar-primary');
    if (!primary) throw Error('Must contain primary element "mdw-bottom-app-bar-primary" to use secondary');
    if (!primary.classList.contains('hide')) return;

    const currentSecondary = this.querySelector('mdw-bottom-app-bar-secondary.show');
    if (currentSecondary) currentSecondary.classList.remove('show');

    primary.classList.remove('hide');
  }

  async showSecondary(id) {
    if (!id) return this.showPrimary();

    const primary = this.querySelector('mdw-bottom-app-bar-primary');
    if (!primary) throw Error('Must contain primary element "mdw-bottom-app-bar-primary" to use secondary');

    const secondary = this.querySelector(`mdw-bottom-app-bar-secondary#${id}`);
    if (!secondary) throw Error('Could not find secondary: "mdw-bottom-app-bar-secondary#${id}"');
    if (secondary.classList.contains('show')) return;

    const currentSecondary = this.querySelector('mdw-bottom-app-bar-secondary.show');
    if (currentSecondary) currentSecondary.classList.remove('show');

    primary.classList.add('hide')
    secondary.classList.add('show');
  }

  #scrollDirectionChange(direction) {
    this.classList.toggle('hide', direction === -1);
    document.body.classList.toggle('bottom-app-bar-hide', direction === -1);
  }

  #hashchange() {
    const secondaryByHash = this.querySelector(`mdw-bottom-app-bar-secondary[hash="${location.hash}"]`);
    if (secondaryByHash) this.showSecondary(secondaryByHash.getAttribute('id'));
    else this.showPrimary();
  }
}

customElements.define(MDWBottomAppBarElement.tag, MDWBottomAppBarElement);
