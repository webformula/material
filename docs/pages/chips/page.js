import { Page } from '@webformula/core';
import html from './page.html';

export default class extends Page {
  static pageTitle = 'Chips';

  constructor() {
    super();
  }

  template() {
    return this.renderTemplateString(html);
  }

  connectedCallback() {
    // document.querySelector('.mdw-type-input').addEventListener('change', event => {
    //   console.log(event.target.value);
    // });
  }
}
