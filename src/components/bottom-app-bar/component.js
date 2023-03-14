import HTMLElementExtended from '../HTMLElementExtended.js';
import './component.css';
import util from '../../core/util.js';
import Ripple from '../../core/Ripple.js';


// TODO accessability

export default class MDWBottomAppBarElement extends HTMLElementExtended {
  #rippleElements;
  #isHiding = false;
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

    util.trackPageScroll(this.#scrollTrack_bound);

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
    util.untrackPageScroll(this.#scrollTrack_bound);
  }

  hide() {
    if (this.#isHiding === true) return;
    this.#isHiding = true;
    this.classList.add('mdw-hide');
  }

  async show() {
    if (this.#isHiding === false) return;
    this.#isHiding = false;

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

  // TODO hide/show transition move at scroll speed
  #scrollTrack({ isScrolled, direction, distanceFromDirectionChange }) {
    // up
    if (direction === -1 && distanceFromDirectionChange > 150) this.hide();

    // down
    if (direction === 1 && distanceFromDirectionChange < -150) this.show();

    this.classList.toggle('mdw-scrolled', isScrolled);
  }

  #hashchange() {
    const secondaryByHash = this.querySelector(`mdw-bottom-app-bar-secondary[mdw-hash="${location.hash}"]`);
    if (secondaryByHash) this.showSecondary(secondaryByHash.getAttribute('id'));
    else this.showPrimary();
  }
}

customElements.define('mdw-bottom-app-bar', MDWBottomAppBarElement);
