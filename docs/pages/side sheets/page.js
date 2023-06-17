import { Component } from '@webformula/core';
import html from './page.html';
import '@webformula/material/components/side-sheet';

export default class extends Component {
  static title = 'Side sheets';
  static html = html;

  constructor() {
    super();
  }
}
