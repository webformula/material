import Drag from '../../core/Drag.js';
import util from '../../core/util.js';
import HTMLElementExtended from '../HTMLElementExtended.js';

// TODO look into other ways of preventing body from scrolling
//   There is some bugs on ios safari with bottom url bar
//   could try locking the scroll to the body. Right now it is scrolling on html. We want to see if we can maintain address bar behavior

customElements.define('mdw-bottom-sheet', class MDWBottomSheetElement extends HTMLElementExtended {
  #drag;
  #initialDragPosition;
  #lastScrollPosition;
  #isScrolling = false;
  #onDrag_bound = this.#onDrag.bind(this);
  #onDragStart_bound = this.#onDragStart.bind(this);
  #onDragEnd_bound = this.#onDragEnd.bind(this);
  #onScroll_bound = util.rafThrottle(this.#onScroll.bind(this));
  #onPageScroll_bound = util.rafThrottle(this.#onPageScroll.bind(this));
  #positionState = 'initial';

  constructor() {
    super();

    this.insertAdjacentHTML('afterbegin', '<div class="mdw-drag-handle"></div>');
    this.#position = this.#initialPosition;
    this.style.overflowY = 'visible'; // used in drag events

    this.#drag = new Drag(this);
    this.#drag.onDrag(this.#onDrag_bound);
    this.#drag.onStart(this.#onDragStart_bound);
    this.#drag.onEnd(this.#onDragEnd_bound);
  }

  #onPageScroll() {
    switch (this.#positionState) {
      case 'initial':
        this.#position = this.#initialPosition;
        break;
      case 'minimized':
        this.#position = this.#minimizedPosition;
        break;
    }
  }

  connectedCallback() {
    this.#drag.enable();
    util.trackPageScroll(this.#onPageScroll_bound);
  }

  disconnectedCallback() {
    this.#drag.disable();
    util.untrackPageScroll(this.#onPageScroll_bound);
  }

  get #initialPosition() {
    this.#positionState = 'initial';
    const initialPositionVar = parseInt(this.style.getPropertyValue('--mdw-bottom-sheet-initial-position') || 40) / 100;
    return -(this.offsetHeight - (window.innerHeight * initialPositionVar));
  }

  get #topPosition() {
    this.#positionState = 'top';
    return -(this.offsetHeight - window.innerHeight);
  }

  get #minimizedPosition() {
    this.#positionState = 'minimized';
    const offset = document.body.classList.contains('mdw-has-bottom-app-bar')  ? 80 : 0;
    return -(this.offsetHeight - 80 - offset);
  }

  get #position() {
    return parseInt(this.style.getPropertyValue('--mdw-bottom-sheet-bottom').replace('px', ''));
  }
  set #position(value) {
    this.style.setProperty('--mdw-bottom-sheet-bottom', `${value}px`);
  }


  #onDragStart({ event }) {
    if (this.#isScrolling) return;

    this.#initialDragPosition = this.#position;
    if (this.#initialDragPosition !== this.#topPosition) event.preventDefault();
    util.lockPageScroll();
  }

  async #onDragEnd({ directionY }) {
    if (this.#isScrolling) return;

    this.classList.add('mdw-animate-position');

    if (directionY === -1) {
      if (this.#position > this.#initialPosition) this.#toTopPosition();
      else this.#position = this.#initialPosition;
    } else {
      if (this.#position >= this.#initialPosition) this.#position = this.#initialPosition;
      else this.#position = this.#minimizedPosition;
    }

    await util.transitionendAsync(this);
    this.classList.remove('mdw-animate-position');
    if (this.#positionState !== 'top') requestAnimationFrame(() => util.unlockPageScroll());
  }

  #onDrag({ distanceY, moveY, directionY }) {
    if (this.scrollTop <= 0 && directionY === 1 && this.style.overflowY !== 'visible') {
      this.#switchToDragging();
      return;
    }

    if (this.#isScrolling) return;

    // container has been drag to top and needs to be converted to scroll
    if (this.#position >= this.#topPosition && directionY === -1) {
      this.#switchToScrolling(moveY);
      return;
    }

    this.#position = this.#initialDragPosition - distanceY;
  }

  #toTopPosition() {
    this.#position = this.#topPosition;
    this.#switchToScrolling();
  }

  #switchToScrolling(moveY) {
    this.style.overflowY = 'scroll';
    this.#position = 0;
    if (document.body.classList.contains('mdw-has-bottom-app-bar')) {
      this.#position = -parseInt(document.body.style.getPropertyValue('--mdw-bottom-app-bar-position').replace('px', '') || 0);
    }
    this.#isScrolling = true;
    if (moveY) this.scrollTop = -moveY;
    this.addEventListener('scroll', this.#onScroll_bound);
    this.classList.add('mdw-fullscreen');
  }

  #switchToDragging() {
    this.classList.remove('mdw-fullscreen');
    this.style.overflowY = 'visible';
    this.style.height = '';
    this.#initialDragPosition = this.#position;
    this.#position = this.#topPosition;
    this.#isScrolling = false;
    this.removeEventListener('scroll', this.#onScroll_bound);
  }

  // wait for overscroll to settle then switch back to drag
  #onScroll() {
    if (this.scrollTop <= 0 && this.scrollTop === this.#lastScrollPosition) {
      this.#switchToDragging();
    }
    this.#lastScrollPosition = this.scrollTop
  }
});
