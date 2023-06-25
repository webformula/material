import HTMLElementExtended from '../HTMLElementExtended.js';
import device from '../../core/device.js';

customElements.define('mdw-navigation', class MDWNavigationElement extends HTMLElementExtended {
  #scrim;
  #open = !device.isMobile;
  #locationchange_bound = this.#locationchange.bind(this);
  #scrimClick_bound = this.#scrimClick.bind(this);

  constructor() {
    super();
    document.body.classList.add('mdw-has-navigation');
    this.#setState();
  }

  async connectedCallback() {
    this.setAttribute('role', 'navigation');
    window.addEventListener('mdwwindowstate', ({ detail }) => {
      if (detail.isMobile && !detail.lastIsMobile) this.open = false;
      if (!detail.isMobile && detail.lastIsMobile) this.open = true;
    });
    this.#locationchange();
    window.addEventListener('locationchange', this.#locationchange_bound);
    const active = this.querySelector('mdw-anchor.mdw-active');
    if (active) {
      const bounds = active.getBoundingClientRect();
      if (bounds.bottom < this.scrollTop || bounds.top > this.offsetHeight - this.scrollTop) active.scrollIntoView({ behavior: 'instant' });
    }
  }

  get open() {
    return this.#open;
  }
  set open(value) {
    this.#open = !!value;
    this.#setState();

    if (device.isMobile) {
      if (this.#open) {
        if (!this.#scrim) this.#scrim = document.createElement('mdw-scrim');
        this.insertAdjacentElement('beforebegin', this.#scrim);
        this.#scrim.addEventListener('click', this.#scrimClick_bound);
      } else if (this.#scrim) {
        this.#scrim.removeEventListener('click', this.#scrimClick_bound);
        this.#scrim.remove();
      }
    }

    this.dispatchEvent(new Event('change'));
  }

  toggle() {
    this.open = !this.open;
  }

  #scrimClick() {
    this.open = false;
  }

  #setState() {
    this.classList.toggle('mdw-hide', !device.isMobile && !this.#open);
    this.classList.toggle('mdw-show', device.isMobile && this.#open);
    document.body.classList.toggle('mdw-navigation-modal', device.isMobile);
    document.body.classList.toggle('mdw-navigation-state-hide', !this.#open);
    document.body.classList.toggle('mdw-navigation-state-show', this.#open);
  }

  #locationchange() {
    const path = `${location.pathname}${location.hash}${location.search}`;
    const active = this.querySelector(`mdw-anchor.mdw-active`);
    if (active) active.classList.remove('mdw-active');
    const match = this.querySelector(`mdw-anchor[href="${path}"]`);
    if (match) match.classList.add('mdw-active');
  }
});
