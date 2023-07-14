import HTMLElementExtended from '../HTMLElementExtended.js';
import device from '../../core/device.js';

customElements.define('mdw-navigation', class MDWNavigationElement extends HTMLElementExtended {
  #scrim;
  #open = device.state === 'expanded';
  #locationchange_bound = this.#locationchange.bind(this);
  #scrimClick_bound = this.#scrimClick.bind(this);

  constructor() {
    super();
    document.body.classList.add('mdw-has-navigation');
    this.#setState();
  }

  async connectedCallback() {
    this.setAttribute('role', 'navigation');
    this.#locationchange();
    window.addEventListener('locationchange', this.#locationchange_bound);
    const active = this.querySelector('mdw-anchor.mdw-active');
    if (active) {
      const parent = active.parentNode;
      if (parent.nodeName === 'MDW-NAVIGATION-GROUP') requestAnimationFrame(() => parent.open = true);
      const bounds = active.getBoundingClientRect();
      if (bounds.bottom < this.scrollTop || bounds.top > this.offsetHeight - this.scrollTop) active.scrollIntoView({ behavior: 'instant' });
    }
    window.addEventListener('mdwwindowstate', ({ detail }) => {
      this.open = detail.state === 'expanded';
    });
  }

  get open() {
    return this.#open;
  }
  set open(value) {
    this.#open = !!value;
    this.#setState();

    // modal
    if (this.#open && device.state !== 'expanded') {
      if (!this.#scrim) this.#scrim = document.createElement('mdw-scrim');
      this.insertAdjacentElement('beforebegin', this.#scrim);
      this.#scrim.addEventListener('click', this.#scrimClick_bound);
    } else if (!this.#open && this.#scrim) {
      this.#scrim.removeEventListener('click', this.#scrimClick_bound);
      this.#scrim.remove();
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
    this.classList.toggle('mdw-hide', !this.#open);
    this.classList.toggle('mdw-show', this.#open);
    document.body.classList.toggle('mdw-navigation-state-hide', !this.#open);
    document.body.classList.toggle('mdw-navigation-state-show', this.#open);
  }

  #locationchange() {
    const path = `${location.pathname}${location.hash}${location.search}`;
    const active = this.querySelector(`mdw-anchor.mdw-active`);
    if (active) active.classList.remove('mdw-active');
    const match = this.querySelector(`mdw-anchor[href="${path}"]`);
    if (match) match.classList.add('mdw-active');
    setTimeout(() => {
      if (device.state !== 'expanded') this.open = false;
    }, 100);
  }
});
