import { Page } from '@webformula/core';
import html from './page.html';

export default new class extends Page {
  pageTitle = 'Tabs';

  constructor() {
    super();
  }

  template() {
    return this.renderTemplateString(html);
  }
}
