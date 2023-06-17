import { Component } from '@webformula/core';
import html from './page.html';
import '@webformula/material/components/segmented-button';

export default class extends Component {
  static title = 'Segmented buttons';
  static html = html;

  constructor() {
    super();
  }
}
