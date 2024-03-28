import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './panels.css' assert { type: 'css' };


class WFCTabPanelsElement extends HTMLComponentElement {
  static tag = 'wfc-tab-panels';
  static useShadowRoot = true;
  static styleSheets = styles;
  static useTemplate = true;

  constructor() {
    super();

    this.render();
  }

  get active() {
    const active = this.querySelector('wfc-tab-panel.active') || this.querySelector('wfc-tab-panel');
    return active && active.getAttribute('panel');
  }
  set active(value) {
    this.#updateActive(value);
  }

  template() {
    return /*html*/`
      <slot></slot>
    `;
  }

  #updateActive(id) {
    const next = this.querySelector(`[panel="${id}"]`);
    if (!next) return;

    const current = this.querySelector('wfc-tab-panel.active');
    if (current) current.classList.remove('active');
    this.scrollTop = 0;
    next.classList.add('active');

    if (current && next && current !== next) {
      const panels = [...this.querySelectorAll('wfc-tab-panel')];
      const isLeft = panels.indexOf(current) > panels.indexOf(next);
      current.classList.remove('animation');
      next.classList.remove('animation');
      current.style.left = '0';
      next.style.left = isLeft ? '-100%' : '100%';
      requestAnimationFrame(() => {
        next.classList.add('animation');
        current.classList.add('animation');
        next.style.left = '0';
        current.style.left = isLeft ? '100%' : '-100%';
      });
    }

    // TODO animate
  }
}
customElements.define(WFCTabPanelsElement.tag, WFCTabPanelsElement);
