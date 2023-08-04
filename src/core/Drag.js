import util from './util.js';
import device from './device.js';

export default class Drag {
  #element;
  #isDragging = false;
  #onDragCallbacks = [];
  #onStartCallbacks = [];
  #onEndCallbacks = [];
  #ignoreElements = [];
  #lockScrollY = false;
  #lockScrollThreshold = 12;
  #noTouchEvents = false;
  #noMouseEvents = false;
  #enabled;
  #abort;
  #touchAbort;
  #isOverflowDragging = false;
  #overflowDrag = false;
  #dragStart_bound = this.#dragStart.bind(this);
  #dragEnd_bound = this.#dragEnd.bind(this);
  #dragMove_bound = this.#dragMove.bind(this);
  #timeConstant = 325;
  #trackingDetails;
  #releaseDetails;
  
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

  get overflowDrag() {
    return this.#overflowDrag;
  }
  set overflowDrag(value) {
    this.#overflowDrag = !!value;
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
  

  enable() {
    if (this.#enabled) return;
    this.#enabled = true;
    this.#abort = new AbortController();

    if (!this.noMouseEvents) this.#element.addEventListener('mousedown', this.#dragStart_bound, { signal: this.#abort.signal });
    if (!this.noTouchEvents) this.#element.addEventListener('touchstart', this.#dragStart_bound, { signal: this.#abort.signal });
  }

  disable() {
    if (this.#abort) this.#abort.abort();
    if (this.#touchAbort) this.#touchAbort.abort();
    this.#isDragging = false;
    this.#enabled = false;
  }

  cancel() {
    if (this.#touchAbort) this.#touchAbort.abort();
    this.#isDragging = false;
  }

  destroy() {
    this.disable();
    this.#element = undefined;
    util.unlockPageScroll();
  }

  onDrag(callback = () => { }) {
    this.#onDragCallbacks.push(callback);
  }

  onStart(callback = () => { }) {
    this.#onStartCallbacks.push(callback);
  }

  onEnd(callback = () => { }) {
    this.#onEndCallbacks.push(callback);
  }
  addIgnoreElement(element) {
    this.#ignoreElements.push(element);
  }

  emptyIgnoreElements() {
    this.#ignoreElements = [];
  }


  #dragStart(event) {
    if (event.which === 3) {
      this.#dragEnd(event);
      return;
    }
    if (this.#ignoreElements.find(v => v === event.target || v.contains(event.target))) return;

    this.#trackInitialize(event);
    this.#isOverflowDragging = false;
    this.#touchAbort = new AbortController();

    if (!this.noTouchEvents) {
      this.#element.addEventListener('touchend', this.#dragEnd_bound, { signal: this.#touchAbort.signal });
      this.#element.addEventListener('touchmove', this.#dragMove_bound, { signal: this.#touchAbort.signal });
    }

    if (!this.noMouseEvents) {
      window.addEventListener('mouseup', this.#dragEnd_bound, { signal: this.#touchAbort.signal });
      window.addEventListener('mousemove', this.#dragMove_bound, { signal: this.#touchAbort.signal });
    }
  }

  #dragEnd(event) {
    this.#touchAbort.abort();
    if (!this.#isDragging) return;
    this.#isDragging = false;

    this.#trackRelease();
    if (this.#overflowDrag && (this.#releaseDetails.overscrollX || this.#releaseDetails.overscrollY)) {
      this.#isOverflowDragging = true;
      requestAnimationFrame(() => this.#overscroll(event));
    } else this.#removeDragEnd(event);
  }

  #removeDragEnd(event) {
    this.#isOverflowDragging = false;
    if (this.#lockScrollY) util.unlockPageScroll();
    this.#onEndCallbacks.forEach(callback => callback({
      ...this.#releaseDetails,
      ...this.#trackingDetails,
      event,
      element: this.#element
    }));
  }

  #dragMove(event) {
    if (!this.#isDragging && !this.#isOverflowDragging) {
      this.#isDragging = true;
      this.#onStartCallbacks.forEach(callback => callback({
        ...this.#trackingDetails,
        event,
        element: this.#element
      }));

      // cancel or disable called from onStartCallback
      if (this.#isDragging === false) return;
    }

    this.#track(event);

    if (this.#lockScrollY) {
      if (Math.abs(this.#trackingDetails.distanceX) > this.#lockScrollThreshold) {
        util.lockPageScroll();
        event.preventDefault();
      }
    }
    this.#onDragCallbacks.forEach(callback => callback({
      ...this.#trackingDetails,
      event,
      element: this.#element
    }));
  }

