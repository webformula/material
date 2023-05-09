import { Page } from '@webformula/core';
import html from './page.html';

export default class extends Page {
  static pageTitle = 'Forms';

  constructor() {
    super();
  }

  template() {
    return this.renderTemplateString(html);
  }

  submit(form) {
    const formData = new FormData(form);
    console.log([...formData.entries()])
  }
}
