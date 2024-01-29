import MDWSurfaceElement from '../surface/component.js';
import styles from './bottom-sheet.css' assert { type: 'css' };
import Drag from '../../core/Drag.js';
import util from '../../core/util.js';


// TODO right
// TODO do i want modal on compact?

customElements.define('mdw-bottom-sheet', class MDWBottomSheetElement extends MDWSurfaceElement {
  static styleSheets = styles;

  #drag;
  #surface;
  #surfaceContent;
  #initialDragPosition;
  #lastScrollPosition;
  #isScrolling = false;
  #positionState = 'initial';
  #fixedHeight = false;
  #fixedHeightBottom;
  #onDragStart_bound = this.#onDragStart.bind(this);
  #onDragEnd_bound = this.#onDragEnd.bind(this);
  #onDrag_bound = this.#onDrag.bind(this);
  #onScroll_bound = util.rafThrottle(this.#onScroll.bind(this));
  #onPageScroll_bound = util.rafThrottle(this.#onPageScroll.bind(this));

  constructor() {
    super();

    this.fixed = true;
    this.alwaysVisible = true;
    this.allowClose = false;
    this.viewportBound = false;
    this.#surface = this.shadowRoot.querySelector('.surface');
    this.#surfaceContent = this.shadowRoot.querySelector('.surface-content');
    this.#position = this.#initialPosition;
    this.#surfaceContent.style.overflowY = 'visible';
  }

  template() {
    return /*html*/`
      <div class="surface">
        <div class="surface-content">
          <div class="item-padding">
            <div class="handle"></div>
            <slot class="default-slot"></slot>
          </div>
        </div>
      </div>
    `;
  }


  static get observedAttributesExtended() {
    return [
      ['open', 'boolean'],
      ['fixed-height', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get fixedHeight() { return this.#fixedHeight; }
  set fixedHeight(value) {
    this.#fixedHeight = value;
    if (this.#fixedHeight) this.#setFixedHeight();
    else this.#position = this.#initialPosition;
  }

  connectedCallback() {
    super.connectedCallback();

    if (!this.#fixedHeight) {
      if (!this.#drag) {
        this.#drag = new Drag(this.#surface);
        this.#drag.on('mdwdragstart', this.#onDragStart_bound);
        this.#drag.on('mdwdragend', this.#onDragEnd_bound);
        this.#drag.on('mdwdragmove', this.#onDrag_bound);
      }
      this.#drag.enable();
    }

    util.trackPageScroll(this.#onPageScroll_bound);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    if (this.#drag) this.#drag.destroy();
    util.untrackPageScroll(this.#onPageScroll_bound);
  }


  get #initialPosition() {
    if (this.#fixedHeight) return this.#fixedHeightBottom;
    this.#positionState = 'initial';
    const initialPositionVar = parseInt(this.#surface.style.getPropertyValue('--mdw-bottom-sheet-initial-position') || 40) / 100;
    return -(this.#surface.offsetHeight - (window.innerHeight * initialPositionVar));
  }

  get #topPosition() {
    this.#positionState = 'top';
    return -(this.#surface.offsetHeight - window.innerHeight);
  }

  get #minimizedPosition() {
    this.#positionState = 'minimized';
    const offset = document.body.classList.contains('has-bottom-app-bar') || document.body.classList.contains('has-navigation-bar') ? 80 : 0;
    return -(this.#surface.offsetHeight - 80 - offset);
  }

  get #position() {
    return parseInt(this.#surface.style.getPropertyValue('--mdw-bottom-sheet-bottom').replace('px', ''));
  }
  set #position(value) {
    this.#surface.style.setProperty('--mdw-bottom-sheet-bottom', `${value}px`);
  }


  #toTopPosition() {
    this.#position = this.#topPosition;
    this.#switchToScrolling();
  }

  #onDragStart(event) {
    if (this.#isScrolling) return;

    this.#initialDragPosition = this.#position;
    if (this.#initialDragPosition !== this.#topPosition) event.preventDefault();
    util.lockPageScroll();
  }

  async #onDragEnd({ directionY }) {
    if (this.#isScrolling) return;

    this.#surface.classList.add('animate-position');

    if (directionY === -1) {
      if (this.#position > this.#initialPosition) this.#toTopPosition();
      else this.#position = this.#initialPosition;
    } else {
      if (this.#position >= this.#initialPosition) this.#position = this.#initialPosition;
      else this.#position = this.#minimizedPosition;
    }

    await util.transitionendAsync(this);
    this.#surface.classList.remove('animate-position');
    if (this.#positionState !== 'top') requestAnimationFrame(() => util.unlockPageScroll());
  }

  #onDrag({ distanceY, movementY, directionY }) {
    if (this.#surfaceContent.scrollTop <= 0 && directionY === 1 && this.#surfaceContent.style.overflowY !== 'visible') {
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

  // wait for overscroll to settle then switch back to drag
  #onScroll() {
    if (this.#surfaceContent.scrollTop <= 0 && this.#surfaceContent.scrollTop === this.#lastScrollPosition) {
      this.#switchToDragging();
    }
    this.#lastScrollPosition = this.#surfaceContent.scrollTop
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

  #switchToScrolling(movementY) {
    this.#surfaceContent.style.overflowY = 'scroll';
    this.#position = 0;
    this.#isScrolling = true;
    if (movementY) this.#surfaceContent.scrollTop = -movementY;
    this.#surfaceContent.addEventListener('scroll', this.#onScroll_bound);
    this.classList.add('fullscreen');
  }

  #switchToDragging() {
    this.#surfaceContent.removeEventListener('scroll', this.#onScroll_bound);
    this.#initialDragPosition = 0;
    this.#position = 0;
    this.classList.remove('fullscreen');
    this.#surfaceContent.style.overflowY = 'visible';
    this.#surfaceContent.style.height = '';
    this.#isScrolling = false;
    this.#drag.resetTracking();
  }

  #setFixedHeight() {
    const contentBounds = this.#surface.querySelector('.item-padding').getBoundingClientRect();
    this.#surface.style.height = `${contentBounds.height}px`;
    this.#position = 0;
    this.#fixedHeightBottom = 0;
  }
});
