import { Component } from '@webformula/core';
import htmlTemplate from './page.html';

export default class extends Component {
  static pageTitle = 'Forms';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }

  submit(form) {
    const formData = new FormData(form);
    console.log([...formData.entries()])
  }
}
