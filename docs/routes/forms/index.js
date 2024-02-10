import { Component } from '@webformula/core';
import html from './page.html';

export default class extends Component {
  static pageTitle = 'Forms';
  static html = html;

  constructor() {
    super();
  }

  submit(form) {
    const formData = new FormData(form);
    console.log([...formData.entries()])
  }
}
