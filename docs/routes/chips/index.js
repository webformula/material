import { Component } from '@webformula/core';
import html from './page.html';

export default class extends Component {
  static title = 'Chips';
  static html = html;

  constructor() {
    super();
  }

  updateValues() {
    document.querySelector('#update1').values = [
      {
        name: "one",
        label: 'One Updated',
        value: 'oneupdated',
        checked: false
      },

      {
        type: 'filter',
        name: "two",
        label: 'Two',
        value: 'two',
        checked: true
      }
    ];
  }
}
