import HTMLComponentElement from '../HTMLComponentElement.js';
import util from '../../core/util.js';

/* TODO refactor */

class WFCTopAppBarElement extends HTMLComponentElement {
  static tag = 'wfc-top-app-bar';
  #sticky = this.classList.contains('sticky');
  #compress = this.classList.contains('compress');
  #height;
  #scrollTrack_bound = this.#scrollTrack.bind(this);


  constructor() {
    super();
  }

  connectedCallback() {
    const isMedium = this.classList.contains('medium');
    const isLarge = this.classList.contains('large');
    document.body.classList.add('has-top-app-bar');
    if (isMedium) document.body.classList.add('top-app-bar-medium');
    if (isLarge) document.body.classList.add('top-app-bar-large');
    if (this.#compress && (isMedium || isLarge)) {
      this.#height = this.offsetHeight - 64;
    }

    // prevent layout calculation during script evaluation
    requestAnimationFrame(() => {
      util.trackPageScroll(this.#scrollTrack_bound);
    });
  }

  disconnectedCallback() {
    util.untrackPageScroll(this.#scrollTrack_bound);
  }

  #scrollTrack({ isScrolled, direction, distance, scrollTop }) {
    // prevent style changes if not moving
    const position = -parseInt(this.style.getPropertyValue('--wfc-top-app-bar-scroll-position').replace('px', '') || 0);

    // adjust scroll check based on header position for scrolled
    if (this.#compress) this.classList.toggle('scrolled', scrollTop - Math.max(0, position + distance) > 0);
    else if (this.#sticky) this.classList.toggle('scrolled', isScrolled);

    if (direction === 1 && position === 0) return;
    if (direction === -1 && position === this.#height) return;

    // move with scroll
    let value = position + distance;
    if (value > this.#height) value = this.#height;
    if (value < 0) value = 0;
    this.style.setProperty('--wfc-top-app-bar-scroll-position', `${-value}px`);
  }
}

customElements.define(WFCTopAppBarElement.tag, WFCTopAppBarElement);
