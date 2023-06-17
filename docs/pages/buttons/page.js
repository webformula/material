import { Component } from '@webformula/core';
import html from './page.html';
import '@webformula/material/components/button';

export default class extends Component {
  static title = 'Buttons';
  static html = html;

  constructor() {
    super();
  }
}
