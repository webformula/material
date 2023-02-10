import { Page } from '@webformula/core';
import html from './page.html';

export default new class extends Page {
  pageTitle = 'Top app bars';

  constructor() {
    super();
  }

  template() {
    return this.renderTemplateString(html);
  }
}
