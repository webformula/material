import { Component } from '@webformula/core';
import html from './page.html';
import '@webformula/material/components/slider';

export default class extends Component {
  static title = 'Sliders';
  static html = html;

  constructor() {
    super();
  }
}
