import util from '../../core/util.js';
import closeIconSVGRaw from '../../svg-icons/close_FILL1_wght400_GRAD0_opsz24.svg';


const MDWSnackbar = new class MDWSnackbar {
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

    const snackbar = document.createElement('mdw-snackbar');
    if (params.twoLine) snackbar.classList.add('mdw-line-two');
    snackbar.innerHTML = /*html*/`
      <div class="mdw-text">${params.message}</div>
      ${!params.actionLabel ? '' : `<mdw-button onclick="MDWSnackbar.dismiss('action')">${params.actionLabel}</mdw-button>`}
      ${!params.closeButton ? '' : `<div class="mdw-icon-svg" onclick="MDWSnackbar.dismiss('close')">${closeIconSVGRaw}</div>`}
    `;
    document.body.insertAdjacentElement('beforeend', snackbar);

    return new Promise(resolve => {
      this.#snackbarQueue.push({
        snackbar,
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

window.MDWSnackbar = MDWSnackbar;
export default MDWSnackbar;
