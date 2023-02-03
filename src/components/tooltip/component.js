import HTMLElementExtended from '../HTMLElementExtended.js';
import './component.css';

customElements.define('mdw-tooltip', class MDWTooltipElement extends HTMLElementExtended {
  constructor() {
    super();
  }

  connectedCallback() {
    this.setAttribute('role', 'tooltip');
  }

  show(target, mouseX) {
    const bounds = target.getBoundingClientRect();
    const marginBottom = parseInt(getComputedStyle(target).marginBottom || 0);
    this.style.top = `${bounds.y + bounds.height - marginBottom + 4}px`;

    if (mouseX) {
      this.style.left = `${mouseX + 8}px`;
    } else {
      this.style.left = `${bounds.x + (bounds.width / 2)}px`;
    }
    this.classList.add('mdw-show');
  }

  hide() {
    this.classList.remove('mdw-show');
  }
});
