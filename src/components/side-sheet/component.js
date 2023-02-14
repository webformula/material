import HTMLElementExtended from '../HTMLElementExtended.js';
import './component.css';
import util from '../../core/util.js';


customElements.define('mdw-side-sheet', class MDWSideSheetElement extends HTMLElementExtended {
  #open;
  #backdrop;
  #backdropElement;
  #modal;
  #clickBackdropClose = false;
  #placeHolder;
  #backdropClick_bound = this.#backdropClick.bind(this);
  #closeClick_bound = this.close.bind(this);

  constructor() {
    super();

    this.classList.add('mdw-no-animation');
    this.classList.add('mdw-hide');
    this.#open = false;
    if (this.classList.contains('mdw-global')) this.classList.add('mdw-modal')
    this.#modal = this.classList.contains('mdw-modal');
    this.#backdrop = this.classList.contains('mdw-backdrop');
    this.#clickBackdropClose = this.classList.contains('mdw-click-backdrop-close');

    this.#placeHolder = document.createElement('div');
    this.#placeHolder.classList.add('mdw-side-sheet-placeholder');
    this.insertAdjacentElement('afterend', this.#placeHolder);
  }

  connectedCallback() {
    util.nextAnimationFrameAsync().then(() => {
      this.querySelectorAll('.mdw-side-sheet-close').forEach(element => element.addEventListener('click', this.#closeClick_bound));
      this.classList.remove('mdw-no-animation');
    });
  }

  disconnectedCallback() {
    if (!this.#backdropElement) this.#backdropElement.remove();
    this.querySelectorAll('.mdw-side-sheet-close').forEach(element => element.removeEventListener('click', this.#closeClick_bound));
  }

  get open() {
    return this.#open;
  }

  set open(value) {
    if (this.#open === value) return;

    this.#open = !!value;
    this.classList.toggle('mdw-hide', !this.#open);

    if (this.#modal && this.#backdrop) {
      if (this.#open) {
        if (!this.#backdropElement) this.#backdropElement = document.createElement('mdw-backdrop');
        this.insertAdjacentElement('beforebegin', this.#backdropElement);
        if (this.#clickBackdropClose) this.#backdropElement.addEventListener('click', this.#backdropClick_bound);
      } else if (this.#backdropElement) {
        this.#backdropElement.removeEventListener('click', this.#backdropClick_bound);
        this.#backdropElement.remove();
      }
    }
  }

  get clickBackdropClose() {
    return this.#clickBackdropClose;
  }

  set clickBackdropClose(value) {
    this.#clickBackdropClose = !!value;
  }

  get modal() {
    return this.#modal;
  }
  set modal(value) {
    this.#modal = this.classList.contains('mdw-global') ? true : !!value;
    this.classList.toggle('mdw-modal', this.#modal);
  }

  get backdrop() {
    return this.#backdrop;
  }
  set backdrop(value) {
    this.#backdrop = !!value;
    this.classList.toggle('mdw-backdrop', this.#backdrop);
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
});
