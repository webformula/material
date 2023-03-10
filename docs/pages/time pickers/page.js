import { Page } from '@webformula/core';
import html from './page.html';
import { mdwDate } from '@webformula/material';

export default new class extends Page {
  pageTitle = 'Time pickers';

  constructor() {
    super();
  }

  template() {
    return this.renderTemplateString(html);
  }

  get min() {
    return mdwDate.format(mdwDate.addToDateByParts(new Date(), { day: -10 }), 'YYYY-MM-dd');
  }
  get max() {
    return mdwDate.format(mdwDate.addToDateByParts(new Date(), { day: 10 }), 'YYYY-MM-dd');
  }
}
