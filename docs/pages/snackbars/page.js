import { Page } from '@webformula/core';
import { MDWSnackbar } from '@webformula/pax-components';
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
    MDWSnackbar.show({
      message: 'Message goes here'
    });
  }

  async action() {
    await MDWSnackbar.show({
      message: 'Message goes here',
      action: true,
      actionLabel: 'Done'
    });
    console.log('Snackbar dismissed');
  }

  async noClose() {
    await MDWSnackbar.show({
      message: 'Message goes here',
      closeButton: false,
      ms: 6000
    });
  }
}
