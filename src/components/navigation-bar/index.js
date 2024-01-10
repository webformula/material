import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import device from '../../core/device.js';
import util from '../../core/util.js';

customElements.define('mdw-navigation-bar', class MDWNavigationBarElement extends HTMLComponentElement {
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = styles;

  #autoHide = false;
  #scrollDirectionChange_bound = this.#scrollDirectionChange.bind(this);
  #locationchange_bound = this.#locationchange.bind(this);


  constructor() {
    super();

    this.role = 'navigation';
    this.render();
    this.#autoHide = this.classList.contains('auto-hide');
    document.body.classList.add('has-navigation-bar');
    if (this.#autoHide) document.body.classList.add('navigation-bar-auto-hide');
    this.#locationchange();
  }

  template() {
    return /*html*/`
        <slot></slot>
    `;
  }

  connectedCallback() {
    window.addEventListener('locationchange', this.#locationchange_bound);
    if (this.#autoHide) util.trackScrollDirectionChange(this.#scrollDirectionChange_bound);
  }

  disconnectedCallback() {
    window.removeEventListener('locationchange', this.#locationchange_bound);
    if (this.#autoHide) util.untrackScrollDirectionChange(this.#scrollDirectionChange_bound);
  }

  #scrollDirectionChange(direction) {
    this.classList.toggle('hide', direction === -1);
    document.body.classList.toggle('navigation-bar-hide', direction === -1);
  }

  #locationchange() {
    const path = `${location.pathname}${location.hash}${location.search}`;
    const current = this.querySelector('.current');
    if (current) current.classList.remove('current');
    const match = this.querySelector(`[href="${path}"]`);

    if (match) {
      match.classList.add('current');

      if (device.animationReady) {
        match.classList.add('animate');
        requestAnimationFrame(() => {
          match.classList.remove('animate');
        });
      }
    }
  }
});
