import { Component } from '@webformula/core';
import html from './page.html';

export default class extends Component {
  static title = 'FABs';
  static html = html;

  constructor() {
    super();
  }

  toggleLabel() {
    document.querySelector('#hide-label').classList.toggle('mdw-hide-label');
  }
}
