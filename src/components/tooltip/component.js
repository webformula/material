import HTMLElementExtended from '../HTMLElementExtended.js';
import util from '../../core/util.js';

customElements.define('mdw-tooltip', class MDWTooltipElement extends HTMLElementExtended {
  #onScroll_bound = util.rafThrottle(this.#onScroll.bind(this));

  constructor() {
    super();
  }

  get #isMain() {
    return this.classList.contains('mdw-main-tooltip');
  }

  connectedCallback() {
    this.setAttribute('role', 'tooltip');
    if (!this.#isMain) {
      this.parentElement.setAttribute('tooltip', '__internal');
    }
  }

  disconnectedCallback() {
    if (!this.#isMain) util.untrackPageScroll(this.#onScroll_bound);
  }

  show(target, mouseX) {
    const bounds = target.getBoundingClientRect();

    const marginBottom = parseInt(getComputedStyle(target).marginBottom || 0);
    const { clientHeight } = document.documentElement;
    let top = bounds.y + bounds.height - marginBottom + 4;
    if (top + 28 > clientHeight) top -= 56;
    this.style.top = `${top}px`;

    if (mouseX) {
      this.style.left = `${mouseX + 8}px`;
    } else {
      this.style.left = `${bounds.x + (bounds.width / 2)}px`;
    }

    if (!this.#isMain) util.trackPageScroll(this.#onScroll_bound);
    this.classList.add('mdw-show');
  }

  hide() {
    this.classList.remove('mdw-show');
    if (!this.#isMain) util.untrackPageScroll(this.#onScroll_bound);
  }

  #onScroll({ distance }) {
    this.style.top = `${parseInt(this.style.top.replace('px', '')) - distance}px`;
  }
});
