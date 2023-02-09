import { Page } from '@webformula/core';
import html from './page.html';

export default new class extends Page {
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
