import Drag from '../../core/Drag.js';
import util from '../../core/util.js';
import HTMLElementExtended from '../HTMLElementExtended.js';
import './component.css';


// TODO accessability
// TODO look into other ways of preventing body from scrolling
//   There is some bugs on ios safari with bottom url bar
//   could try locking the scroll to the body. Right now it is scrolling on html. We want to see if we can maintain address bar behavior

customElements.define('mdw-bottom-sheet', class MDWBottomSheetElement extends HTMLElementExtended {
  #drag;
  #initialDragToScrollSwitch;
  #initialDragPosition;
  #lastScrollPosition;
  #isScrolling = false;
  #onDrag_bound = this.#onDrag.bind(this);
  #onDragStart_bound = this.#onDragStart.bind(this);
  #onDragEnd_bound = this.#onDragEnd.bind(this);
  #onScroll_bound = this.#onScroll.bind(this);

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

  connectedCallback() {
    this.#drag.enable();
  }

  get #initialPosition() {
    const initialPositionVar = parseInt(this.style.getPropertyValue('--mdw-bottom-sheet-initial-position') || 40) / 100;
    return -(this.offsetHeight - (window.innerHeight * initialPositionVar));
  }

  get #topPosition() {
    return -(this.offsetHeight - window.innerHeight);
  }

  get #minimizedPosition() {
    return -(this.offsetHeight - 80);
  }

  get #position() {
    return parseInt(this.style.getPropertyValue('--mdw-bottom-sheet-bottom').replace('px', ''));
  }
  set #position(value) {
    this.style.setProperty('--mdw-bottom-sheet-bottom', `${value}px`);
  }


  #onDragStart({ event }) {
    if (this.#isScrolling) return;

    this.#initialDragToScrollSwitch = false;
    this.#initialDragPosition = this.#position;
    if (this.#initialDragPosition !== this.#topPosition) event.preventDefault();
    util.lockPageScroll();
  }

  async #onDragEnd({ direction }) {
    if (this.#isScrolling) return;

    this.classList.add('mdw-animate-position');

    if (direction.y === -1) {
      if (this.#position > this.#initialPosition) this.#toTopPosition();
      else this.#position = this.#initialPosition;
    } else {
      if (this.#position >= this.#initialPosition) this.#position = this.#initialPosition;
      else this.#position = this.#minimizedPosition;
    }

    await util.transitionendAsync(this);
    this.classList.remove('mdw-animate-position');
  }

  #onDrag({ distance, direction }) {
    if (this.scrollTop <= 0 && direction.y === 1 && this.style.overflowY !== 'visible') {
      this.#switchToDragging();
      return;
    }

    if (this.#isScrolling) return;

    // container has been drag to top and needs to be converted to scroll
    if (this.#position >= this.#topPosition && direction.y === -1) {
      this.#switchToScrolling(distance);
      return;
    }

    this.#position = this.#initialDragPosition - distance.y;
  }

  #toTopPosition() {
    this.#position = this.#topPosition;
    this.#switchToScrolling();
  }

  #switchToScrolling(distance) {
    this.style.overflowY = 'scroll';
    this.#position = 0;
    this.#isScrolling = true;
    if (distance) this.scrollTop = -distance.moveY;
    this.addEventListener('scroll', this.#onScroll_bound);
  }

  #switchToDragging() {
    this.style.overflowY = 'visible';
    this.style.height = '';
    this.#initialDragPosition = this.#position;
    this.#position = this.#topPosition;
    this.#drag.resetDistance();
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
