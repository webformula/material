import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './list.css' assert { type: 'css' };


class MDWListElement extends HTMLComponentElement {
  static tag = 'mdw-list';
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
    return [...this.querySelectorAll('mdw-list-item')]
      .filter(e => e.selected)
      .map(e => e.value || e.getAttribute('id'))
      .join(',');
  }
  set value(value) {
    const valueArray = value.split(',');
    [...this.querySelectorAll('mdw-list-item')]
      .forEach(item => item.selected = valueArray.includes(item.value));
  }

  get values() {
    return [...this.querySelectorAll('mdw-list-item')]
      .filter(e => e.selected)
      .map(e => e.value || e.getAttribute('id'));
  }
  set values(value) {
    [...this.querySelectorAll('mdw-list-item')]
      .forEach(item => item.selected = value.includes(item.value));
  }
}
customElements.define(MDWListElement.tag, MDWListElement);
