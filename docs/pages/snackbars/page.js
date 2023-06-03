import { Page } from '@webformula/core/client';
import { mdwSnackbar } from '@webformula/material';
import html from './page.html';

export default class extends Page {
  static pageTitle = 'Snackbars';
  static html = html;

  constructor() {
    super();
  }

  basic() {
    mdwSnackbar.show({
      message: 'Message goes here'
    });
  }

  async action() {
    await mdwSnackbar.show({
      message: 'Message goes here',
      action: true,
      actionLabel: 'Done'
    });
    console.log('Snackbar dismissed');
  }

  async noClose() {
    await mdwSnackbar.show({
      message: 'Message goes here',
      closeButton: false,
      ms: 6000
    });
  }
}
