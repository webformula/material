import { Component } from '@webformula/core';
import html from './page.html';
import '@webformula/material/components/card';

export default class extends Component {
  static title = 'Cards';
  static html = html;
  
  constructor() {
    super();

    this.cardArray = [...new Array(6).keys()].map((_, i) => ({ height: i % 4 === 0 ? '488px' : '244px'}));
  }

  onSwipeAction(element) {
    console.log('checked', element.hasAttribute('checked'));
  }
}
