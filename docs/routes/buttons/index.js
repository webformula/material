import { Component } from '@webformula/core';
import htmlTemplate from './page.html';

export default class extends Component {
  static pageTitle = 'Buttons';
  static htmlTemplate = htmlTemplate;
  colorRole = '';

  constructor() {
    super();
  }
}
