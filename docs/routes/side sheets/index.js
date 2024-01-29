import { Component } from '@webformula/core';
import html from './page.html';

export default class extends Component {
  static title = 'Side sheets';
  static html = html;

  oneOpen = true;
  twoOpen = false;
  threeOpen = false;

  constructor() {
    super();
  }
}
