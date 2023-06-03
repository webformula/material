import { Page } from '@webformula/core/client';
import html from './page.html';

export default class extends Page {
  static pageTitle = 'FABs';
  static html = html;

  constructor() {
    super();
  }

  toggleLabel() {
    document.querySelector('#hide-label').classList.toggle('mdw-hide-label');
  }
}
