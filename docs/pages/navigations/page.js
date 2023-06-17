import { Component } from '@webformula/core';
import html from './page.html';
import '@webformula/material/components/navigation';

export default class extends Component {
  static title = 'Navigations';
  static html = html;

  constructor() {
    super();
  }
}
