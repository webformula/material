import { Component } from '@webformula/core';
import html from './page.html';
import '@webformula/material/components/menu';

export default class extends Component {
  static title = 'Menus';
  static html = html;

  constructor() {
    super();
  }
}
