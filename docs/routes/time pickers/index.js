import { Component } from '@webformula/core';
import htmlTemplate from './page.html';
import { wfcDate } from '@webformula/material/services';

export default class extends Component {
  static pageTitle = 'Time pickers';
  static htmlTemplate = htmlTemplate;

  constructor() {
    super();
  }

  get min() {
    return wfcDate.format(wfcDate.addToDateByParts(new Date(), { day: -10 }), 'YYYY-MM-dd');
  }
  get max() {
    return wfcDate.format(wfcDate.addToDateByParts(new Date(), { day: 10 }), 'YYYY-MM-dd');
  }
}
