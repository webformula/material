import { Component } from '@webformula/core';
import { wfcDialog } from '@webformula/material/services';
import html from './page.html';

export default class extends Component {
  static pageTitle = 'Dialogs';
  static html = html;

  allowClose = false;
  preventNavigation = true;

  constructor() {
    super();
  }

  async openSimple(allowClose = false, preventNavigation = true, icon) {
    const answer = await wfcDialog.simple({
      icon,
      headline: 'Question',
      message: 'Are you sure?',
      actionCancel: true,
      allowClose,
      preventNavigation
    });

    if (answer === 'confirm') console.log('User pressed ok');
    if (answer === 'cancel') console.log('User pressed cancel');
  }

  async openTemplate() {
    const value = await wfcDialog.template({
      template: `
      <div slot="headline">Headline</div>
      <div slot="content">Here is some content for the dialog.</div>
      <wfc-button slot="actions" onclick="wfcDialog.close('response value')">Close</wfc-button>
      `
    });
    console.log(value);
  }
}
