import HTMLElementExtended from '../HTMLElementExtended.js';
import util from '../../core/util.js';


export default class MDWBottomAppBarElement extends HTMLElementExtended {
  #autoHide;
  #scrollDirectionChange_bound = this.#scrollDirectionChange.bind(this);
  #hashchange_bound = this.#hashchange.bind(this);


  constructor() {
    super();

    document.body.classList.add('has-bottom-app-bar');
    if (this.classList.contains('always-show')) document.body.classList.add('bottom-app-bar-always-show');
  }

  connectedCallback() {
    this.#autoHide = this.classList.contains('auto-hide');

    // prevent layout calculation during script evaluation with requestAnimationFrame
    if (this.#autoHide) requestAnimationFrame(() => {
      util.trackScrollDirectionChange(this.#scrollDirectionChange_bound);
    });

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
    if (!primary.classList.contains('mdw-hide')) return;

    const currentSecondary = this.querySelector('mdw-bottom-app-bar-secondary.mdw-show');
    if (currentSecondary) currentSecondary.classList.remove('mdw-show');

    primary.classList.remove('mdw-hide');
  }

  async showSecondary(id) {
    if (!id) return this.showPrimary();

    const primary = this.querySelector('mdw-bottom-app-bar-primary');
    if (!primary) throw Error('Must contain primary element "mdw-bottom-app-bar-primary" to use secondary');

    const secondary = this.querySelector(`mdw-bottom-app-bar-secondary#${id}`);
    if (!secondary) throw Error('Could not find secondary: "mdw-bottom-app-bar-secondary#${id}"');
    if (secondary.classList.contains('mdw-show')) return;

    const currentSecondary = this.querySelector('mdw-bottom-app-bar-secondary.mdw-show');
    if (currentSecondary) currentSecondary.classList.remove('mdw-show');

    primary.classList.add('mdw-hide')
    secondary.classList.add('mdw-show');
  }

  #scrollDirectionChange(direction) {
    this.classList.toggle('mdw-hide', direction === -1);
    document.body.classList.toggle('bottom-app-bar-hide', direction === -1);
  }

  #hashchange() {
    const secondaryByHash = this.querySelector(`mdw-bottom-app-bar-secondary[hash="${location.hash}"]`);
    if (secondaryByHash) this.showSecondary(secondaryByHash.getAttribute('id'));
    else this.showPrimary();
  }
}

customElements.define('mdw-bottom-app-bar', MDWBottomAppBarElement);
