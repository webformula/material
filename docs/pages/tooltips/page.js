import { Component } from '@webformula/core';
import html from './page.html';
import '@webformula/material/components/tooltip';

export default class extends Component {
  static title = 'Tooltips';
  static html = html;

  constructor() {
    super();
  }
}
