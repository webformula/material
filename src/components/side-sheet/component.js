import HTMLElementExtended from '../HTMLElementExtended.js';
import './component.css';
import device from '../../core/device.js';
import util from '../../core/util.js';

// TODO confirm we do not want to allow a global main side sheet (.mdw-connect-page-content)

customElements.define('mdw-side-sheet', class MDWSideSheetElement extends HTMLElementExtended {
  #open;
  #backdrop;
  #closeButton;
  #clickBackdropClose = false;
  #placeHolder;
  #backdropClick_bound = this.#backdropClick.bind(this);
  #closeClick_bound = this.close.bind(this);

  constructor() {
    super();

    this.classList.add('mdw-no-animation');
    // document.body.classList.add('mdw-side-sheet-no-animation');
    // if (this.classList.contains('mdw-connect-page-content')) document.body.classList.add('mdw-side-sheet-connect-page-content');
    this.classList.add('mdw-hide');
    this.#open = false;

    this.#placeHolder = document.createElement('div');
    this.#placeHolder.classList.add('mdw-side-sheet-placeholder');
    this.insertAdjacentElement('afterend', this.#placeHolder);

    // this.#handleState();
  }

  connectedCallback() {
    this.#closeButton = this.querySelector('.mdw-side-sheet-close');
    if (this.#closeButton) this.#closeButton.addEventListener('click', this.#closeClick_bound);
    util.nextAnimationFrameAsync().then(() => {
      this.classList.remove('mdw-no-animation');
      // document.body.classList.remove('mdw-side-sheet-no-animation');
    });
  }

  disconnectedCallback() {
    if (!this.#backdrop) this.#backdrop.remove();
    if (this.#closeButton) this.#closeButton.removeEventListener('click', this.#closeClick_bound);
  }

  get open() {
    return this.#open;
  }

  set open(value) {
    if (this.#open === value) return;

    this.#open = !!value;
    this.classList.toggle('mdw-hide', !this.#open);

    if (this.#isModal) {
      if (this.#open) {
        if (!this.#backdrop) this.#backdrop = document.createElement('mdw-backdrop');
        this.insertAdjacentElement('beforebegin', this.#backdrop);
        if (this.#clickBackdropClose) this.#backdrop.addEventListener('click', this.#backdropClick_bound);
      } else if (this.#backdrop) {
        this.#backdrop.removeEventListener('click', this.#backdropClick_bound);
        this.#backdrop.remove();
      }
    }

    // this.#handleState();
  }

  get clickBackdropClose() {
    return this.#clickBackdropClose;
  }

  set clickBackdropClose(value) {
    this.#clickBackdropClose = !!value;
  }

  get #isModal() {
    return this.classList.contains('mdw-modal') || device.isMobile;
  }

  show() {
    this.open = true;
  }

  close() {
    this.open = false;
  }

  toggle() {
    this.open = !this.open;
  }

  #backdropClick() {
    this.open = false;
  }

  // #handleState() {
  //   document.body.classList.remove('mdw-side-sheet-state-hide');
  //   document.body.classList.remove('mdw-side-sheet-state-modal');
  //   document.body.classList.remove('mdw-side-sheet-state-open');

  //   if (this.classList.contains('mdw-hide')) document.body.classList.add('mdw-side-sheet-state-hide');
  //   else if (this.#isModal) document.body.classList.add('mdw-side-sheet-state-modal');
  //   else document.body.classList.add('mdw-side-sheet-state-open');
  // }
});
