import { Page } from '@webformula/pax-core';
import html from './page.html';

export default new class extends Page {
  constructor() {
    super();
  }

  template() {
    return this.renderTemplateString(html);
  }

  afterRender() {
    document.querySelector('#autocomplete-textfield').autocomplete = 'autocomplete';
    document.querySelector('#require-custom').setCustomValidity('Custom error message');
  }
}
