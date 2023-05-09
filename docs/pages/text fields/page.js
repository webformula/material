import { Page } from '@webformula/core';
import html from './page.html';

export default class extends Page {
  static pageTitle = 'Text fields';

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
