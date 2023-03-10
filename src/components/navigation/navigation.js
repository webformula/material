import HTMLElementExtended from '../HTMLElementExtended.js';
import './navigation.css';
import util from '../../core/util.js';
import device from '../../core/device.js';


customElements.define('mdw-navigation', class MDWNavigationElement extends HTMLElementExtended {
  #open = true;
  #rail = this.classList.contains('mdw-rail');
  #scrim;

  #locationchange_bound = this.#locationchange.bind(this);
  #scrimClick_bound = this.#scrimClick.bind(this);

  constructor() {
    super();

    this.classList.add('mdw-no-animation');
    document.body.classList.add('mdw-navigation-no-animation');
    if (device.isMobile) this.classList.add('mdw-hide');
    this.#open = !this.classList.contains('mdw-hide') && !this.classList.contains('mdw-state-rail');
    
    this.#handleState();

    if (this.classList.contains('mdw-rail')) {
      [...this.querySelectorAll('mdw-anchor')].forEach(anchor => {
        anchor.classList.add('mdw-rail');
        if (!device.isMobile) anchor.classList.toggle('mdw-state-rail', !this.#open);
      });
    }
  }

  // TODO make it so we do not need the non standard event
  connectedCallback() {
    this.setAttribute('role', 'navigation');
    // the nested components are not ready until next frame
    util.nextAnimationFrameAsync().then(() => {
      this.#locationchange();
    });
    window.addEventListener('locationchange', this.#locationchange_bound);

    util.nextAnimationFrameAsync().then(() => {
      this.classList.remove('mdw-no-animation');
      document.body.classList.remove('mdw-navigation-no-animation');
      const active = this.querySelector('mdw-anchor.mdw-active');
      if (active) {
        const bounds = active.getBoundingClientRect();
        if (bounds.bottom < this.scrollTop || bounds.top > this.offsetHeight - this.scrollTop) active.scrollIntoView();
      }
    });
  }

  get open() {
    return this.#open;
  }
  set open(value) {
    this.#open = !!value;

    if (!this.#rail || device.isMobile) {
      this.classList.toggle('mdw-hide', !this.#open);
      [...this.querySelectorAll('mdw-anchor')].forEach(anchor => anchor.classList.remove('mdw-state-rail'));
    } else {
      this.classList.toggle('mdw-state-rail', !this.#open);
      [...this.querySelectorAll('mdw-anchor')].forEach(anchor => anchor.classList.toggle('mdw-state-rail', !this.#open));
    }

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

    if (!this.open && !this.classList.contains('mdw-state-rail')) {
      const active = this.querySelector('mdw-anchor.mdw-active');
      if (active) active.scrollIntoView({ block: 'center' });
    }

    this.#handleState();

    this.dispatchEvent(new Event('change'));
  }

  toggle() {
    this.open = !this.open;
  }

  #scrimClick() {
    this.open = false;
  }

  #locationchange() {
    [...this.querySelectorAll('.mdw-active')].forEach(anchor => anchor.active = false);

    const fullUrl = location.href;
    const pathname = location.pathname;
    const [fullUrlNoSearch, searchParameters] = location.href.split('?');

    let matches = [...this.querySelectorAll(`mdw-anchor[href="${fullUrl}"]`)];
    if (matches.length === 0) matches = [...this.querySelectorAll(`mdw-anchor[href="${fullUrlNoSearch}"]`)];
    if (matches.length === 0) matches = [...this.querySelectorAll(`mdw-anchor[href="${pathname}"]`)];
    if (matches.length === 0) matches = [...this.querySelectorAll(`mdw-anchor[href="${pathname}?${searchParameters}"]`)];

    matches.forEach(anchor => anchor.active = true);

    if (device.isMobile) this.open = false;
  }

  #handleState() {
    document.body.classList.remove('mdw-navigation-state-hide');
    document.body.classList.remove('mdw-navigation-state-rail');
    document.body.classList.remove('mdw-navigation-state-modal');
    document.body.classList.remove('mdw-navigation-state-open');

    if (this.classList.contains('mdw-hide')) document.body.classList.add('mdw-navigation-state-hide');
    else if (this.classList.contains('mdw-state-rail')) document.body.classList.add('mdw-navigation-state-rail');
    else if (device.isMobile) document.body.classList.add('mdw-navigation-state-modal');
    else document.body.classList.add('mdw-navigation-state-open');
  }
});
