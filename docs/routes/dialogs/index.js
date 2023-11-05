import { Component, i18nLanguage } from '@webformula/core';
import { mdwDialog } from '@webformula/material/services';
import html from './page.html';

export default class extends Component {
  static title = 'Dialogs';
  static html = html;

  constructor() {
    super();
  }

  async openSimple() {
    const answer = await mdwDialog.simple({
      headline: 'Question',
      message: 'Are you sure?',
      actionCancel: true
    });

    if (answer === 'confirm') console.log('User pressed ok');
    if (answer === 'cancel') console.log('User pressed cancel');
  }

  async openTemplate() {
    const value = await mdwDialog.template({
      template: `
      <div class="mdw-headline">Headline</div>
      <div class="mdw-content">Here is some content for the dialog.</div>
      <div class="mdw-actions">
        <mdw-button onclick="mdwDialog.close('response value')">Close</mdw-button>
      </div>
      `
    });
    console.log(value);
  }
}
