import MDWSideSheetElement from '../side-sheet';
import device from '../../core/device.js';

customElements.define('mdw-navigation', class MDWNavigationElement extends MDWSideSheetElement {
  #locationchange_bound = this.#locationchange.bind(this);

  constructor() {
    super();
    document.body.classList.add('mdw-has-navigation');
    this.classList.add('mdw-left');
    this.clickOutsideClose = true;
    this.#setState();
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'navigation');
    this.placeholder.style.setProperty('--mdw-side-sheet-width', 'var(--mdw-navigation-drawer-width)');
    this.#locationchange();
    window.addEventListener('locationchange', this.#locationchange_bound);
    window.addEventListener('mdwwindowstate', ({ detail }) => {
      this.open = detail.state === 'expanded';
    });

    // prevent layout calculation during script evaluation
    requestAnimationFrame(() => {
      const active = this.querySelector('mdw-anchor.mdw-active');
      if (active) {
        const parent = active.parentNode;
        if (parent.nodeName === 'MDW-NAVIGATION-GROUP') requestAnimationFrame(() => parent.open = true);
        const bounds = active.getBoundingClientRect();
        if (bounds.bottom < this.scrollTop || bounds.top > this.offsetHeight - this.scrollTop) active.scrollIntoView({ behavior: 'instant' });
      }
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

  get open() {
    return super.open;
  }

  toggle() {
    this.open = !this.open;
  }

  #setState() {
    document.body.classList.toggle('mdw-navigation-state-hide', !super.open);
    document.body.classList.toggle('mdw-navigation-state-show', super.open);
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
