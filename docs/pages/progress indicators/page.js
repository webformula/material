import { Component } from '@webformula/core';
import html from './page.html';
import '@webformula/material/components/progress-linear';
import '@webformula/material/components/progress-circular';

export default class extends Component {
  static title = 'Progress indicators';
  static html = html;

  constructor() {
    super();
  }
}
