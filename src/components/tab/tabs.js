import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './tabs.css' assert { type: 'css' };


class WFCTabsElement extends HTMLComponentElement {
  static tag = 'wfc-tabs';
  static useShadowRoot = true;
  static styleSheets = styles;
  static useTemplate = true;

  #onClick_bound = this.#onClick.bind(this);

  constructor() {
    super();

    this.render();
  }


  get active() {
    const active = this.querySelector('wfc-tab.active') || this.querySelector('wfc-tab');
    return active && active.getAttribute('panel');
  }
  set active(value) {
    this.#updateActive(value);
  }
  

  template() {
    return /*html*/`
      <slot></slot>
      <div class="indicator"></div>
    `;
  }

  connectedCallback() {
    this.addEventListener('click', this.#onClick_bound);
    const active = this.querySelector('wfc-tab.active');
    if (!active) {
      const first = this.querySelector('wfc-tab');
      if (first) first.classList.add('active');
    }
    requestAnimationFrame(() => {
      this.#updateIndicator();
      this.#updatePanel();
    });
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#onClick_bound);
  }


  #updateIndicator() {
    const active = this.querySelector('wfc-tab.active');
    const internalBounds = active.internalPosition;
    const indicator = this.shadowRoot.querySelector('.indicator');
    const bounds = this.getBoundingClientRect();
    const left = internalBounds.left - bounds.left;
    const right = bounds.right - internalBounds.right;
    indicator.classList.toggle('left', left < parseInt(indicator.style.left || 0));
    indicator.style.left = `${left}px`;
    indicator.style.right = `${right}px`;
  }

  #onClick(event) {
    if (event.target.nodeName !== 'WFC-TAB') return;
    this.#updateActive(event.target.getAttribute('panel'));
  }

  #updateActive(id) {
    const next = this.querySelector(`[panel="${id}"]`);
    if (!next) return;
    
    const current = this.querySelector('wfc-tab.active');
    if (current) current.classList.remove('active');

    next.classList.add('active');

    this.#updateIndicator();
    this.#updatePanel();
  }
  
  #updatePanel() {
    const active = this.querySelector('wfc-tab.active');
    const panel = document.querySelector(`wfc-tab-panels#${this.getAttribute('panels')}`);
    if (panel) panel.active = active.getAttribute('panel');
  }
}
customElements.define(WFCTabsElement.tag, WFCTabsElement);
