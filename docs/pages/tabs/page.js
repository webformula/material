import { Component } from '@webformula/core';
import html from './page.html';
import '@webformula/material/components/tab';

export default class extends Component {
  static title = 'Tabs';
  static html = html;

  constructor() {
    super();
  }
}
