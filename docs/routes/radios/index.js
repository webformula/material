import { Component } from '@webformula/core';
import htmlTemplate from './page.html';

export default class extends Component {
  static pageTitle = 'Radios';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }
}
