import { Page } from '@webformula/core/client';
import html from './page.html';

export default class extends Page {
  static pageTitle = 'Chips';
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
