import MDWSurfaceElement from '../surface/component.js';
import styles from './component.css' assert { type: 'css' };

// TODO rich tooltip

class MDWTooltipElement extends MDWSurfaceElement {
  static tag = 'mdw-tooltip';
  static styleSheets = styles;

  constructor() {
    super();

    this.role = 'tooltip';
    this.allowClose = true;
    this.fixed = true;
    this.ariaLabel = 'none';
  }

  connectedCallback() {
    super.connectedCallback();
    this.positionMouse = true;
  }
}
customElements.define(MDWTooltipElement.tag, MDWTooltipElement);
