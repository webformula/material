import MDWSideSheetElement from '../side-sheet';
import device from '../../core/device.js';

customElements.define('mdw-navigation', class MDWNavigationElement extends MDWSideSheetElement {
  #locationchange_bound = this.#locationchange.bind(this);

  constructor() {
    super();
    this.classList.add('mdw-left');
    this.clickOutsideClose = true;
    this.#setState();
  }

  connectedCallback() {
    super.connectedCallback();
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

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  set open(value) {
    super.open = value;
    this.#setState();
    this.dispatchEvent(new Event('change'));
  }

  toggle() {
    this.open = !this.open;
  }

  #setState() {
    document.body.classList.toggle('mdw-navigation-state-hide', !this.open);
    document.body.classList.toggle('mdw-navigation-state-show', this.open);
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
