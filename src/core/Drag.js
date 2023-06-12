import util from './util.js';
import device from './device.js';


export default class Drag {
  #element;
  #includeMouseEvents = false;
  #isDragging = false;
  #touchstart_bound = this.#touchstart.bind(this);
  #touchend_bound = this.#touchend.bind(this);
  #touchmove_throttled = util.rafThrottle(this.#touchmove.bind(this));

  #onDragCallbacks = [];
  #onStartCallbacks = [];
  #onEndCallbacks = [];
  #ignoreElements = [];
  #lastDistance;
  #initialTouchPos;
  #currentTouchPosition;
  #totalDistance;
  #startTime;
  #lastTouchPos = { x: 0, y: 0 };
  #lockScrollY = false;
  #lockScrollThreshold = 12;
  #desktopOnly = false;
  #enabled;
  #abort;
  #touchAbort;
  
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

  get includeMouseEvents() {
    return this.#includeMouseEvents;
  }
  set includeMouseEvents(value) {
    this.#includeMouseEvents = !!value;
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

  get desktopOnly() {
    return this.#desktopOnly;
  }
  set desktopOnly(value) {
    this.#desktopOnly = !!value;
  }
  

  enable() {
    if (this.#enabled) return;
    this.#enabled = true;
    this.#abort = new AbortController();

    if (this.#desktopOnly && !device.isMobile) {
      this.#element.addEventListener('mousedown', this.#touchstart_bound, { signal: this.#abort.signal });
    } else {
      this.#element.addEventListener('touchstart', this.#touchstart_bound, { signal: this.#abort.signal });
      if (this.#includeMouseEvents === true) this.#element.addEventListener('mousedown', this.#touchstart_bound, { signal: this.#abort.signal });
    }
  }

  disable() {
    if (this.#abort) this.#abort.abort();
    if (this.#touchAbort) this.#touchAbort.abort();
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

  resetDistance() {
    this.#initialTouchPos = this.#currentTouchPosition;
  }

  addIgnoreElement(element) {
    this.#ignoreElements.push(element);
  }

  emptyIgnoreElements() {
    this.#ignoreElements = [];
  }

  #touchstart(event) {
    // TODO why did i add this?
    // if (event.button !== 0) return;
    if (this.#ignoreElements.find(v => v === event.target || v.contains(event.target))) return;
    this.#startTime = Date.now();
    this.#initialTouchPos = this.#getTouchPosition(event);
    this.#lastDistance = this.#getDistance(event);
    this.#totalDistance = this.#getDistance(event);
    this.#onStartCallbacks.forEach(callback => callback({
      event,
      element: this.#element
    }));
    this.#touchAbort = new AbortController();

    if (!this.#desktopOnly) {
      this.#element.addEventListener('touchend', this.#touchend_bound, { signal: this.#touchAbort.signal });
      this.#element.addEventListener('touchmove', this.#touchmove_throttled, { signal: this.#touchAbort.signal });
    }

    if (this.#includeMouseEvents || this.#desktopOnly) {
      window.addEventListener('mouseup', this.#touchend_bound, { signal: this.#touchAbort.signal });
      window.addEventListener('mousemove', this.#touchmove_throttled, { signal: this.#touchAbort.signal });
    }

    this.#isDragging = true;
  }

  #touchend(event) {
    this.#touchAbort.abort();

    const distance = this.#getDistance(event);
    if (this.#lockScrollY) util.unlockPageScroll();

    this.#onEndCallbacks.forEach(callback => callback({
      distance,
      direction: this.#getDirection({ x: 0, y: 0 }, distance),
      velocity: this.#getVelocity(distance, Date.now() - this.#startTime),
      event,
      element: this.#element
    }));
  }

  #touchmove(event) {
    this.#currentTouchPosition = this.#getTouchPosition(event);
    const distance = this.#getDistance(event);
    this.#totalDistance.x += distance.x;
    this.#totalDistance.y += distance.y;
    this.#totalDistance.moveX += distance.moveX;
    this.#totalDistance.moveY += distance.moveY;
    if (this.#lockScrollY) {
      if (Math.abs(this.#totalDistance.moveX) > this.#lockScrollThreshold) util.lockPageScroll();
    }
    this.#onDragCallbacks.forEach(callback => callback({
      distance,
      direction: this.#getDirection(this.#lastDistance, distance),
      event,
      element: this.#element
    }));
    this.#lastDistance = distance;

    this.#isDragging = false;
  }

  #getDistance(event) {
    const xy = this.#getTouchPosition(event);
    const last = this.#lastTouchPos;
    this.#lastTouchPos = xy;
    return {
      x: xy.x - this.#initialTouchPos.x,
      y: xy.y - this.#initialTouchPos.y,
      moveX: xy.x - last.x,
      moveY: xy.y - last.y
    };
  }

  #getDirection(previous, current) {
    const x = current.x > previous.x ? 1 : current.x === previous.x ? 0 : -1;
    const y = current.y > previous.y ? 1 : current.y === previous.y ? 0 : -1;
    return {
      x, y,
      xDescription: x === 0 ? 'none' : x === 1 ? 'right' : 'left',
      yDescription: y === 0 ? 'none' : y === 1 ? 'down' : 'up'
    };
  }

  #getVelocity(distance, time) {
    return {
      x: distance.x / time,
      y: distance.y / time
    };
  }

  #getTouchPosition(event) {
    return {
      x: event.changedTouches ? event.changedTouches[0].clientX : event.clientX,
      y: event.changedTouches ? event.changedTouches[0].clientY : event.clientY,
    }
  }
}
