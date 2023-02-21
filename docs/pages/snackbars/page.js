import { Page } from '@webformula/core';
import { mdwSnackbar } from '@webformula/material';
import html from './page.html';

export default new class extends Page {
  pageTitle = 'Snackbars';

  constructor() {
    super();
  }

  template() {
    return this.renderTemplateString(html);
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
