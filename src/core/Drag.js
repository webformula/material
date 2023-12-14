import util from './util.js';
import device from './device.js';

const defaultConfig = {
  disableMouseEvents: false,
  disableTouchEvents: !device.hasTouchScreen,
  lockScrollY: false,
  ignoreElements: [],
  swipeVelocityThreshold: 0.3,
  swipeDistanceThreshold: 10,
  reorder: false,
  reorderSwap: false,
  reorderHorizontalOnly: false,
  reorderVerticalOnly: false,
  reorderAnimation: true,
  reorderScrollDelayMS: 250,
  overflowDrag: false,
  scrollSnapPositions: []
};

export default class Drag {
  #element;
  #abortMain;
  #abortDrag;
  #trackingDetails;
  #overscrollTrackingDetails;
  #reorderElementsAndBounds;
  #enabled = false;
  #isDragging = false;
  #resetTrackingDetails = false;
  #swapOffsetY = 0;
  #swapOffsetX = 0;
  #swapLastClosestIndex;
  #reorderAnimateTimestamp;
  #dragOffsetPosition = 0;
  #overflowTimeConstant = 150;
  #stopOverscroll = false;
  #isSnapped = false;
  #stopSnapping = false;
  #listeners = {
    'mdwdragmove': [],
    'mdwdragstart': [],
    'mdwdragend': [],
    'mdwdragreorder': []
  };

  #drag_bound = this.#drag.bind(this);
  #start_bound = this.#start.bind(this);
  #end_bound = this.#end.bind(this);

  #disableMouseEvents = false;
  #disableTouchEvents = !device.hasTouchScreen;
  #lockScrollY = false;
  #ignoreElements = [];
  #swipeVelocityThreshold = 0.3;
  #swipeDistanceThreshold = 10;
  #reorderSwap = false;
  #reorder = false;
  #reorderHorizontalOnly = false;
  #reorderVerticalOnly = false;
  #reorderAnimation = true;
  #reorderScrollDelayMS = 250;
  #overflowDrag = false;
  #scrollSnapPositions = [];
  // #preventSwipeNavigation = false;


  constructor(element, config = defaultConfig) {
    if (!(element instanceof HTMLElement)) throw Error('HTMLElement required');
    config = {
      ...defaultConfig,
      ...config
    };
    this.#element = element;
    this.#disableMouseEvents = config.disableMouseEvents;
    this.#disableTouchEvents = config.disableTouchEvents;
    this.#lockScrollY = config.lockScrollY;
    this.#ignoreElements = config.ignoreElements;
    this.#swipeVelocityThreshold = config.swipeVelocityThreshold;
    this.#swipeDistanceThreshold = config.swipeDistanceThreshold;
    this.#reorder = config.reorder;
    this.#reorderSwap = config.reorderSwap;
    this.reorderHorizontalOnly = config.reorderHorizontalOnly;
    this.reorderVerticalOnly = config.reorderVerticalOnly;
    this.#reorderAnimation = config.reorderAnimation;
    this.#reorderScrollDelayMS = config.reorderScrollDelayMS;
    this.#overflowDrag = config.overflowDrag;
    this.#scrollSnapPositions = config.scrollSnapPositions;
  }

  get disableMouseEvents() {
    return this.#disableMouseEvents;
  }
  set disableMouseEvents(value) {
    this.#disableMouseEvents = !!value;
  }

  get disableTouchEvents() {
    return this.#disableTouchEvents;
  }
  set disableTouchEvents(value) {
    this.#disableTouchEvents = !!value;
  }

  get lockScrollY() {
    return this.#lockScrollY;
  }
  set lockScrollY(value) {
    this.#lockScrollY = !!value;
  }

  get reorder() {
    return this.#reorder;
  }
  set reorder(value) {
    this.#reorder = !!value;
  }

  get reorderSwap() {
    return this.#reorderSwap;
  }
  set reorderSwap(value) {
    this.#reorderSwap = !!value;
  }

  get reorderHorizontalOnly() {
    return this.#reorderHorizontalOnly;
  }
  set reorderHorizontalOnly(value) {
    this.#reorderHorizontalOnly = !!value;
    if (this.#reorderHorizontalOnly) this.#reorderVerticalOnly = false;
  }

  get reorderVerticalOnly() {
    return this.#reorderVerticalOnly;
  }
  set reorderVerticalOnly(value) {
    this.#reorderVerticalOnly = !!value;
    if (this.#reorderVerticalOnly) this.#reorderHorizontalOnly = false;
  }

  get reorderAnimation() {
    return this.#reorderAnimation;
  }
  set reorderAnimation(value) {
    this.#reorderAnimation = !!value;
  }

  get reorderScrollDelayMS() {
    return this.#reorderScrollDelayMS;
  }
  set reorderScrollDelayMS(value) {
    this.#reorderScrollDelayMS = value;
  }

  get overflowDrag() {
    return this.#overflowDrag;
  }
  set overflowDrag(value) {
    this.#overflowDrag = !!value;
  }

  get scrollSnapPositions() {
    return this.#scrollSnapPositions;
  }
  set scrollSnapPositions(value) {
    if (Array.isArray(value)) this.#scrollSnapPositions = value;
    else this.#scrollSnapPositions = [];
  }


  enable() {
    if (this.#enabled) return;
    this.#enabled = true;
    this.#abortMain = new AbortController();

    if (this.#reorder) {
      util.addLongPressListener(this.#element, this.#start_bound, {
        disableMouseEvents: this.#disableMouseEvents,
        disableTouchEvents: this.#disableTouchEvents
      });
    } else {
      if (!this.#disableMouseEvents) this.#element.addEventListener('mousedown', this.#start_bound, { signal: this.#abortMain.signal });
      if (!this.#disableTouchEvents) {
        this.#element.addEventListener('touchstart', this.#start_bound, { signal: this.#abortMain.signal });
        // this.#pageContent = document.querySelector('#page-content') || document.querySelector('page-content');
      }
    }
  }

  disable() {
    if (this.#abortMain) this.#abortMain.abort();
    util.removeLongPressListener(this.#element, this.#start_bound);
    this.#enabled = false;
    this.cancel();
    if (this.#lockScrollY) util.unlockPageScroll();
  }

  cancel() {
    if (this.#abortDrag) this.#abortDrag.abort();
    this.#element.classList.remove('mdw-drag-active');
    this.#element.classList.remove('mdw-drag-reorder-active');
    this.#cleanupReorder();
    this.#isDragging = false;
    if (this.#lockScrollY) util.unlockPageScroll();
  }

  destroy() {
    this.disable();
    this.#element = undefined;
    this.#listeners = {};
  }

  resetTracking() {
    this.#resetTrackingDetails = true;
  }

  on(eventType, callback) {
    if (!this.#listeners[eventType]) throw Error('Invalid eventType. Valid events: mdwdragmove, mdwdragstart, mdwdragend, mdwdragreorder');
    this.#listeners[eventType].push(callback);
  }

  off(eventType, callback) {
    if (!this.#listeners[eventType]) throw Error('Invalid eventType. Valid events: mdwdragmove, mdwdragstart, mdwdragend, mdwdragreorder');
    if (this.#listeners[eventType].includes(callback)) this.#listeners[eventType].splice(this.#listeners[eventType].indexOf(callback), 1);
  }

  addIgnoreElement(element) {
    this.#ignoreElements.push(element);
  }

  emptyIgnoreElements() {
    this.#ignoreElements = [];
  }

  #trigger(event) {
    if (!this.#listeners[event.type]) return;
    this.#element.dispatchEvent(event);
    this.#listeners[event.type].forEach(callback => callback(event));
  }

  #start(event) {
    this.#resetTrackingDetails = false;

    // // does this need to be on always
    // if (this.#preventSwipeNavigation) {
    //   // TODO do i need passive: false?
    //   this.#pageContent.addEventListener('touchstart', this.#preventSwipeNavigationHandler_bound, { signal: this.#abortMain.signal });
    // }

    // right click
    if (event.which === 3) {
      if (this.#isDragging) this.#end(event);
      return;
    }
    if (this.#ignoreElements.find(v => v === event.target || v.contains(event.target))) return;

    this.#isSnapped = false;
    this.#stopOverscroll = true;
    this.#stopSnapping = true;

    this.#isDragging = false;
    if (this.#abortDrag) this.#abortDrag.abort();
    this.#abortDrag = new AbortController();
    this.#resetTrack(event);

    if (this.#reorder) this.#setupReorder();

    if (!this.#disableTouchEvents) {
      // this break click
      // if (this.#lockScrollY && event.preventDefault) event.preventDefault(); // prevents click
      this.#element.addEventListener('touchend', this.#end_bound, { signal: this.#abortDrag.signal });
      this.#element.addEventListener('touchmove', this.#drag_bound, { passive: false, signal: this.#abortDrag.signal });
    }

    if (!this.#disableMouseEvents) {
      window.addEventListener('mouseup', this.#end_bound, { signal: this.#abortDrag.signal });
      window.addEventListener('mousemove', this.#drag_bound, { signal: this.#abortDrag.signal });
    }

    this.#isDragging = true;
    this.#element.classList.add('mdw-drag-active');
    const dragEvent = this.#track(event, 'mdwdragstart');
    if (this.#lockScrollY) util.lockPageScroll();
    this.#trigger(dragEvent);
  }

  #end(event) {
    if (this.#abortDrag) this.#abortDrag.abort();
    if (!this.#isDragging) return;

    // // does this need to be on always
    // if (this.#preventSwipeNavigation) {
    //   this.#pageContent.removeEventListener('touchstart', this.#preventSwipeNavigationHandler_bound, { signal: this.#abortMain.signal });
    // }

    if (this.#lockScrollY || this.#reorder) util.unlockPageScroll();
    const dragEvent = this.#track(event, 'mdwdragend');
    if (this.#overflowDrag) this.#startOverscroll(dragEvent);
    else this.#endFinal(dragEvent);
  }

  #endFinal(event) {
    if (this.#scrollSnapPositions && this.#scrollSnapPositions.length > 0 && !this.#isSnapped) return this.#snap(event)
    this.#element.classList.remove('mdw-drag-active');
    if (this.#reorder) this.#endReorder();
    this.#isDragging = false;
    this.#trigger(event);
  }

  #drag(event) {
    // cancel or disable called from mdwdragstart canceling
    if (this.#isDragging === false) return;
  
    if (this.#resetTrackingDetails) {
      this.#resetTrack(event);
      this.#resetTrackingDetails = false;
    }
    if (event.preventDefault && (this.#lockScrollY || this.#reorder)) event.preventDefault();
    const dragEvent = this.#track(event, 'mdwdragmove');
    
    if (this.#reorder) this.#reorderDrag(dragEvent);

    this.#trigger(dragEvent);
    return dragEvent;
  }



  #getClientPosition(event) {
    return {
      clientX: event.changedTouches ? event.changedTouches[0].clientX : event.clientX,
      clientY: event.changedTouches ? event.changedTouches[0].clientY : event.clientY
    };
  }

  // Note: distance and distanceDelta will always be positive because of squaring the x y distances
  #getDistance(x, y, previousX, previousY, initialX, initialY) {
    const distanceX = x - initialX;
    const distanceY = y - initialY;
    const distanceDeltaX = x - previousX;
    const distanceDeltaY = y - previousY;
    return {
      distanceX,
      distanceY,
      distance: Math.sqrt((distanceX * distanceX) + (distanceY * distanceY)),
      distanceDeltaX,
      distanceDeltaY,
      distanceDelta: Math.sqrt((distanceDeltaX * distanceDeltaX) + (distanceDeltaY * distanceDeltaY))
    };
  }

  #getDirection({ distanceX, distanceY, distanceDeltaX, distanceDeltaY }) {
    let direction = 'none';
    if (Math.abs(distanceX) > Math.abs(distanceY)) direction = distanceX < 0 ? 'left' : 'right';
    else direction = distanceY < 0 ? 'up' : 'down';

    let directionDelta = 'none';
    if (Math.abs(distanceDeltaX) > Math.abs(distanceDeltaY)) directionDelta = distanceDeltaX < 0 ? 'left' : 'right';
    else directionDelta = distanceDeltaY < 0 ? 'up' : 'down';

    return {
      directionX: distanceX === 0 ? 0 : distanceX > 0 ? 1 : -1,
      directionY: distanceY === 0 ? 0 : distanceY > 0 ? 1 : -1,
      direction,
      directionDeltaX: distanceDeltaX === 0 ? 0 : distanceDeltaX > 0 ? 1 : -1,
      directionDeltaY: distanceDeltaY === 0 ? 0 : distanceDeltaY > 0 ? 1 : -1,
      directionDelta
    };
  }

  #getVelocity(distance, elapsedTime, elapsedTimeDelta, previousVelocityDeltaX, previousVelocityDeltaY, previousVelocityDelta) {
    const velocityX = distance.distanceX / elapsedTime;
    const velocityY = distance.distanceY / elapsedTime;
    const velocity = distance.distance / elapsedTime;
    const velocityDeltaX = 0.4 * (1000 * distance.distanceDeltaX / (1 + elapsedTimeDelta)) + 0.2 * previousVelocityDeltaX;
    const velocityDeltaY = 0.4 * (1000 * distance.distanceDeltaY / (1 + elapsedTimeDelta)) + 0.2 * previousVelocityDeltaY;
    const velocityDelta = 0.4 * (1000 * distance.distanceDelta / (1 + elapsedTimeDelta)) + 0.2 * previousVelocityDelta;
    return {
      velocityX,
      velocityY,
      velocity,
      velocityDeltaX,
      velocityDeltaY,
      velocityDelta
    };
  }

  #getSwipe({
    pointers,
    distanceX,
    distanceY,
    distance,
    velocity,
    velocityX,
    velocityY
  }) {
    const hasPointer = pointers === 1;
    return {
      swipeX: hasPointer && Math.abs(distanceX) > this.#swipeDistanceThreshold && Math.abs(velocityX) > this.#swipeVelocityThreshold,
      swipeY: hasPointer && Math.abs(distanceY) > this.#swipeDistanceThreshold && Math.abs(velocityY) > this.#swipeVelocityThreshold,
      swipe: hasPointer && distance > this.#swipeDistanceThreshold && Math.abs(velocity) > this.#swipeVelocityThreshold
    };
  }

  #resetTrack(event = { clientX: 0, clientY: 0 }) {
    const client = this.#getClientPosition(event);
    this.#trackingDetails = {
      clientInitialX: client.clientX,
      clientInitialY: client.clientY,
      ...client,
      distanceX: 0,
      distanceY: 0,
      distance: 0,
      distanceDeltaX: 0,
      distanceDeltaY: 0,
      distanceDelta: 0,
      elapsedTime: 0,
      elapsedTimeDelta: 0,
      pointers: 0,
      timeStamp: Date.now(),
      timeStampDelta: Date.now(),
      velocityX: 0,
      velocityY: 0,
      velocity: 0,
      velocityDeltaX: 0,
      velocityDeltaY: 0,
      velocityDelta: 0
    };
  }

  #track(event, eventType) {
    // if (eventType !== 'mdwdragend') {
      const client = this.#getClientPosition(event);
      const clientInitialX = this.#trackingDetails.clientInitialX || client.clientX;
      const clientInitialY = this.#trackingDetails.clientInitialY || client.clientY;
      const distance = this.#getDistance(
        client.clientX,
        client.clientY,
        this.#trackingDetails.clientX,
        this.#trackingDetails.clientY,
        clientInitialX,
        clientInitialY
      );
      const direction = this.#getDirection(distance);
      const timeStampDelta = Date.now();
      const timeStamp = this.#trackingDetails.timeStamp || timeStampDelta;
      const elapsedTime = timeStampDelta - this.#trackingDetails.timeStamp;
      const elapsedTimeDelta = timeStampDelta - this.#trackingDetails.timeStampDelta;
      const pointers = event.changedTouches ? event.changedTouches.length : 1;
      const velocity = this.#getVelocity(
        distance,
        elapsedTime,
        elapsedTimeDelta,
        this.#trackingDetails.velocityDeltaX,
        this.#trackingDetails.velocityDeltaY,
        this.#trackingDetails.velocityDelta
      );

      this.#trackingDetails = {
        ...client,
        clientInitialX,
        clientInitialY,
        ...distance,
        ...direction,
        elapsedTime,
        elapsedTimeDelta,
        pointers,
        timeStamp,
        timeStampDelta,
        ...velocity,
      };
    // }

    const dragEvent = new CustomEvent(eventType);
    dragEvent.clientX = this.#trackingDetails.clientX;
    dragEvent.clientY = this.#trackingDetails.clientY;
    dragEvent.distanceX = this.#trackingDetails.distanceX;
    dragEvent.distanceY = this.#trackingDetails.distanceY;
    dragEvent.distance = this.#trackingDetails.distance;
    dragEvent.distanceDeltaX = this.#trackingDetails.distanceDeltaX;
    dragEvent.distanceDeltaY = this.#trackingDetails.distanceDeltaY;
    dragEvent.distanceDelta = this.#trackingDetails.distanceDelta;
    dragEvent.directionX = this.#trackingDetails.directionX;
    dragEvent.directionY = this.#trackingDetails.directionY;
    dragEvent.direction = this.#trackingDetails.direction;
    dragEvent.directionDeltaX = this.#trackingDetails.directionDeltaX;
    dragEvent.directionDeltaY = this.#trackingDetails.directionDeltaY;
    dragEvent.directionDelta = this.#trackingDetails.directionDelta;
    dragEvent.velocityX = this.#trackingDetails.velocityX;
    dragEvent.velocityY = this.#trackingDetails.velocityY;
    dragEvent.velocity = this.#trackingDetails.velocity;
    dragEvent.velocityDeltaX = this.#trackingDetails.velocityDeltaX;
    dragEvent.velocityDeltaY = this.#trackingDetails.velocityDeltaY;
    dragEvent.velocityDelta = this.#trackingDetails.velocityDelta;
    dragEvent.elapsedTime = this.#trackingDetails.elapsedTime;
    dragEvent.elapsedTimeDelta = this.#trackingDetails.elapsedTimeDelta;

    if (eventType === 'mdwdragend') {
      const swipes = this.#getSwipe(this.#trackingDetails);
      dragEvent.swipeX = swipes.swipeX;
      dragEvent.swipeY = swipes.swipeY;
      dragEvent.swipe = swipes.swipe;
    }
    // dragEvent.timeStamp = this.#trackingDetails.timeStamp;
    // dragEvent.timeStampDelta = this.#trackingDetails.timeStampDelta;
    // can be passed customEvents during overscroll and snap
    if (event.preventDefault) dragEvent.preventDefault = () => event.preventDefault();
    return dragEvent;
  }

  #getDistanceBetweenBounds(b1, b2) {
    return Math.sqrt(Math.pow((b1.x + b1.width / 2) - (b2.x + b2.width / 2), 2) + Math.pow((b1.y + b1.height / 2) - (b2.y + b2.height / 2), 2))
  }





  // --- Reorder ----

  #setupReorder() {
    this.#element.classList.add('mdw-drag-reorder-active');
    util.lockPageScroll();
    // we use transform to move the dragged item so we need to raise it above all items
    this.#element.style.zIndex = 999;
    this.#reorderElementsAndBounds = [...this.#element.parentElement.children].map((element, i) => ({
      element,
      originalBounds: element.getBoundingClientRect(),
      index: i,
      initialIndex: i
    }));
    // need to do this do the getBoundingClientRect on the elements is correct for animations in reorderDrag
    this.#reorderElementsAndBounds.forEach(({ element, index }) => element.style.order = index);
    this.#animateReorderOffset();
  }

  #endReorder() {
    const dragged = this.#reorderElementsAndBounds.find(i => i.dragged);
    const target = this.#reorderElementsAndBounds.find(i => i.target);
    this.#cleanupReorder();
    if (!dragged || !target || dragged.index === target.index || dragged.index === dragged.initialIndex) return;

    const closestNextElement = target.element.nextElementSibling;
    if (this.#reorderSwap) {
      const elementNextElement = dragged.element.nextElementSibling;
      if (!elementNextElement) {
        this.#element.parentElement.append(target.element);
      } else {
        this.#element.parentElement.insertBefore(target.element, elementNextElement);
      }
      if (!closestNextElement) {
        this.#element.parentElement.append(dragged.element);
      } else {
        this.#element.parentElement.insertBefore(dragged.element, closestNextElement);
      }
    } else {
      if (dragged.index > target.index) {
        // last position check
        if (!closestNextElement) this.#element.parentElement.append(dragged.element);
        else this.#element.parentElement.insertBefore(dragged.element, closestNextElement);
      } else {
        this.#element.parentElement.insertBefore(dragged.element, target.element);
      }
    }

    this.#trigger(new Event('mdwdragreorder'));
  }

  #cleanupReorder() {
    (this.#reorderElementsAndBounds || []).forEach(({ element }) => {
      element.style.order = '';
      element.style.zIndex = '';
      element.style.opacity = '';
      element.style.transform = '';
      element.style.transition = '';
      element.style.transitionTimingFunction = '';
    });
    this.#reorderElementsAndBounds = [];
    this.#swapOffsetY = 0;
    this.#swapOffsetX = 0;
    this.#swapLastClosestIndex = undefined;
    this.#dragOffsetPosition = 0;
    this.#reorderAnimateTimestamp = undefined;
    this.#element.classList.remove('mdw-drag-reorder-active');
  }

  #reorderDrag(dragEvent) {
    const distanceX = this.#reorderVerticalOnly ? 0 : dragEvent.distanceX;
    const distanceY = this.#reorderHorizontalOnly ? 0 : dragEvent.distanceY;
    this.#element.style.transform = `translate(${distanceX + this.#swapOffsetX}px,${distanceY + this.#swapOffsetY}px) translate(-${this.#dragOffsetPosition}px, -${this.#dragOffsetPosition}px)`;
    
    const dragBounds = this.#element.getBoundingClientRect();
    const closestItem = this.#reorderElementsAndBounds
      .filter(({ originalBounds }) => { // remove any items not overlapping
        if (dragBounds.left >= originalBounds.right || originalBounds.left >= dragBounds.right) return false;
        if (dragBounds.top >= originalBounds.bottom || originalBounds.top >= dragBounds.bottom) return false;
        return true;
      }).reduce((previous, item) => { // get nearest by center point
        if (!previous) return item;
        return this.#getDistanceBetweenBounds(previous.originalBounds, dragBounds) < this.#getDistanceBetweenBounds(item.originalBounds, dragBounds) ? previous : item;
      }, undefined);
    

    if (!closestItem) return;

    const dragItem = this.#reorderElementsAndBounds.find(({ element }) => element === this.#element);
    // reset data
    this.#reorderElementsAndBounds.forEach(item => {
      item.lastIndex = item.index;
      item.index = item.initialIndex;
      item.target = false;
    });
    dragItem.index = closestItem.initialIndex;
    // mark for end event
    dragItem.dragged = true;
    closestItem.target = true;

    if (this.#reorderSwap) {
      closestItem.index = dragItem.initialIndex;
    } else {
      // shift all items before or after dragged
      const startIndex = dragItem.initialIndex > closestItem.initialIndex ? closestItem.initialIndex : dragItem.initialIndex + 1;
      const endIndex = dragItem.initialIndex > closestItem.initialIndex ? dragItem.initialIndex : closestItem.initialIndex + 1;
      this.#reorderElementsAndBounds.slice(startIndex, endIndex).forEach(item => {
        if (dragItem.initialIndex > closestItem.initialIndex) item.index += 1;
        else item.index -= 1;
      });
    }

    if (this.#reorderAnimation) {
      // use css order to preview changes
      this.#reorderElementsAndBounds.forEach(item => {
        if (item.index === item.lastIndex || this.#element === item.element || item.inTransition) return;

        item.inTransition = true;
        item.previousBounds = item.element.getBoundingClientRect();
        requestAnimationFrame(() => {
          const currentBounds = item.element.getBoundingClientRect();
          const distance = this.#getDistanceBetweenBounds(item.previousBounds, currentBounds);
          item.element.style.transform = `translate(${item.previousBounds.x - currentBounds.x}px, ${item.previousBounds.y - currentBounds.y}px)`;

          if (!item.transitionStarted) {
            item.transitionStarted = true;
            requestAnimationFrame(() => {
              item.element.style.transition = `transform ${Math.abs(distance) * 1.5 + 200}ms`;
              item.element.style.transitionTimingFunction = 'var(--mdw-motion-easing-decelerate)';
              item.element.style.transform = '';
              util.transitionendAsync(item.element).then(() => {
                item.inTransition = false;
                item.transitionStarted = false;
                item.element.style.transition = '';
                item.element.style.transitionTimingFunction = '';
              });
            });
          }
        });
      });
    }

    this.#reorderElementsAndBounds.forEach(item => {
      item.element.style.order = item.index;
    });

    // track bounds offset ass css order changes
    // This will keep the drag item aligned with curser
    if (this.#swapLastClosestIndex !== closestItem.initialIndex) {
      const newBounds = this.#element.getBoundingClientRect();
      this.#swapOffsetY += dragBounds.y - newBounds.y;
      this.#swapOffsetX += dragBounds.x - newBounds.x;
      this.#swapLastClosestIndex = closestItem.initialIndex;
      this.#element.style.transform = `translate(${distanceX + this.#swapOffsetX}px,${distanceY + this.#swapOffsetY}px) translate(-${this.#dragOffsetPosition}px, -${this.#dragOffsetPosition}px)`;
    }
  } 

  // animate offset when dragging
  #animateReorderOffset() {
    if (!this.#reorderAnimateTimestamp) this.#reorderAnimateTimestamp = Date.now();
    requestAnimationFrame(() => {
      const timestamp = Date.now();
      const delta = timestamp - this.#reorderAnimateTimestamp;
      this.#reorderAnimateTimestamp = timestamp;
      this.#dragOffsetPosition += delta / 12; // position change based on time delta for smooth animation
      if (this.#dragOffsetPosition >= 4) this.#dragOffsetPosition = 4;
      this.#element.style.transform = `translate(${this.#trackingDetails.distanceX + this.#swapOffsetX}px,${this.#trackingDetails.distanceY + this.#swapOffsetY}px) translate(-${this.#dragOffsetPosition}px, -${this.#dragOffsetPosition}px)`;
      if (this.#dragOffsetPosition !== 4)  this.#animateReorderOffset();
    });
  }




  // --- Overscroll ---

  #startOverscroll(event) {
    const overscrollX = this.#trackingDetails.velocityDeltaX > 10 || this.#trackingDetails.velocityDeltaX < -10;
    const overscrollY = this.#trackingDetails.velocityDeltaY > 10 || this.#trackingDetails.velocityDeltaY < -10;
    if (!overscrollX || !overscrollY) {
      this.#endFinal(event);
      return;
    }

    const amplitudeX = 0.8 * this.#trackingDetails.velocityDeltaX;
    const amplitudeY = 0.8 * this.#trackingDetails.velocityDeltaY;
    this.#overscrollTrackingDetails = {
      overscrollX,
      overscrollY,
      amplitudeX,
      amplitudeY,
      scrollTargetX: Math.round(this.#trackingDetails.clientX + amplitudeX),
      scrollTargetY: Math.round(this.#trackingDetails.clientY + amplitudeY),
      overscrollTimeStamp: Date.now()
    };

    this.#stopOverscroll = false;
    this.#overscroll(event);
  }

  #overscroll(event) {
    if (this.#stopOverscroll) return;

    const elapsed = Date.now() - this.#overscrollTrackingDetails.overscrollTimeStamp;
    const deltaX = -this.#overscrollTrackingDetails.amplitudeX * Math.exp(-elapsed / this.#overflowTimeConstant);
    const deltaY = -this.#overscrollTrackingDetails.amplitudeY * Math.exp(-elapsed / this.#overflowTimeConstant);

    const keepScrollingX = deltaX > 1 || deltaX < -1;
    const keepScrollingY = deltaY > 1 || deltaY < -1;
    if ((!keepScrollingX && !keepScrollingY) || (!this.#scrollSnapPositions && this.#scrollSnapPositions.length === 0 && Math.abs(deltaX) < 140)) {
      this.#endFinal(this.#track(event, 'mdwdragend'));
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


  // --- snap ---

  #snap(event) {
    this.#stopSnapping = false;
    const nextScrollLeft = this.#element.scrollLeft;
    const nextScrollTop = this.#element.scrollTop;
    const snapPosition = this.#getSnapPosition(nextScrollLeft, nextScrollTop, event.directionX, event.directionY);
    this.#snapMove(snapPosition, event, event.directionX, event.directionY)
  }

  #getSnapPosition(x, y, directionX, directionY) {
    const nearest = this.#scrollSnapPositions
      .reduce((a, b) => {
        if (!a) return b;
        const distanceAX = Math.abs(x - (a.x || 0)) * (directionX === 1 ? 0.76 : 0.24);
        const distanceAY = Math.abs(y - (a.y || 0)) * (directionY === 1 ? 0.76 : 0.24);
        const distanceBX = Math.abs(x - (b.x || 0)) * (directionX === 1 ? 0.76 : 0.24);
        const distanceBY = Math.abs(y - (b.y || 0)) * (directionY === 1 ? 0.76 : 0.24);
        const distanceA = Math.sqrt((distanceAX * distanceAX) + (distanceAY * distanceAY));
        const distanceB = Math.sqrt((distanceBX * distanceBX) + (distanceBY * distanceBY));
        return distanceA < distanceB ? a : b;
      }, undefined);
    return {
      x: nearest.x || 0,
      y: nearest.y || 0
    };
  }


  #snapMove(target, lastEvent, previousDirectionX, previousDirectionY) {
    if (this.#stopSnapping) return;

    const diffX = target.x - this.#element.scrollLeft;
    const diffY = target.y - this.#element.scrollTop;
    const isBounceBackX = (previousDirectionX < 0 && diffX < 0) || (previousDirectionX > 0 && diffX > 0);
    const isBounceBackY = (previousDirectionY < 0 && diffX < 0) || (previousDirectionY > 0 && diffX > 0);
    let percent = Math.exp(-(Date.now() - this.#trackingDetails.timeStampDelta) / this.#overflowTimeConstant) * 0.2;
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
      this.#endFinal(lastEvent);
      return;
    }

    const client = this.#getClientPosition(lastEvent);
    const dragEvent = this.#drag({
      clientX: client.clientX + movementX,
      clientY: client.clientY + movementY
    });
    requestAnimationFrame(() => this.#snapMove(target, dragEvent, previousDirectionX, previousDirectionY));
  }
}
