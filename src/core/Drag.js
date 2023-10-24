import util from './util.js';
import device from './device.js';


export default class Drag {
  #element;
  #enabled = false;
  #isDragging = false;
  #noTouchEvents = false;
  #noMouseEvents = false;
  #lockScrollY = false;
  #preventSwipeNavigation = false;
  #timeConstant = 325;
  #lockScrollThreshold = 12;
  #ignoreElements = [];
  #listeners = {
    'mdwdragmove': [],
    'mdwdragstart': [],
    'mdwdragend': []
  };
  #abortMain;
  #abortDrag;
  #trackingDetails;
  #overscrollTrackingDetails;
  #pageContent;
  #hasScrollSnapPositions = false;
  #isSnapped = false;
  #isSnapping = false;
  #scrollSnapPositions;
  #isOverflowDragging = false;
  #overflowDrag = false;
  #drag_bound = this.#drag.bind(this);
  #start_bound = this.#start.bind(this);
  #end_bound = this.#end.bind(this);
  #preventSwipeNavigationHandler_bound = this.#preventSwipeNavigationHandler.bind(this);
  #resetTrackingDetails = false;

  constructor(element) {
    if (element) this.#element = element;
  }

  get element() {
    return this.#element;
  }
  set element(value) {
    if (this.#element) throw Error('element had already been set, cannot change.');
    if (!(value instanceof HTMLElement)) throw Error('element must be an instance HTMLElement');
    this.#element = value;
  }

  get noMouseEvents() {
    return this.#noMouseEvents || device.hasTouchScreen;
  }
  set noMouseEvents(value) {
    this.#noMouseEvents = !!value;
  }

  get noTouchEvents() {
    return this.#noTouchEvents;
  }
  set noTouchEvents(value) {
    this.#noTouchEvents = !!value;
  }

  get isDragging() {
    return this.#isDragging;
  }

  get lockScrollY() {
    return this.#lockScrollY;
  }
  set lockScrollY(value) {
    this.#lockScrollY = !!value;
  }

  get lockScrollThreshold() {
    return this.#lockScrollThreshold;
  }
  set lockScrollThreshold(value) {
    if (isNaN(value)) throw Error('lockScrollThreshold must be a number')
    this.#lockScrollThreshold = parseInt(value);
  }

  get scrollSnapPositions() {
    return this.#scrollSnapPositions;
  }
  set scrollSnapPositions(value) {
    this.#hasScrollSnapPositions = Array.isArray(value) && value.length > 0;
    if (this.#hasScrollSnapPositions) this.#scrollSnapPositions = value;
    else this.#scrollSnapPositions = undefined;
  }

  get overflowDrag() {
    return this.#overflowDrag;
  }
  set overflowDrag(value) {
    this.#overflowDrag = !!value;
  }

  get preventSwipeNavigation() {
    return this.#preventSwipeNavigation;
  }
  set preventSwipeNavigation(value) {
    this.#preventSwipeNavigation = !!value;
  }


  enable() {
    if (this.#enabled) return;
    if (!this.#element) throw Error('Element is required');
    this.#enabled = true;
    this.#abortMain = new AbortController();

    if (!this.noMouseEvents) this.#element.addEventListener('mousedown', this.#start_bound, { signal: this.#abortMain.signal });
    if (!this.noTouchEvents) {
      this.#element.addEventListener('touchstart', this.#start_bound, { signal: this.#abortMain.signal });
      this.#pageContent = document.querySelector('#page-content') || document.querySelector('page-content');
    }
  }

  disable() {
    if (this.#abortMain) this.#abortMain.abort();
    if (this.#abortDrag) this.#abortDrag.abort();
    this.#isDragging = false;
    this.#enabled = false;
    if (this.#lockScrollY) util.unlockPageScroll();
  }

  cancel() {
    if (this.#abortDrag) this.#abortDrag.abort();
    this.#isDragging = false;
    if (this.#lockScrollY) util.unlockPageScroll();
  }

  destroy() {
    this.disable();
    this.#element = undefined;
    this.#listeners = {
      'mdwdragmove': [],
      'mdwdragstart': [],
      'mdwdragend': []
    };
  }

  resetTracking() {
    this.#resetTrackingDetails = true;
  }

  on(eventType, callback) {
    if (!this.#listeners[eventType]) throw Error('Invalid eventType. Valid events: mdwdragmove, mdwdragstart, mdwdragend');
    this.#listeners[eventType].push(callback);
  }

  off(eventType, callback) {
    if (!this.#listeners[eventType]) throw Error('Invalid eventType. Valid events: mdwdragmove, mdwdragstart, mdwdragend');
    if (this.#listeners[eventType].includes(callback)) this.#listeners[eventType].splice(this.#listeners[eventType].indexOf(callback), 1);
  }

  trigger(event) {
    if (!this.#listeners[event.type]) return;
    this.#element.dispatchEvent(event);
    this.#listeners[event.type].forEach(callback => callback(event));
  }

  addIgnoreElement(element) {
    this.#ignoreElements.push(element);
  }

  emptyIgnoreElements() {
    this.#ignoreElements = [];
  }


  #start(event) {
    this.#resetTrackingDetails = false;

    // does this need to be on always
    if (this.#preventSwipeNavigation) {
      this.#pageContent.addEventListener('touchstart', this.#preventSwipeNavigationHandler_bound, { signal: this.#abortMain.signal });
    }

    // right click
    if (event.which === 3) {
      if (this.#isDragging) this.#end(event);
      return;
    }
    if (this.#ignoreElements.find(v => v === event.target || v.contains(event.target))) return;

    this.#isSnapped = false;
    this.#isSnapping = false;
    this.#isOverflowDragging = false;
    this.#isDragging = false;
    if (this.#abortDrag) this.#abortDrag.abort();
    this.#abortDrag = new AbortController();
    this.#resetTrack(event);

    if (!this.noTouchEvents) {
      this.#element.addEventListener('touchend', this.#end_bound, { signal: this.#abortDrag.signal });
      this.#element.addEventListener('touchmove', this.#drag_bound, { signal: this.#abortDrag.signal });
    }

    if (!this.noMouseEvents) {
      window.addEventListener('mouseup', this.#end_bound, { signal: this.#abortDrag.signal });
      window.addEventListener('mousemove', this.#drag_bound, { signal: this.#abortDrag.signal });
    }
  }

  #end(event) {
    if (this.#abortDrag) this.#abortDrag.abort();
    if (!this.#isDragging) return;

    // does this need to be on always
    if (this.#preventSwipeNavigation) {
      this.#pageContent.removeEventListener('touchstart', this.#preventSwipeNavigationHandler_bound, { signal: this.#abortMain.signal });
    }

    if (this.#lockScrollY) util.unlockPageScroll();

    const dragEvent = this.#track(event, 'mdwdragend');
    if (this.#overflowDrag) this.#trackOverscroll();
    if (this.#overflowDrag && (this.#overscrollTrackingDetails.overscrollX || this.#overscrollTrackingDetails.overscrollY)) {
      this.#isOverflowDragging = true;
      requestAnimationFrame(() => this.#overscroll(dragEvent));
    } else {
      this.#endPost(dragEvent);
    }
  }

  #endPost(event) {
    if (this.#hasScrollSnapPositions && !this.#isSnapped) {
      this.#snap(event);
    } else {
      this.#isDragging = false;
      this.#isSnapping = false;
      this.trigger(event);
    }
  }

  #drag(event) {
    // drag start
    if (!this.#isDragging) {
      this.#isDragging = true;
      const dragEvent = this.#track(event, 'mdwdragstart');
      this.trigger(dragEvent);

      if (this.#lockScrollY) util.lockPageScroll();

      // cancel or disable called from mdwdragstart canceling
      if (this.#isDragging === false) return;
    }


    if (this.#resetTrackingDetails) {
      this.#resetTrack(event);
      this.#resetTrackingDetails = false;
    }
    const dragEvent = this.#track(event, 'mdwdragmove');

    if (this.#lockScrollY) {
      if (event.preventDefault) event.preventDefault();
    }

    this.trigger(dragEvent);
    return dragEvent;
  }


  #track(event, eventType) {
    if (eventType !== 'mdwdragend') {
      const clientX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
      const clientY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY;
      const movementX = clientX - this.#trackingDetails.clientX;
      const movementY = clientY - this.#trackingDetails.clientY;
      const distanceX = clientX - this.#trackingDetails.clientXInitial;
      const distanceY = clientY - this.#trackingDetails.clientYInitial;
      const directionX = distanceX > this.#trackingDetails.distanceX ? 1 : distanceX === this.#trackingDetails.distanceX ? 0 : -1;
      const directionY = distanceY > this.#trackingDetails.distanceY ? 1 : distanceY === this.#trackingDetails.distanceY ? 0 : -1;
      const elapsedTime = Date.now() - this.#trackingDetails.timeStamp;

      this.#trackingDetails = {
        clientXInitial: this.#trackingDetails.clientXInitial,
        clientYInitial: this.#trackingDetails.clientYInitial,
        clientX,
        clientY,
        distanceX,
        distanceY,
        movementX,
        movementY,
        directionX,
        directionY,
        directionXDescription: directionX === 0 ? 'none' : directionX === 1 ? 'right' : 'left',
        directionYDescription: directionY === 0 ? 'none' : directionY === 1 ? 'down' : 'up',
        elapsedTime,
        timeStamp: Date.now(),
        velocityX: 0.4 * (1000 * movementX / (1 + elapsedTime)) + 0.2 * this.#trackingDetails.velocityX,
        velocityY: 0.4 * (1000 * movementY / (1 + elapsedTime)) + 0.2 * this.#trackingDetails.velocityY
      };
    }

    const dragEvent = new CustomEvent(eventType);
    dragEvent.clientX = this.#trackingDetails.clientX;
    dragEvent.clientY = this.#trackingDetails.clientY;
    dragEvent.distanceX = this.#trackingDetails.distanceX;
    dragEvent.distanceY = this.#trackingDetails.distanceY;
    dragEvent.movementX = this.#trackingDetails.movementX;
    dragEvent.movementY = this.#trackingDetails.movementY;
    dragEvent.directionX = this.#trackingDetails.directionX;
    dragEvent.directionY = this.#trackingDetails.directionY;
    dragEvent.directionXDescription = this.#trackingDetails.directionXDescription;
    dragEvent.directionYDescription = this.#trackingDetails.directionYDescription;
    // can be passed customEvents during overscroll and snap
    if (event.preventDefault) dragEvent.preventDefault = () => event.preventDefault();
    return dragEvent;
  }

  #resetTrack(event = { clientX: 0, clientY: 0 }) {
    const clientX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
    const clientY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY;
    this.#trackingDetails = {
      clientXInitial: clientX,
      clientYInitial: clientY,
      clientX,
      clientY,
      distanceX: 0,
      distanceY: 0,
      timeStamp: Date.now(),
      velocityX: 0,
      velocityY: 0
    };
  }

  #trackOverscroll() {
    const amplitudeX = 0.8 * this.#trackingDetails.velocityX;
    const amplitudeY = 0.8 * this.#trackingDetails.velocityY;
    this.#overscrollTrackingDetails = {
      overscrollX: this.#trackingDetails.velocityX > 10 || this.#trackingDetails.velocityX < -10,
      overscrollY: this.#trackingDetails.velocityY > 10 || this.#trackingDetails.velocityY < -10,
      amplitudeX,
      amplitudeY,
      scrollTargetX: Math.round(this.#trackingDetails.clientX + amplitudeX),
      scrollTargetY: Math.round(this.#trackingDetails.clientY + amplitudeY),
      overscrollTimestamp: Date.now()
    };
  }

  #preventSwipeNavigationHandler(event) {
    // if (event.pageX < 20 || event.pageX > window.visualViewport.width - 20) {
    if (event.pageX < 20 || event.pageX > window.innerWidth - 20) {
      event.preventDefault();
    }
  }

  #snap(event) {
    this.#isSnapping = true;
    const nextScrollLeft = this.element.scrollLeft;
    const nextScrollTop = this.element.scrollTop;
    const directionPercent = event.directionX === 1 ? 0.76 : 0.24; // preference towards the next element
    const hasX = this.#scrollSnapPositions[0].x !== undefined;
    const hasY = this.#scrollSnapPositions[0].y !== undefined;
    let target;
    if (hasX && hasY) target = this.#nearestCoord(nextScrollLeft, nextScrollTop, directionPercent);
    else {
      const value = this.#nearestSingle(hasX ? nextScrollLeft : nextScrollTop, directionPercent);
      target = {
        [hasX ? 'x' : 'y']: value,
        [hasX ? 'y' : 'x']: 0
      };
    }
    requestAnimationFrame(() => this.#snapMove(target, event, event.directionX, event.directionY));
  }

  #nearestSingle(target, directionPercent) {
    return this.#scrollSnapPositions.map(v => v.x !== undefined ? v.x : v.y).reduce((a, b) => {
      if (target > b) return b;
      const percent = (target - a) / (b - a);
      return percent > directionPercent ? b : a;
    });
  }

  #nearestCoord(x, y, directionPercent) {
    return this.#scrollSnapPositions.reduce((a, b) => {
      if (x > b.x || y > b.y) return b;
      const percentX = (x - a.x) / (b.x - a.y);
      const percentY = (y - a.y) / (b.y - a.y);
      return percentX > directionPercent && percentY > directionPercent ? b : a;
    });
  }

  #snapMove(target, lastEvent, previousDirectionX, previousDirectionY) {
    if (!this.#isSnapping) return;

    const diffX = target.x - this.element.scrollLeft;
    const diffY = target.y - this.element.scrollTop;
    const isBounceBackX = (previousDirectionX < 0 && diffX < 0) || (previousDirectionX > 0 && diffX > 0);
    const isBounceBackY = (previousDirectionY < 0 && diffX < 0) || (previousDirectionY > 0 && diffX > 0);
    let percent = Math.exp(-(Date.now() - this.#trackingDetails.timeStamp) / this.#timeConstant) * 0.2;
    // speed change for reverse
    if (isBounceBackX || isBounceBackY) percent *= 0.5;

    const movementX = -diffX * percent;
    const movementY = -diffY * percent;
    const isMaxScrollX = (this.#element.scrollWidth === this.#element.offsetWidth) || this.#element.scrollWidth - this.#element.offsetWidth === this.#element.scrollLeft;
    const isMaxScrollY = (this.#element.scrollHeight === this.#element.offsetHeight) || this.#element.scrollHeight - this.#element.offsetHeight === this.#element.scrollTop;
    const keepScrollingX = (movementX > 1 || movementX < -1) && !isMaxScrollX;
    const keepScrollingY = (movementY > 1 || movementY < -1) && !isMaxScrollY;
    if (!keepScrollingX && !keepScrollingY) {
      this.#isSnapped = true;
      this.#endPost(lastEvent);
      return;
    }

    const clientX = lastEvent.changedTouches ? lastEvent.changedTouches[0].clientX : lastEvent.clientX;
    const clientY = lastEvent.changedTouches ? lastEvent.changedTouches[0].clientY : lastEvent.clientY;
    const dragEvent = this.#drag({
      clientX: clientX + movementX,
      clientY: clientY + movementY
    });
    requestAnimationFrame(() => this.#snapMove(target, dragEvent, previousDirectionX, previousDirectionY));
  }

  #overscroll(event) {
    if (this.#isOverflowDragging === false) return;

    const elapsed = Date.now() - this.#overscrollTrackingDetails.overscrollTimestamp;
    const deltaX = -this.#overscrollTrackingDetails.amplitudeX * Math.exp(-elapsed / this.#timeConstant);
    const deltaY = -this.#overscrollTrackingDetails.amplitudeY * Math.exp(-elapsed / this.#timeConstant);
    const keepScrollingX = deltaX > 1 || deltaX < -1;
    const keepScrollingY = deltaY > 1 || deltaY < -1;
    if ((!keepScrollingX && !keepScrollingY) || (this.#hasScrollSnapPositions && Math.abs(deltaX) < 140)) {
      this.#endPost(this.#track(event, 'mdwdragend'));
      return;
    }

    const clientX = keepScrollingX ? this.#overscrollTrackingDetails.scrollTargetX + deltaX : this.#overscrollTrackingDetails.scrollTargetX;
    const clientY = keepScrollingY ? this.#overscrollTrackingDetails.scrollTargetY + deltaY : this.#overscrollTrackingDetails.scrollTargetY;
    const movementX = clientX - event.clientX;
    const movementY = clientY - event.clientY;

    const dragEvent = this.#drag({
      clientX: event.clientX + movementX,
      clientY: event.clientY + movementY
    });
    requestAnimationFrame(() => this.#overscroll(dragEvent));
  }
}
