import util from '../../core/util.js';
import { close_FILL1_wght400_GRAD0_opsz24  } from '../../core/svgs.js';


const wfcSnackbar = new class wfcSnackbar {
  defaultTime = 4000;
  #currentSnackbar;
  #snackbarQueue = [];


  show(params = {
    message: '',
    actionLabel: '',
    closeButton: true,
    time: this.defaultTime
  }) {
    if (!params.message) throw Error('Message required');
    if (params.closeButton === undefined) params.closeButton = true;

    const id = `wfc-snackbar-${util.uid()}`;
    document.body.insertAdjacentHTML('beforeend', /*html*/`
      <wfc-snackbar id="${id}" ${params.twoLine ? 'class="two-line"' : ''} aria-label="[alert] ${params.message}">
        <div class="wfc-text">${params.message}</div>
        ${!params.actionLabel ? '' : `<wfc-button onclick="wfcSnackbar.dismiss('action')">${params.actionLabel}</wfc-button>`}
        ${!params.closeButton ? '' : `<wfc-icon onclick="wfcSnackbar.dismiss('close')">${close_FILL1_wght400_GRAD0_opsz24}</wfc-icon>`}
      </wfc-snackbar>
    `);

    return new Promise(resolve => {
      this.#snackbarQueue.push({
        snackbar: document.querySelector(`#${id}`),
        resolve,
        time: params.time || this.defaultTime
      });
      this.#handleQueue();
    });
  }

  dismiss() {
    if (!this.#currentSnackbar) return;
    this.#currentSnackbar.snackbar.close();
  }

  #handleQueue() {
    if (this.#currentSnackbar) return;
    this.#currentSnackbar = this.#snackbarQueue.shift();
    if (!this.#currentSnackbar) return;

    const currentTimer = setTimeout(() => {
      this.#currentSnackbar.snackbar.close();
    }, this.#currentSnackbar.time);
    this.#currentSnackbar.snackbar.show();

    const onClose = async () => {
      this.#currentSnackbar.snackbar.removeEventListener('close', onClose);
      clearTimeout(currentTimer);
      this.#currentSnackbar.resolve();
      const currentRef = this.#currentSnackbar.snackbar;
      util.animationendAsync(currentRef).then(() => {
        currentRef.remove();
      });
      this.#currentSnackbar = undefined;
      await util.wait(500);
      this.#handleQueue();
    };

    this.#currentSnackbar.snackbar.addEventListener('close', onClose);
  }
}

window.wfcSnackbar = wfcSnackbar;
export default wfcSnackbar;
