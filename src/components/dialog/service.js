import util from '../../core/util.js';


const mdwDialog = new class mdwDialog {
  #dialogStack = [];

  async simple(params = {
    headline: '',
    message: '',
    scrim: true,
    clickOutsideClose: false,
    preventNavigation: true,
    actionConfirm: true,
    actionConfirmLabel: 'OK',
    actionCancel: false,
    actionCancelLabel: 'Cancel'
  }) {
    const actionConfirm = params.actionConfirm === undefined ? true : params.actionConfirm;
    const actionCancel = params.actionCancel || false;
    const element = document.createElement('mdw-dialog');
    element.removeOnClose = true;
    element.clickOutsideClose = params.clickOutsideClose;
    if (params.preventNavigation !== undefined) element.preventNavigation = params.preventNavigation;
    element.insertAdjacentHTML('afterbegin', `
      ${!params.headline ? '' : `<div class="mdw-headline">${params.headline}</div>`}
      <div class="mdw-content">${params.message || ''}</div>
      ${actionConfirm || actionCancel ? `<div class="mdw-actions">
        ${actionConfirm === true ? `<mdw-button onclick="mdwDialog.close('confirm')">${params.actionConfirmLabel || 'OK'}</mdw-button>` : ''}
        ${actionCancel === true ? `<mdw-button onclick="mdwDialog.close('cancel')">${params.actionCancelLabel || 'Cancel'}</mdw-button>` : ''}
      </div>` : ''}
    `);

    document.body.appendChild(element);
    return element.show(params.scrim === undefined ? true : params.scrim);
  }

  async template(params = {
    template,
    scrim: true,
    clickOutsideClose: false,
    preventNavigation: true
  }) {
    const element = document.createElement('mdw-dialog');
    element.removeOnClose = true;
    element.clickOutsideClose = params.clickOutsideClose;
    if (params.preventNavigation !== undefined) element.preventNavigation = params.preventNavigation;
    element.insertAdjacentHTML('afterbegin', params.template);

    document.body.appendChild(element);

    // for show animation
    await util.nextAnimationFrameAsync();
    return element.show(params.scrim === undefined ? true : params.scrim);
  }

  async close(returnValue) {
    const currentDialog = this.#dialogStack.pop();
    if (!currentDialog) throw Error('No dialog to close');

    currentDialog.resolve(returnValue);
    currentDialog.element.panelClose(returnValue);
    
    await util.animationendAsync(currentDialog.element);

    if (currentDialog.element.removeOnClose === true) currentDialog.element.parentNode.removeChild(currentDialog.element);
  }

  track(dialogElement) {
    if (dialogElement.nodeName !== 'MDW-DIALOG') throw Error('Can only track mdw-dialog elements');
    let resolveMethod;
    const promise = new Promise(resolve => {
      resolveMethod = resolve;
    });
    this.#dialogStack.push({
      element: dialogElement,
      promise,
      resolve: resolveMethod
    });

    return promise;
  }

  untrack(dialogElement) {
    const dialog = this.#dialogStack.find(({ element }) => element === dialogElement);
    if (!dialog) return;

    // prevent promises from never resolving
    // This could happen if the element is removed from the screen before closing
    dialog.resolve();
    this.#dialogStack = this.#dialogStack.filter(({ element }) => element !== dialogElement);
  }
};

window.mdwDialog = mdwDialog;
export default mdwDialog;
