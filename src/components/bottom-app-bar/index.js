import HTMLElementExtended from '../HTMLElementExtended.js';
import util from '../../core/util.js';
import Ripple from '../../core/Ripple.js';
import styles from './component.css' assert { type: 'css' };
HTMLElementExtended.registerGlobalStyleSheet(styles);


export default class MDWBottomAppBarElement extends HTMLElementExtended {
  #rippleElements;
  #autoHide = this.classList.contains('mdw-auto-hide');
  #height = this.offsetHeight;
  #scrollTrack_bound = this.#scrollTrack.bind(this);
  #hashchange_bound = this.#hashchange.bind(this);

  constructor() {
    super();

    document.body.classList.add('mdw-has-bottom-app-bar');
    if (this.classList.contains('mdw-mobile-only')) document.body.classList.add('mdw-bottom-app-bar-mobile-only');
  }

  async connectedCallback() {
    this.#rippleElements = [...this.querySelectorAll('nav > a > .mdw-ripple')].map(element => new Ripple({
      element: element,
      triggerElement: element.parentNode
    }));

    if (this.#autoHide) util.trackPageScroll(this.#scrollTrack_bound);

    if (this.querySelector('mdw-bottom-app-bar-secondary[mdw-hash]')) {
      [...this.querySelectorAll('mdw-bottom-app-bar-secondary')].forEach(element => {
        const id = element.getAttribute('id');
        element.setAttribute('id', id || `bottom-app-bar-secondary-${util.uid()}`);
      })
      window.addEventListener('hashchange', this.#hashchange_bound);
      this.#hashchange();
    }
  }

  disconnectedCallback() {
    this.#rippleElements.forEach(r => r.destroy());
    if (this.#autoHide)  util.untrackPageScroll(this.#scrollTrack_bound);
  }

  async #show() {
    this.classList.add('mdw-show-animation-start');
    this.classList.remove('mdw-hide');
    await util.nextAnimationFrameAsync();
    this.classList.remove('mdw-show-animation-start');
  }

  async showPrimary() {
    const primary = this.querySelector('mdw-bottom-app-bar-primary');
    if (!primary) throw Error('Must contain primary element "mdw-bottom-app-bar-primary" to use secondary');
    if (!primary.classList.contains('mdw-hide')) return;

    const currentSecondary = this.querySelector('mdw-bottom-app-bar-secondary.mdw-show');
    if (currentSecondary) currentSecondary.classList.remove('mdw-show');

    primary.classList.remove('mdw-hide');
    primary.classList.add('mdw-show-animation-start');
    await util.nextAnimationFrameAsync();
    primary.classList.add('mdw-show');
    primary.classList.remove('mdw-show-animation-start');
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

    primary.classList.add('mdw-hide');
    primary.classList.remove('mdw-show');
    secondary.classList.add('mdw-show-animation-start');
    await util.nextAnimationFrameAsync();
    secondary.classList.add('mdw-show');
    secondary.classList.remove('mdw-show-animation-start');
  }

  #scrollTrack({ direction, distance, distanceFromDirectionChange, scrollTop }) {
    // prevent style changes if not moving
    const position = -parseInt(this.style.getPropertyValue('--mdw-bottom-app-bar-scroll-position').replace('px', '') || 0);

    // add 90 pixel buffer before raising the bar, but do not prevent raise not enough scroll pixels
    if (direction === 1 && (position === 0 || (distanceFromDirectionChange > -120 && scrollTop > this.#height))) return;
    if (direction === -1 && position === this.#height) return;

    // move with scroll
    let value = position + distance;
    if (value > this.#height) value = this.#height;
    if (value < 0) value = 0;
    this.style.setProperty('--mdw-bottom-app-bar-scroll-position', `${-value}px`);

    // animate icons in
    if (direction === 1 && position >= this.#height - 20 && value < this.#height - 20) this.#show();
  }

  #hashchange() {
    const secondaryByHash = this.querySelector(`mdw-bottom-app-bar-secondary[mdw-hash="${location.hash}"]`);
    if (secondaryByHash) this.showSecondary(secondaryByHash.getAttribute('id'));
    else this.showPrimary();
  }
}

customElements.define('mdw-bottom-app-bar', MDWBottomAppBarElement);
