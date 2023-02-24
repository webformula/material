import util from '../../core/util.js';


const MDWDialog = new class MDWDialog {
  #currentDialog;
  #currentDialogPromiseResolve;
  #onClose_bound = this.#onClose.bind(this);

  simple(params = {
    headline: '',
    message: '',
    scrim: true,
    clickScrimClose: false,
    actionConfirm: true,
    actionConfirmLabel: 'OK',
    actionCancel: false,
    actionCancelLabel: 'Cancel'
  }) {
    if (this.#currentDialog) throw Error('Cannot create dialog while one exists');

    const actionConfirm = params.actionConfirm === undefined ? true : params.actionConfirm;
    const actionCancel = params.actionCancel || false;
    const element = document.createElement('mdw-dialog');
    element.clickScrimClose = params.clickScrimClose;
    element.insertAdjacentHTML('afterbegin', `
      ${!params.headline ? '' : `<div class="mdw-header">${params.headline}</div>`}
      <div class="mdw-content">${params.message || ''}</div>
      ${actionConfirm || actionCancel ? `<div class="mdw-actions">
        ${actionConfirm === true ? `<mdw-button onclick="MDWDialog.close('confirm')">${params.actionConfirmLabel || 'OK'}</mdw-button>` : ''}
        ${actionCancel === true ? `<mdw-button onclick="MDWDialog.close('cancel')">${params.actionCancelLabel || 'Cancel'}</mdw-button>` : ''}
      </div>` : ''}
    `);

    document.body.appendChild(element);
    element.addEventListener('close', this.#onClose_bound);
    element.show(params.scrim === undefined ? true : params.scrim);

    this.#currentDialog = element;
    return new Promise(resolve => {
      this.#currentDialogPromiseResolve = resolve;
    });
  }

  #onClose() {
    this.#currentDialog.removeEventListener('close', this.#onClose_bound);
    this.#currentDialog = undefined;
  }

  async close(returnValue) {
    if (!this.#currentDialog) throw Error('No dialog to close');

    this.#currentDialog.removeEventListener('close', this.#onClose_bound);
    if (this.#currentDialogPromiseResolve) this.#currentDialogPromiseResolve(returnValue);
    this.#currentDialog.close(returnValue);

    await util.animationendAsync(this.#currentDialog);

    this.#currentDialog.remove();
    this.#currentDialog = undefined;
    this.#currentDialogPromiseResolve = undefined;
  }

  template(params = {
    template,
    scrim: true,
    clickScrimClose: false,
  }) {
    if (this.#currentDialog) throw Error('Cannot create dialog while one exists');

    const element = document.createElement('mdw-dialog');
    element.clickScrimClose = params.clickScrimClose;
    element.insertAdjacentHTML('afterbegin', params.template);

    document.body.appendChild(element);

    // for show animation
    setTimeout(() => {
      element.show(params.scrim === undefined ? true : params.scrim);
    }, 0);

    this.#currentDialog = element;
    return new Promise(resolve => {
      this.#currentDialogPromiseResolve = resolve;
    });
  }
};

window.MDWDialog = MDWDialog;
export default MDWDialog;
