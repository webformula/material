import HTMLElementExtended from '../HTMLElementExtended.js';
import util from '../../core/util.js';


customElements.define('mdw-top-app-bar', class MDWTopAppBarElement extends HTMLElementExtended {
  #sticky = this.classList.contains('mdw-sticky');
  #compress = this.classList.contains('mdw-compress');
  #height;
  #scrollTrack_bound = this.#scrollTrack.bind(this);


  constructor() {
    super();
  }

  connectedCallback() {
    if (this.#compress && (this.classList.contains('mdw-medium') || this.classList.contains('mdw-large'))) {
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
    const position = -parseInt(this.style.getPropertyValue('--mdw-top-app-bar-scroll-position').replace('px', '') || 0);

    // adjust scroll check based on header position for scrolled
    if (this.#compress) this.classList.toggle('mdw-scrolled', scrollTop - Math.max(0, position + distance) > 0);
    else if (this.#sticky) this.classList.toggle('mdw-scrolled', isScrolled);

    if (direction === 1 && position === 0) return;
    if (direction === -1 && position === this.#height) return;

    // move with scroll
    let value = position + distance;
    if (value > this.#height) value = this.#height;
    if (value < 0) value = 0;
    this.style.setProperty('--mdw-top-app-bar-scroll-position', `${-value}px`);
  }
});
