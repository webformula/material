import MDWSurfaceElement from '../surface/component.js';
import styles from './component.css' assert { type: 'css' };

// TODO rich tooltip

customElements.define('mdw-tooltip', class MDWTooltipElement extends MDWSurfaceElement {
  static styleSheets = styles;

  constructor() {
    super();

    this.role = 'tooltip';
    this.allowClose = true;
    this.fixed = true;
  }

  connectedCallback() {
    super.connectedCallback();
    this.positionMouse = true;
  }
});