  #overscroll(event) {
    if (this.#isOverflowDragging === false) return;

    const elapsed = Date.now() - this.#releaseDetails.overscrollTimestamp;
    const deltaX = -this.#releaseDetails.amplitudeX * Math.exp(-elapsed / this.#timeConstant);
    const deltaY = -this.#releaseDetails.amplitudeY * Math.exp(-elapsed / this.#timeConstant);
    const keepScrolling = deltaX > 0.5 || deltaX < -0.5 || deltaY > 0.5 || deltaY < -0.5;
    const clientX = keepScrolling ? this.#releaseDetails.scrollTargetX + deltaX : this.#releaseDetails.scrollTargetX;
    const clientY = keepScrolling ? this.#releaseDetails.scrollTargetY + deltaY : this.#releaseDetails.scrollTargetY;
    const moveX = clientX - this.#trackingDetails.clientX;
    const moveY = clientY - this.#trackingDetails.clientY;
    const EventConstructor = event.type.startsWith('mouse') ? MouseEvent : TouchEvent;
    const eventType = event.type.startsWith('mouse') ? 'mousemove' : 'touchmove';
    const changedTouches = event.changedTouches ? [] : undefined;

    if (event.changedTouches && event.changedTouches.length > 0) {
      changedTouches[0] = {
        clientX: event.changedTouches[0].clientX + (keepScrolling ? moveX : 0),
        clientY: event.changedTouches[0].clientY + + (keepScrolling ? moveY : 0)
      };
    }
    
    const newEvent = new EventConstructor(eventType, {
      clientX: event.clientX + moveX,
      clientY: event.clientY + moveY,
      layerX: event.layerX + moveX,
      layerY: event.layerY + moveY,
      screenX: event.screenX + moveX,
      screenY: event.screenY + moveY,
      offsetX: event.offsetX + moveX,
      offsetY: event.offsetY + moveY,
      pageX: event.pageX + moveX,
      pageY: event.pageY + moveY,
      x: event.x + moveX,
      y: event.y + moveY,
      view: window,
      relatedTarget: this.#element,
      changedTouches
    });

    this.#dragMove(newEvent);
    if (keepScrolling) {
      requestAnimationFrame(() => this.#overscroll(newEvent));
    } else {
      const endEvent = new EventConstructor(eventType, {
        clientX: event.clientX,
        clientY: event.clientY,
        layerX: event.layerX,
        layerY: event.layerY,
        screenX: event.screenX,
        screenY: event.screenY,
        offsetX: event.offsetX,
        offsetY: event.offsetY,
        pageX: event.pageX,
        pageY: event.pageY,
        x: event.x,
        y: event.y,
        view: window,
        relatedTarget: this.#element,
        changedTouches
      });
      this.#removeDragEnd(endEvent);
    }
  }

  #trackInitialize({ changedTouches, clientX, clientY}) {
    clientX = changedTouches ? changedTouches[0].clientX : clientX;
    clientY = changedTouches ? changedTouches[0].clientY : clientY;
    this.#trackingDetails = {
      initial: true,
      clientXInitial: clientX,
      clientYInitial: clientY,
      clientX,
      clientY,
      distanceX: 0,
      distanceY: 0,
      moveX: 0,
      moveY: 0,
      directionX: 0,
      directionY: 0,
      directionXDescription: 'none',
      directionYDescription: 'none',
      elapsedTime: 0,
      timeStamp: Date.now(),
      velocityX: 0,
      velocityY: 0
    };
  }

  #track({ changedTouches, clientX, clientY }) {
    clientX = changedTouches ? changedTouches[0].clientX : clientX;
    clientY = changedTouches ? changedTouches[0].clientY : clientY;
    const moveX = clientX - this.#trackingDetails.clientX;
    const moveY = clientY - this.#trackingDetails.clientY;
    const distanceX = clientX - this.#trackingDetails.clientXInitial;
    const distanceY = clientY - this.#trackingDetails.clientYInitial;
    const directionX = distanceX > this.#trackingDetails.distanceX ? 1 : distanceX === this.#trackingDetails.distanceX ? 0 : -1;
    const directionY = distanceY > this.#trackingDetails.distanceY ? 1 : distanceY === this.#trackingDetails.distanceY ? 0 : -1;
    const elapsedTime = Date.now() - this.#trackingDetails.timeStamp;

    this.#trackingDetails = {
      initial: false,
      clientXInitial: this.#trackingDetails.clientXInitial,
      clientYInitial: this.#trackingDetails.clientYInitial,
      clientX,
      clientY,
      distanceX,
      distanceY,
      moveX,
      moveY,
      directionX,
      directionY,
      directionXDescription: directionX === 0 ? 'none' : directionX === 1 ? 'right' : 'left',
      directionYDescription: directionY === 0 ? 'none' : directionY === 1 ? 'down' : 'up',
      elapsedTime,
      timeStamp: Date.now(),
      velocityX: 0.4 * (1000 * moveX / (1 + elapsedTime)) + 0.2 * this.#trackingDetails.velocityX,
      velocityY: 0.4 * (1000 * moveY / (1 + elapsedTime)) + 0.2 * this.#trackingDetails.velocityY
    };
  }

  #trackRelease() {
    const amplitudeX = 0.8 * this.#trackingDetails.velocityX;
    const amplitudeY = 0.8 * this.#trackingDetails.velocityY;
    this.#releaseDetails = {
      overscrollX: this.#trackingDetails.velocityX > 10 || this.#trackingDetails.velocityX < -10,
      overscrollY: this.#trackingDetails.velocityY > 10 || this.#trackingDetails.velocityY < -10,
      amplitudeX,
      amplitudeY,
      scrollTargetX: Math.round(this.#trackingDetails.clientX + amplitudeX),
      scrollTargetY: Math.round(this.#trackingDetails.clientY + amplitudeY),
      overscrollTimestamp: Date.now()
    };
  }
}
