import { Component } from '@webformula/core';
import html from './page.html';
import '@webformula/material/components/switch';

export default class extends Component {
  static title = 'Switches';
  static html = html;

  constructor() {
    super();
  }
}
