import { Component } from '@webformula/core';
import html from './page.html';
import '@webformula/material/components/bottom-sheet';

export default class extends Component {
  static title = 'Bottom sheets';
  static html = html;

  constructor() {
    super();
  }
}
