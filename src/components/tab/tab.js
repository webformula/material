import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './tab.css' assert { type: 'css' };


class WFCTabElement extends HTMLComponentElement {
  static tag = 'wfc-tab';
  static useShadowRoot = true;
  static styleSheets = styles;
  static useTemplate = true;

  #slotChange_bound = this.#slotChange.bind(this);


  constructor() {
    super();

    this.render();
  }

  get internalPosition() {
    return this.shadowRoot.querySelector('.container').getBoundingClientRect();;
  }

  template() {
    return /*html*/`
      <wfc-state-layer ripple></wfc-state-layer>
      <div class="container">
        <slot name="icon"></slot>
        <slot class="default-slot"></slot>
      </div>
    `;
  }

  connectedCallback() {
    this.shadowRoot.addEventListener('slotchange', this.#slotChange_bound);
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener('slotchange', this.#slotChange_bound);
  }
  

  #slotChange(event) {
    if (event.target.getAttribute('name') === 'icon' && event.target.assignedElements().length > 0) {
      this.shadowRoot.querySelector('.container').classList.add('has-icon');
    }
  }
}
customElements.define(WFCTabElement.tag, WFCTabElement);
