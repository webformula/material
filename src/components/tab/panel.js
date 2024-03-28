import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './panel.css' assert { type: 'css' };


class WFCTabPanelElement extends HTMLComponentElement {
  static tag = 'wfc-tab-panel';
  static useShadowRoot = true;
  static styleSheets = styles;
  static useTemplate = true;

  constructor() {
    super();

    this.render();
  }

  template() {
    return /*html*/`
      <slot></slot>
    `;
  }
}
customElements.define(WFCTabPanelElement.tag, WFCTabPanelElement);
