import { Component } from '@webformula/core';
import html from './page.html';

export default class extends Component {
  static pageTitle = 'Lists';
  static html = html;

  constructor() {
    super();
  }

  afterRender() {
    document.querySelector('#swipe-actions').addEventListener('swipeactionstart', event => {
      event.target.remove();
    });
  }
}
