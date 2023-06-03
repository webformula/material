import { Page } from '@webformula/core/client';
import html from './page.html';

export default class extends Page {
  static pageTitle = 'Side sheets';
  static html = html;

  constructor() {
    super();
  }
}
