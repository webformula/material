import { Page } from '@webformula/core';
import html from './page.html';

export default class extends Page {
  static pageTitle = 'Cards';
  
  constructor() {
    super();

    this.cardArray = [...new Array(6).keys()].map((_, i) => ({ height: i % 4 === 0 ? '488px' : '244px'}));
  }

  template() {
    return this.renderTemplateString(html);
  }

  onSwipeAction(element) {
    console.log('checked', element.hasAttribute('checked'));
  }
}
