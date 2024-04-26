import { Component } from '@webformula/core';
import htmlTemplate from './page.html';

export default class extends Component {
  static pageTitle = 'Bottom sheets';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
