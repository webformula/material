import { Component } from '@webformula/core';
import html from './page.html';

export default class extends Component {
  static pageTitle = 'Buttons';
  static html = html;
  colorRole = '';

  constructor() {
    super();
  }
}
