import { Component } from '@webformula/core';
import html from './page.html';
import { mdwDate } from '@webformula/material';

export default class extends Component {
  static title = 'Date pickers';
  static html = html;

  constructor() {
    super();
  }

  get min() {
    return mdwDate.format(mdwDate.addToDateByParts(new Date(), { day: -10 }), 'YYYY-MM-dd');
  }
  get max() {
    return mdwDate.format(mdwDate.addToDateByParts(new Date(), { day: 10 }), 'YYYY-MM-dd');
  }
}
