import { Page } from '@webformula/core/client';
import html from './page.html';
import { mdwDate } from '@webformula/material';

export default class extends Page {
  static pageTitle = 'Date pickers';
  static html = html;

  constructor() {
    super();
  }

  get min() {
    return mdwDate.format(mdwDate.addToDateByParts(new Date(), { day: -10 }), 'YYYY-MM-dd');
  }
  get max() {
    return mdwDate.format(mdwDate.addToDateByParts(new Date(), { day: 10 }), 'YYYY-MM-dd');
  }
}
