import HTMLElementExtended from '../HTMLElementExtended.js';
import util from '../../core/util.js';
import AnchorController from '../anchor/controller.js';


export default class MDWNavigationBarElement extends HTMLElementExtended {
  #autoHide = false;
  #scrollDirectionChange_bound = this.#scrollDirectionChange.bind(this);
  #locationchange_bound = this.#locationchange.bind(this);

  constructor() {
    super();

    document.body.classList.add('mdw-has-navigation-bar');
    if (this.classList.contains('mdw-always-show')) document.body.classList.add('mdw-navigation-bar-always-show');
  }

  connectedCallback() {
    this.setAttribute('role', 'navigation');
    this.#autoHide = this.classList.contains('mdw-auto-hide');
    [...this.querySelectorAll('a')].forEach(element => new AnchorController(element));

    // prevent layout calculation during script evaluation with requestAnimationFrame
    if (this.#autoHide) requestAnimationFrame(() => {
      util.trackScrollDirectionChange(this.#scrollDirectionChange_bound);
    });

    window.addEventListener('locationchange', this.#locationchange_bound);
    this.#locationchange();
  }

  disconnectedCallback() {
    if (this.#autoHide) util.untrackScrollDirectionChange(this.#scrollDirectionChange_bound);
    window.removeEventListener('hashchange', this.#locationchange_bound);
  }

  #scrollDirectionChange(direction) {
    this.classList.toggle('mdw-hide', direction === -1);
    document.body.classList.toggle('mdw-bottom-app-bar-hide', direction === -1);
  }

  #locationchange() {
    const path = `${location.pathname}${location.hash}${location.search}`;
    const active = this.querySelector(`.mdw-active`);
    if (active) active.classList.remove('mdw-active');
    const match = this.querySelector(`[href="${path}"]`);
    if (match) match.classList.add('mdw-active');
  }
}

customElements.define('mdw-navigation-bar', MDWNavigationBarElement);
