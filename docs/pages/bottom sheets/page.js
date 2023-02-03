import { Page } from '@webformula/pax-core';
import html from './page.html';

export default new class extends Page {
  pageTitle = 'Bottom sheets';

  constructor() {
    super();
  }

  template() {
    return this.renderTemplateString(html);
  }
}
