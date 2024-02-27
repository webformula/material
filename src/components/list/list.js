import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './list.css' assert { type: 'css' };

// TODO initial animation
class WFCListElement extends HTMLComponentElement {
  static tag = 'wfc-list';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = styles;

  constructor() {
    super();

    this.role = 'list';
    this.render();
  }

  template() {
    return /*html*/`
      <slot></slot>
    `;
  }


  static get observedAttributesExtended() {
    return [
      ['value', 'string']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }


  get value() {
    return [...this.querySelectorAll('wfc-list-item')]
      .filter(e => e.selected)
      .map(e => e.value || e.getAttribute('id'))
      .join(',');
  }
  set value(value) {
    const valueArray = value.split(',');
    [...this.querySelectorAll('wfc-list-item')]
      .forEach(item => item.selected = valueArray.includes(item.value));
  }

  get values() {
    return [...this.querySelectorAll('wfc-list-item')]
      .filter(e => e.selected)
      .map(e => e.value || e.getAttribute('id'));
  }
  set values(value) {
    [...this.querySelectorAll('wfc-list-item')]
      .forEach(item => item.selected = value.includes(item.value));
  }
}
customElements.define(WFCListElement.tag, WFCListElement);
