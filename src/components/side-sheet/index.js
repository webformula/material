import HTMLElementExtended from '../HTMLElementExtended.js';
import util from '../../core/util.js';
import device from '../../core/device.js';


customElements.define('mdw-side-sheet', class MDWSideSheetElement extends HTMLElementExtended {
  #open;
  #scrim;
  #scrimElement;
  #modal;
  #clickOutsideClose = false;
  #placeHolder;
  #content;
  #actions;
  #header;
  #scrimClick_bound = this.#scrimClick.bind(this);
  #closeClick_bound = this.close.bind(this);
  #scrolled_bound = this.#scrolled.bind(this);
  #windowState_bound = this.#windowState.bind(this);

  constructor() {
    super();

    this.classList.add('mdw-no-animation');
    this.classList.add('mdw-hide');
    this.#open = false;
    this.modal = this.classList.contains('mdw-global') || this.classList.contains('mdw-modal') || device.state !== 'expanded';
    this.#scrim = this.classList.contains('mdw-scrim');
    this.#clickOutsideClose = this.classList.contains('mdw-click-scrim-close');

    this.#placeHolder = document.createElement('div');
    this.#placeHolder.classList.add('mdw-side-sheet-placeholder');
    this.insertAdjacentElement('afterend', this.#placeHolder);
  }

  connectedCallback() {
    this.setAttribute('role', 'dialog');
    util.nextAnimationFrameAsync().then(() => {
      this.querySelectorAll('.mdw-side-sheet-close').forEach(element => element.addEventListener('click', this.#closeClick_bound));
      this.classList.remove('mdw-no-animation');
    });
    window.addEventListener('mdwwindowstate', this.#windowState_bound);

    // this.#content = this.querySelector('.mdw-content');
    // this.#actions = this.querySelector('.mdw-actions');
    // this.#header = this.querySelector('.mdw-header');
    // if (this.#content) {
    //   this.querySelector('.mdw-content').addEventListener('scroll', this.#scrolled_bound);
    //   this.#scrolled();
    // }
  }

  disconnectedCallback() {
    if (this.#scrimElement) this.#scrimElement.remove();
    this.querySelectorAll('.mdw-side-sheet-close').forEach(element => element.removeEventListener('click', this.#closeClick_bound));
    if (this.#content && this.#actions) this.querySelector('.mdw-content').removeEventListener('scroll', this.#scrolled_bound);
    window.removeEventListener('mdwwindowstate', this.#windowState_bound);
  }

  #windowState({ detail }) {
    this.modal = detail.state !== 'expanded';
  }

  get open() {
    return this.#open;
  }

  set open(value) {
    if (this.#open === value) return;

    this.#open = !!value;
    this.classList.toggle('mdw-hide', !this.#open);
    
    if (this.#modal && this.#scrim) {
      if (this.#open) {
        if (!this.#scrimElement) this.#scrimElement = document.createElement('mdw-scrim');
        this.insertAdjacentElement('beforebegin', this.#scrimElement);
        if (this.#clickOutsideClose) this.#scrimElement.addEventListener('click', this.#scrimClick_bound);
      } else if (this.#scrimElement) {
        this.#scrimElement.removeEventListener('click', this.#scrimClick_bound);
        this.#scrimElement.remove();
      }
    }
  }

  get clickOutsideClose() {
    return this.#clickOutsideClose;
  }

  set clickOutsideClose(value) {
    this.#clickOutsideClose = !!value;
  }

  get modal() {
    return this.#modal;
  }
  set modal(value) {
    this.#modal = this.classList.contains('mdw-global') ? true : !!value;
    this.classList.toggle('mdw-modal', this.#modal);
  }

  get scrim() {
    return this.#scrim;
  }
  set scrim(value) {
    this.#scrim = !!value;
    this.classList.toggle('mdw-scrim', this.#scrim);
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

  #scrimClick() {
    this.open = false;
  }

  #scrolled() {
    if (this.#actions) this.#actions.classList.toggle('mdw-scrolled', (this.#content.scrollHeight - this.#content.scrollTop) > this.#content.offsetHeight);
    if (this.#header) this.#header.classList.toggle('mdw-scrolled', this.#content.scrollTop > 0);
  }
});
