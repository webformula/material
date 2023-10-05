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
  #setInitialPositionOnCompact_bound = this.#setInitialPositionOnCompact.bind(this);
  #positionState = 'initial';
  #fixedHeight = this.classList.contains('mdw-fixed-height');
  #fixedHeightBottom;
  #open = true;

  constructor() {
    super();

    this.#position = this.#initialPosition;
    this.style.overflowY = 'visible'; // used in drag events

    if (!this.#fixedHeight) {
      this.#drag = new Drag(this);
      this.#drag.on('mdwdragmove', this.#onDrag_bound);
      this.#drag.on('mdwdragstart', this.#onDragStart_bound);
      this.#drag.on('mdwdragend', this.#onDragEnd_bound);
    }

    if (this.classList.contains('mdw-hide')) this.close();
  }

  connectedCallback() {
    if (this.#fixedHeight) return requestAnimationFrame(() => this.#setFixedHeight());

    this.#drag.enable();
    util.trackPageScroll(this.#onPageScroll_bound);
    window.addEventListener('mdwwindowstate', this.#setInitialPositionOnCompact_bound);
  }

  disconnectedCallback() {
    if (this.#fixedHeight) return;

    this.#drag.disable();
    util.untrackPageScroll(this.#onPageScroll_bound);
    window.removeEventListener('mdwwindowstate', this.#setInitialPositionOnCompact_bound);
  }

  async close() {
    this.#open = false;
    this.#positionState = 'hide';
    this.#position = -(this.offsetHeight);
    this.dispatchEvent(new Event('close', this));
    if (this.classList.contains('mdw-animate-position')) {
      util.unlockPageScroll();
      await util.animationendAsync(this);
      this.classList.remove('mdw-animate-position');
    }
  }
  async show() {
    this.#open = true;
    this.classList.add('mdw-animate-position');
    this.#position = this.#initialPosition;
    this.dispatchEvent(new Event('open', this));
  }
  get open() {
    return this.#open;
  }

  get #initialPosition() {
    if (this.#fixedHeight) return this.#fixedHeightBottom;
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
    const offset = document.body.classList.contains('mdw-has-bottom-app-bar') || document.body.classList.contains('mdw-has-navigation-bar')  ? 80 : 0;
    return -(this.offsetHeight - 80 - offset);
  }

  get #position() {
    return parseInt(this.style.getPropertyValue('--mdw-bottom-sheet-bottom').replace('px', ''));
  }
  set #position(value) {
    this.style.setProperty('--mdw-bottom-sheet-bottom', `${value}px`);
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

  #setInitialPositionOnCompact({ detail }) {
    if (detail.state === 'compact') this.#position = this.#initialPosition
  }

  #onDragStart(event) {
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

  #onDrag({ distanceY, movementY, directionY }) {
    if (this.scrollTop <= 0 && directionY === 1 && this.style.overflowY !== 'visible') {
      this.#switchToDragging();
      return;
    }

    if (this.#isScrolling) return;

    // container has been drag to top and needs to be converted to scroll
    if (this.#position >= this.#topPosition && directionY === -1) {
      this.#switchToScrolling(movementY);
      return;
    }

    this.#position = this.#initialDragPosition - distanceY;
  }

  #toTopPosition() {
    this.#position = this.#topPosition;
    this.#switchToScrolling();
  }

  #switchToScrolling(movementY) {
    this.style.overflowY = 'scroll';
    this.#position = 0;
    // TODO
    // if (document.body.classList.contains('mdw-has-bottom-app-bar') || document.body.classList.contains('mdw-has-navigation-bar')) {
    //   this.#position = -parseInt(document.body.style.getPropertyValue('--mdw-bottom-app-bar-position').replace('px', '') || 0);
    // }
    this.#isScrolling = true;
    if (movementY) this.scrollTop = -movementY;
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

  #setFixedHeight() {
    const contentBounds = this.querySelector('.mdw-content').getBoundingClientRect();
    const offset = document.body.classList.contains('mdw-has-bottom-app-bar') || document.body.classList.contains('mdw-has-navigation-bar') ? 80 : 0;
    const pagePaddingBottom = parseInt(((document.querySelector('#page-content') || document.querySelector('page-content')).style.getPropertyValue('--mdw-page-content-padding-bottom') || '0').replace('px', ''))
    this.#fixedHeightBottom = -(visualViewport.height - contentBounds.bottom) + offset - pagePaddingBottom;
    this.style.bottom = `${this.#fixedHeightBottom}px`;
  }
});
