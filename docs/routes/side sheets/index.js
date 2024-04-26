import { Component } from '@webformula/core';
import htmlTemplate from './page.html';

export default class extends Component {
  static pageTitle = 'Side sheets';
  static htmlTemplate = htmlTemplate;

  oneOpen = true;
  twoOpen = false;
  threeOpen = false;

  constructor() {
    super();
  }
}
