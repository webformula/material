import { Component } from '@webformula/core';
import html from './page.html';

export default class extends Component {
  static title = 'Side sheets';
  static html = html;

  constructor() {
    super();
  }

  positionLocal(isLeft = false) {
    const element = document.querySelector('mdw-side-sheet#one');
    element.classList.toggle('mdw-left', isLeft);
    if (isLeft) {
      document.querySelector('#local-container').insertAdjacentElement('afterbegin', element);
    } else document.querySelector('#local-container').insertAdjacentElement('beforeend', element);
  }
}
