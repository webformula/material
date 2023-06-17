import { Component } from '@webformula/core';
import html from './page.html';
import '@webformula/material/components/chip';

export default class extends Component {
  static title = 'Chips';
  static html = html;

  constructor() {
    super();
  }

  connectedCallback() {
    // document.querySelector('.mdw-type-input').addEventListener('change', event => {
    //   console.log(event.target.value);
    // });
  }
}
