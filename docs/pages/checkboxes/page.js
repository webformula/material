import { Component } from '@webformula/core';
import html from './page.html';
import '@webformula/material/components/checkbox';

export default class extends Component {
  static title = 'Checkboxes';
  static html = html;

  constructor() {
    super();
  }
}
