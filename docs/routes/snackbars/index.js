import { Component } from '@webformula/core';
import { wfcSnackbar } from '@webformula/material/services';
import html from './page.html';

export default class extends Component {
  static pageTitle = 'Snackbars';
  static html = html;

  constructor() {
    super();
  }

  basic() {
    wfcSnackbar.show({
      message: 'Message goes here'
    });
  }

  async action() {
    await wfcSnackbar.show({
      message: 'Message goes here',
      action: true,
      actionLabel: 'Done'
    });
    console.log('Snackbar dismissed');
  }

  async noClose() {
    await wfcSnackbar.show({
      message: 'Message goes here',
      closeButton: false,
      ms: 6000
    });
  }
}
