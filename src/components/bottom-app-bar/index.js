import HTMLElementExtended from '../HTMLElementExtended.js';
import util from '../../core/util.js';


export default class MDWBottomAppBarElement extends HTMLElementExtended {
  #autoHide;
  #scrollDirectionChange_bound = this.#scrollDirectionChange.bind(this);

  constructor() {
    super();

    document.body.classList.add('mdw-has-bottom-app-bar');
    if (this.classList.contains('mdw-always-show')) document.body.classList.add('mdw-bottom-app-bar-always-show');
  }

  connectedCallback() {
    this.#autoHide = this.classList.contains('mdw-auto-hide');

    // prevent layout calculation during script evaluation with requestAnimationFrame
    if (this.#autoHide) requestAnimationFrame(() => {
      util.trackScrollDirectionChange(this.#scrollDirectionChange_bound);
    });
  }

  disconnectedCallback() {
    if (this.#autoHide) util.untrackScrollDirectionChange(this.#scrollDirectionChange_bound);
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
    document.body.classList.toggle('mdw-bottom-app-bar-hide', direction === -1);
  }
}

customElements.define('mdw-bottom-app-bar', MDWBottomAppBarElement);
