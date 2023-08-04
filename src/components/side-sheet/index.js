import HTMLElementExtended from '../HTMLElementExtended.js';
import util from '../../core/util.js';
import device from '../../core/device.js';
import Drag from '../../core/Drag.js';


customElements.define('mdw-side-sheet', class MDWSideSheetElement extends HTMLElementExtended {
  #open;
  #scrimElement;
  #modal;
  #clickOutsideClose = false;
  #placeHolder;
  #scrimClick_bound = this.#scrimClick.bind(this);
  #closeClick_bound = this.close.bind(this);
  #windowState_bound = this.#windowState.bind(this);
  #drag;
  #dragStart_bound = this.#dragStart.bind(this);
  #dragEnd_bound = this.#dragEnd.bind(this);
  #dragHandler_bound = this.#dragHandler.bind(this);

  constructor() {
    super();

    this.classList.add('mdw-no-animation');
    this.classList.add('mdw-hide');
    this.#open = false;
    this.modal = this.classList.contains('mdw-global') || this.classList.contains('mdw-modal') || device.state !== 'expanded';
    this.#clickOutsideClose = this.classList.contains('mdw-click-scrim-close');

    this.#placeHolder = document.createElement('div');
    this.#placeHolder.classList.add('mdw-side-sheet-placeholder');
    this.insertAdjacentElement('afterend', this.#placeHolder);

    this.#drag = new Drag(this.parentElement);
    this.#drag.noMouseEvents = true;
    this.#drag.lockScrollY = true;
    this.#drag.onStart(this.#dragStart_bound);
    this.#drag.onEnd(this.#dragEnd_bound);
    this.#drag.onDrag(this.#dragHandler_bound);
  }

  connectedCallback() {
    this.setAttribute('role', 'dialog');
    util.nextAnimationFrameAsync().then(() => {
      this.querySelectorAll('.mdw-side-sheet-close').forEach(element => element.addEventListener('click', this.#closeClick_bound));
      this.classList.remove('mdw-no-animation');
    });
    window.addEventListener('mdwwindowstate', this.#windowState_bound);
  }

  disconnectedCallback() {
    if (this.#scrimElement) this.#scrimElement.remove();
    this.querySelectorAll('.mdw-side-sheet-close').forEach(element => element.removeEventListener('click', this.#closeClick_bound));
    window.removeEventListener('mdwwindowstate', this.#windowState_bound);
    this.#drag.destroy();
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
    
    if (this.#modal) {
      if (this.#open) {
        if (!this.#scrimElement) this.#scrimElement = document.createElement('mdw-scrim');
        this.#scrimElement.classList.toggle('mdw-local', !this.classList.contains('mdw-global'));
        this.insertAdjacentElement('beforebegin', this.#scrimElement);
        if (this.#clickOutsideClose) this.#scrimElement.addEventListener('click', this.#scrimClick_bound);
        this.#drag.enable();
      } else if (this.#scrimElement) {
        this.#scrimElement.removeEventListener('click', this.#scrimClick_bound);
        this.#scrimElement.remove();
        this.#drag.disable();
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
    if (!this.#modal && this.#scrimElement) {
      this.#scrimElement.removeEventListener('click', this.#scrimClick_bound);
      this.#scrimElement.remove();
    }
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

  #dragStart({ clientX }) {
    const startCutoff = 104;
    const endCutoff = window.visualViewport.width - 104;
    // only allow drag from edges of screen
    if (clientX > startCutoff && clientX < endCutoff) return this.#drag.cancel();
    if (clientX < startCutoff) this.classList.add('mdw-swipe-back-from-left');
    else this.classList.add('mdw-swipe-back-from-right');
    this.classList.add('mdw-swipe-back');
  }

  async #dragEnd({ distanceX }) {
    const halfPoint = window.visualViewport.width / 2;
    const shouldClose = Math.abs(distanceX) > halfPoint;

    if (shouldClose) {
      this.close();
    } else {
      this.classList.add('mdw-swipe-back-animate-out');
      this.style.setProperty('--mdw-side-sheet-swipe-back-scale', '1');
    }

    await util.transitionendAsync(this);
    this.classList.remove('mdw-swipe-back');
    this.classList.remove('mdw-swipe-back-animate-out');
    this.classList.remove('mdw-swipe-back-from-left');
    this.classList.remove('mdw-swipe-back-from-right');
  }

  #dragHandler({ distanceX }) {
    const percent = Math.max(0, 1 - (Math.abs(distanceX) / window.visualViewport.width));
    this.style.setProperty('--mdw-side-sheet-swipe-back-scale', 0.93 + (0.07 * Math.max(0.3, percent)));
    this.style.setProperty('--mdw-side-sheet-swipe-back-move', `${Math.max(0, 0.65 - percent) * -16}px`);
  }
});
