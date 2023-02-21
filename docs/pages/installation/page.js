import { Page } from '@webformula/core';
import html from './page.html';

export default new class extends Page {
  pageTitle = 'Installation';

  constructor() {
    super();
  }

  template() {
    return this.renderTemplateString(html);
  }
}
