import HTMLElementExtended from '../HTMLElementExtended.js';
import util from '../../core/util.js';
import styles from './component.css' assert { type: 'css' };
HTMLElementExtended.registerGlobalStyleSheet(styles);


customElements.define('mdw-side-sheet', class MDWSideSheetElement extends HTMLElementExtended {
  #open;
  #scrim;
  #scrimElement;
  #modal;
  #clickScrimClose = false;
  #placeHolder;
  #scrimClick_bound = this.#scrimClick.bind(this);
  #closeClick_bound = this.close.bind(this);

  constructor() {
    super();

    this.classList.add('mdw-no-animation');
    this.classList.add('mdw-hide');
    this.#open = false;
    if (this.classList.contains('mdw-global')) this.classList.add('mdw-modal')
    this.#modal = this.classList.contains('mdw-modal');
    this.#scrim = this.classList.contains('mdw-scrim');
    this.#clickScrimClose = this.classList.contains('mdw-click-scrim-close');

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
    if (this.#scrimElement) this.#scrimElement.remove();
    this.querySelectorAll('.mdw-side-sheet-close').forEach(element => element.removeEventListener('click', this.#closeClick_bound));
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
        if (this.#clickScrimClose) this.#scrimElement.addEventListener('click', this.#scrimClick_bound);
      } else if (this.#scrimElement) {
        this.#scrimElement.removeEventListener('click', this.#scrimClick_bound);
        this.#scrimElement.remove();
      }
    }
  }

  get clickScrimClose() {
    return this.#clickScrimClose;
  }

  set clickScrimClose(value) {
    this.#clickScrimClose = !!value;
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
});
