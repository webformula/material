import { Component } from '@webformula/core';
import html from './page.html';
import '@webformula/material/components/fab';

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
