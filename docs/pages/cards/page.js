import { Page } from '@webformula/core/client';
import html from './page.html';

export default class extends Page {
  static pageTitle = 'Cards';
  static html = html;
  
  constructor() {
    super();

    this.cardArray = [...new Array(6).keys()].map((_, i) => ({ height: i % 4 === 0 ? '488px' : '244px'}));
  }

  onSwipeAction(element) {
    console.log('checked', element.hasAttribute('checked'));
  }
}
