import HTMLElementExtended from '../HTMLElementExtended.js';
import AnchorController from '../anchor/controller.js';

customElements.define('mdw-navigation-rail', class MDWNavigationElement extends HTMLElementExtended {
  #locationchange_bound = this.#locationchange.bind(this);

  constructor() {
    super();
    document.body.classList.add('mdw-has-navigation-rail');
  }

  async connectedCallback() {
    this.setAttribute('role', 'navigation');
    [...this.querySelectorAll('a')].forEach(element => new AnchorController(element));
    this.#locationchange();
    window.addEventListener('locationchange', this.#locationchange_bound);

    // prevent layout calculation during script evaluation
    requestAnimationFrame(() => {
      const active = this.querySelector('.mdw-active');
      if (active) {
        const bounds = active.getBoundingClientRect();
        if (bounds.bottom < this.scrollTop || bounds.top > this.offsetHeight - this.scrollTop) active.scrollIntoView({ behavior: 'instant' });
      }
    });
  }

  #locationchange() {
    const path = `${location.pathname}${location.hash}${location.search}`;
    const active = this.querySelector(`.mdw-active`);
    if (active) active.classList.remove('mdw-active');
    const match = this.querySelector(`[href="${path}"]`);
    if (match) match.classList.add('mdw-active');
  }
});
