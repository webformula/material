import WFCSurfaceElement from '../surface/component.js';
import styles from './component.css' assert { type: 'css' };

class WFCTooltipElement extends WFCSurfaceElement {
  static tag = 'wfc-tooltip';
  static useShadowRoot = true;
  static useTemplate = true;
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

  template() {
    return /*html*/`
      <div class="surface">
        <div class="surface-content">
          <slot name="subhead"></slot>
          <slot class="default-slot"></slot>
          <slot name="actions"></slot>
        </div>
      </div>
    `;
  }
}
customElements.define(WFCTooltipElement.tag, WFCTooltipElement);
