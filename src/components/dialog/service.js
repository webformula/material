import util from '../../core/util.js';

const mdwDialog = new class mdwDialog {
  #dialogStack = [];
  #idCounter = 0;

  async simple(params = {
    headline: '',
    icon: '',
    message: '',
    noScrim: false,
    allowClose: false,
    preventNavigation: false,
    actionConfirm: true,
    actionConfirmLabel: 'OK',
    actionCancel: false,
    actionCancelLabel: 'Cancel'
  }) {
    const actionConfirm = params.actionConfirm === undefined ? true : params.actionConfirm;
    const actionCancel = params.actionCancel || false;
    const id = `mdw-dialog-${this.#idCounter++}`;
    document.body.insertAdjacentHTML('beforeend', `
      <mdw-dialog id="${id}" aria-label="[dialog] ${params.message}">
        ${!params.icon ? '' : `<mdw-icon slot="icon">${params.icon}</mdw-icon>`}
        ${!params.headline ? '' : `<div slot="headline">${params.headline}</div>`}
        <div slot="content">${params.message || ''}</div>
        ${actionConfirm === true ? `<mdw-button slot="actions" onclick="mdwDialog.close('confirm')">${params.actionConfirmLabel || 'OK'}</mdw-button>` : ''}
        ${actionCancel === true ? `<mdw-button slot="actions" onclick="mdwDialog.close('cancel')">${params.actionCancelLabel || 'Cancel'}</mdw-button>` : ''}
      </mdw-dialog>
    `);
    const element = document.body.querySelector(`#${id}`);
    element.removeOnClose = true;
    element.allowClose = params.allowClose;
    element.noScrim = params.noScrim === undefined ? false : params.noScrim;
    element.preventNavigation = !!params.preventNavigation;
    await util.nextAnimationFrameAsync();
    return element.show();
  }


  async template(params = {
    template,
    scrim: true,
    allowClose: false,
    preventNavigation: true
  }) {
    const id = `mdw-dialog-${this.#idCounter++}`;
    document.body.insertAdjacentHTML('beforeend', `
      <mdw-dialog id="${id}">
        ${params.template}
      </mdw-dialog>
    `);
    const element = document.body.querySelector(`#${id}`);
    element.removeOnClose = true;
    element.allowClose = params.allowClose;
    element.scrim = params.scrim === undefined ? true : params.scrim;
    element.preventNavigation = !!params.preventNavigation;
    await util.nextAnimationFrameAsync();
    return element.show();
  }


  async close(returnValue) {
    const currentDialog = this.#dialogStack.pop();
    if (!currentDialog) throw Error('No dialog to close');
    return currentDialog.close(returnValue);
  }



  track(dialogElement) {
    if (dialogElement.nodeName !== 'MDW-DIALOG') throw Error('Can only track mdw-dialog elements');
    this.#dialogStack.push(dialogElement);
  }

  untrack(dialogElement) {
    const dialog = this.#dialogStack.find(({ element }) => element === dialogElement);
    if (!dialog) return;
    this.#dialogStack = this.#dialogStack.filter(({ element }) => element !== dialogElement);
  }
};

window.mdwDialog = mdwDialog;
export default mdwDialog;
