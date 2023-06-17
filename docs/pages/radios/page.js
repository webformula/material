import { Component } from '@webformula/core';
import html from './page.html';
import '@webformula/material/components/radio';

export default class extends Component {
  static title = 'Radios';
  static html = html;

  constructor() {
    super();
  }
}
