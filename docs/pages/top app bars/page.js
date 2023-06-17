import { Component } from '@webformula/core';
import html from './page.html';
import '@webformula/material/components/top-app-bar';

export default class extends Component {
  static title = 'Top app bars';
  static html = html;

  constructor() {
    super();
  }
}
