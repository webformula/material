import { Component } from '@webformula/core';
import html from './page.html';
import '@webformula/material/components/bottom-app-bar';

export default class extends Component {
  static title = 'Bottom app bars';
  static html = html;
  
  constructor() {
    super();
  }
}
