import HTMLElementExtended from '../HTMLElementExtended.js';
import util from '../../core/util.js';


// TODO add shrink for medium and large

customElements.define('mdw-top-app-bar', class MDWTopAppBarElement extends HTMLElementExtended {
  #autoHide = this.classList.contains('mdw-auto-hide');
  #shrink = !this.#autoHide && this.classList.contains('mdw-auto-shrink');
  #height;
  #scrollTrack_bound = this.#scrollTrack.bind(this);


  constructor() {
    super();
  }

  connectedCallback() {
    if (this.#autoHide) this.#height = this.offsetHeight;
    else if (this.#shrink && (this.classList.contains('mdw-medium') || this.classList.contains('mdw-large'))) {
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
    // for color change
    if (!this.#autoHide && !this.#shrink) {
      this.classList.toggle('mdw-scrolled', isScrolled);
      return;
    }

    // prevent style changes if not moving
    const position = -parseInt(this.style.getPropertyValue('--mdw-top-app-bar-scroll-position').replace('px', '') || 0);

    // adjust scroll check based on header position for scrolled
    this.classList.toggle('mdw-scrolled', scrollTop - Math.max(0, position + distance) > 0);

    if (direction === 1 && position === 0) return;
    if (direction === -1 && position === this.#height) return;

    // move with scroll
    let value = position + distance;
    if (value > this.#height) value = this.#height;
    if (value < 0) value = 0;
    this.style.setProperty('--mdw-top-app-bar-scroll-position', `${-value}px`);
  }
});
