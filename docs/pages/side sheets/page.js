import { Page } from '@webformula/core';
import html from './page.html';

export default class extends Page {
  static pageTitle = 'Side sheets';

  constructor() {
    super();
  }

  template() {
    return this.renderTemplateString(html);
  }
}
