import { Component } from '@webformula/core';
import html from './page.html';

export default class extends Component {
  static pageTitle = 'Cards';
  static html = html;
  
  constructor() {
    super();

    this.cardArray = [...new Array(6).keys()].map((_, i) => ({ height: i % 4 === 0 ? '400px' : ''}));
  }

  onSwipeAction(element) {
    console.log('checked', element.hasAttribute('checked'));
  }
}
