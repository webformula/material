import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import device from '../../core/device.js';

class MDWNavigationRailElement extends HTMLComponentElement {
  static tag = 'mdw-navigation-rail';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = styles;

  #locationchange_bound = this.#locationchange.bind(this);


  constructor() {
    super();

    this.role = 'navigation';
    this.render();
    document.body.classList.add('has-navigation-rail');
    this.#locationchange();
  }

  template() {
    return /*html*/`
      <div class="placeholder"></div>
      <div class="surface">
        <slot></slot>
      </div>
    `;
  }

  connectedCallback() {
    window.addEventListener('locationchange', this.#locationchange_bound);
  }

  disconnectedCallback() {
    window.removeEventListener('locationchange', this.#locationchange_bound);
  }


  #locationchange() {
    const path = `${location.pathname}${location.hash}${location.search}`;
    const current = this.querySelector('.current');
    if (current) current.classList.remove('current');
    const match = this.querySelector(`[href="${path}"]`);
    
    if (match) {
      match.classList.add('current');
      // if (match.parentElement.nodeName === 'MDW-ANCHOR-GROUP') {
      //   match.parentElement.classList.add('has-current');
      // }

      if (device.animationReady) {
        match.classList.add('animate');
        requestAnimationFrame(() => {
          match.classList.remove('animate');
        });
      }
    }
  }
}
customElements.define(MDWNavigationRailElement.tag, MDWNavigationRailElement);
