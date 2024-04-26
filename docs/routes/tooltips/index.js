import { Component } from '@webformula/core';
import htmlTemplate from './page.html';

export default class extends Component {
  static pageTitle = 'Tooltips';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
