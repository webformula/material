import WFCSurfaceElement from '../surface/component.js';
import styles from './component.css' assert { type: 'css' };

// TODO rich tooltip

class WFCTooltipElement extends WFCSurfaceElement {
  static tag = 'wfc-tooltip';
  static styleSheets = styles;

  constructor() {
    super();

    this.role = 'tooltip';
    this.allowClose = true;
    this.fixed = true;
    this.ariaLabel = 'none';
    this.animation = 'opacity';
  }

  connectedCallback() {
    super.connectedCallback();
    this.positionMouseOnly = true;
  }
}
customElements.define(WFCTooltipElement.tag, WFCTooltipElement);
