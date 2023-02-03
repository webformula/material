import { Page } from '@webformula/pax-core';
import html from './page.html';

export default new class extends Page {
  constructor() {
    super();
  }

  template() {
    return this.renderTemplateString(html);
  }

  toggleLabel() {
    document.querySelector('#hide-label').classList.toggle('mdw-hide-label');
  }
}
