import { Page } from '@webformula/core/client';
import html from './page.html';

export default class extends Page {
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
