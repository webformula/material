import { Component } from '@webformula/core';
import html from './page.html';

export default class extends Component {
  static pageTitle = 'Home';
  static html = html;

  constructor() {
    super();
  }
}
