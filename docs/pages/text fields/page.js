import { Component } from '@webformula/core';
import html from './page.html';

export default class extends Component {
  static title = 'Text fields';
  static html = html;

  constructor() {
    super();
  }

  afterRender() {
    document.querySelector('#autocomplete-textfield').autocomplete = 'autocomplete';
    document.querySelector('#require-custom').setCustomValidity('Custom error message');
  }
}
