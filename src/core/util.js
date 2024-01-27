import { generateBrowser } from './theme.js';


const mdwUtil = new class MDWUtil {
  #uidCounter = 0;
  #textWidthCanvas;
  #lastScrollTop;
  #scrollCallbacks = [];
  #scrollCurrentDirection;
  #scrollDistanceFromDirectionChange;
  #pageScrollIsLocked = false;
  #pageScrollLockHTMLScrollTop;
  #pageScrollLockHTMLScrollMargin;
  #scrollHandler_bound = this.rafThrottle(this.#scrollHandler).bind(this);
  #nextTickCallback_bound = this.#nextTickCallback.bind(this);
  #initialWindowState_bound = this.#initialWindowState.bind(this);
  #nextTickRaf;
  #nextTickQueue = [];

  constructor() {
    window.addEventListener('mdwwindowstate', this.#initialWindowState_bound);
  }

  #initialWindowState() {
    this.#lastScrollTop = document.documentElement.scrollTop;
    window.removeEventListener('mdwwindowstate', this.#initialWindowState_bound);
  }
  
  uid() {
    this.#uidCounter += 1;
    return this.#uidCounter;
  }

  async nextAnimationFrameAsync() {
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 0);
      });
    });
  }

  async animationendAsync(element) {
    return new Promise(resolve => {
      function onAnimationend(e) {
        element.removeEventListener('animationend', onAnimationend);
        element.removeEventListener('animationcancel', onAnimationend);
        resolve();
      }

      element.addEventListener('animationend', onAnimationend);
      element.addEventListener('animationcancel', onAnimationend);
    });
  }

  async transitionendAsync(element) {
    return new Promise(resolve => {
      function onTransitionend() {
        element.removeEventListener('transitionend', onTransitionend);
        element.removeEventListener('transitioncancel', onTransitionend);
        resolve();
      }

      element.addEventListener('transitionend', onTransitionend);
      element.addEventListener('transitioncancel', onTransitionend);
    });
  }
  
  // <div>one<div></div></div> === one
  getTextFromNode(element) {
    let nextNode;
    let hasHitTextNode = false;
    const textNodes = [...element.childNodes].filter(node => {
      const isTextNode = node.nodeType === 3;
      if (hasHitTextNode && !nextNode) nextNode = node;
      else if (isTextNode && !!node.textContent.trim()) hasHitTextNode = true;
      return isTextNode;
    });

    return textNodes
      .map(node => node.textContent.trim())
      .join('')
      .trim();
  }

  getTextWidth(element, fontStyle = { fontWeight: '', fontSize: '', fontFamily: '', letterSpacing: '' }) {
    if (!this.#textWidthCanvas) this.#textWidthCanvas = document.createElement('canvas');
    const styles = window.getComputedStyle(element);
    const context = this.#textWidthCanvas.getContext('2d');
    context.font = `${fontStyle.fontWeight || styles.getPropertyValue('font-weight')} ${fontStyle.fontSize || styles.getPropertyValue('font-size')} ${fontStyle.fontFamily || styles.getPropertyValue('font-family')}`;
    context.letterSpacing = fontStyle.letterSpacing || styles.getPropertyValue('letter-spacing');
    const metrics = context.measureText(this.getTextFromNode(element));
    return Math.ceil(metrics.width);
  }

  getTextWidthFromInput(inputElement) {
    if (!inputElement || inputElement.nodeName !== 'INPUT') throw Error('requires input element');
    if (!this.#textWidthCanvas) this.#textWidthCanvas = document.createElement('canvas');
    const styles = window.getComputedStyle(inputElement);
    const context = this.#textWidthCanvas.getContext('2d');
    context.font = `${styles.getPropertyValue('font-weight')} ${styles.getPropertyValue('font-size')} ${styles.getPropertyValue('font-family')}`;
    context.letterSpacing = styles.getPropertyValue('letter-spacing');
    const metrics = context.measureText(inputElement.value);
    return Math.ceil(metrics.width);
  }

  nextTick(callback) {
    this.#nextTickQueue.push(callback);
    if (!this.#nextTickRaf) this.#nextTickRaf = requestAnimationFrame(this.#nextTickCallback_bound);
  }

  #nextTickCallback() {
    while (this.#nextTickQueue.length) {
      this.#nextTickQueue.pop()();
    }
    this.#nextTickRaf = undefined;
  }

  async wait(ms = 100) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }

  throttle(fn, ms = 200) {
    let alreadyQueued;
    return function throttled() {
      const args = arguments;
      const context = this;
      if (!alreadyQueued) {
        alreadyQueued = true;
        fn.apply(context, args);
        setTimeout(() => {
          alreadyQueued = false;
        }, ms);
      }
    };
  }

  debounce(fn, wait) {
    let timer;
    return function debounced() {
      const args = arguments;
      const context = this
      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        fn.apply(context, args);
      }, wait || 10);
    };
  }

  rafThrottle(fn) {
    let alreadyQueued;
    return function throttled() {
      const args = arguments;
      const context = this;
      if (!alreadyQueued) {
        alreadyQueued = true;
        fn.apply(context, args);
        requestAnimationFrame(() => {
          alreadyQueued = false;
        });
      }
    };
  }

  // helps prevent a layout calculation when using a bottom app bar
  #initialScroll = true;
  trackPageScroll(callback = () => { }) {
    if (this.#scrollCallbacks.length === 0) {
      if (!this.#initialScroll) this.#lastScrollTop = document.documentElement.scrollTop;
      else this.#initialScroll = false;
      window.addEventListener('scroll', this.#scrollHandler_bound);
    }
    this.#scrollCallbacks.push(callback);
  }

  untrackPageScroll(callback = () => { }) {
    this.#scrollCallbacks = this.#scrollCallbacks.filter(c => c !== callback);
    if (this.#scrollCallbacks.length === 0) window.removeEventListener('scroll', this.#scrollHandler_bound);
  }

  // Track when scroll direction changes with buffer. Used for bottom app bar, fab, top app bar, page-content
  #scrollDistanceChangeCallbacks = [];
  trackScrollDirectionChange(callback = () => { }) {
    let lastDirectionChange;
    function wrapper({ direction, distanceFromDirectionChange }) {
      if (direction === -1 && lastDirectionChange !== direction && distanceFromDirectionChange > 20) {
        lastDirectionChange = direction;
        callback(-1);
      } else if (direction === 1 && lastDirectionChange !== direction && distanceFromDirectionChange < -10) {
        lastDirectionChange = direction;
        callback(1);
      }
    };
    this.#scrollDistanceChangeCallbacks.push([callback, wrapper]);
    this.trackPageScroll(wrapper);
  }

  untrackScrollDirectionChange(callback = () => { }) {
    const wrapper = this.#scrollDistanceChangeCallbacks.find(c => c[0] === callback);
    if (!wrapper) return;
    this.#scrollDistanceChangeCallbacks = this.#scrollDistanceChangeCallbacks.filter(c => c[0] !== callback);
    this.untrackPageScroll(wrapper[1]);
  }

  // can use array of strings ['one', 'two']
  // can also use array of objects with label property [{ label: 'one' }, { label: 'two' }] || [{ value: 'one' }, { value: 'two' }]
  fuzzySearch(searchTerm, items = [], distanceCap = 2) {
    items = items.filter(v => !!v);
    if (items.length === 0) return [];
    const type = typeof items[0];
    if (!['string', 'object'].includes(type)) throw Error('Incorrect items array');
    if (type === 'object') {
      if (typeof items[0].label !== 'string' && typeof items[0].value !== 'string') throw Error('Items array with objects must contain a label or value property that is a string');
    }

    searchTerm = searchTerm.toLowerCase().trim();
    const filterArr = items.map(item => {
      let label;
      if (type == 'object') label = item.label || item.value;
      else label = item;

      return {
        label,
        distance: this.#calculateDistance(searchTerm, label.toLowerCase().trim()),
        item
      };
    });

    return filterArr
      .filter(({ distance }) => distance <= distanceCap)
      .sort((a, b) => a.distance - b.distance)
      .map(({ item }) => item);
  }

  lockPageScroll() {
    if (this.#pageScrollIsLocked === true) return;
    this.#pageScrollIsLocked = true;

    const htmlElement = document.documentElement;
    this.#pageScrollLockHTMLScrollTop = htmlElement.scrollTop;
    this.#pageScrollLockHTMLScrollMargin = 0;
    htmlElement.style.overflow = 'hidden';
    htmlElement.style.position = 'relative';
    htmlElement.style.touchAction = 'none';

    return this.#pageScrollLockHTMLScrollTop;
  }

  scrollYLockedPage(movementY) {
    if (!movementY) return;
    if (this.#pageScrollIsLocked !== true) return;

    this.#pageScrollLockHTMLScrollMargin += movementY;
    document.documentElement.style.marginTop = `${this.#pageScrollLockHTMLScrollMargin}px`;
    // document.documentElement.scrollTop = scrollTop;
    this.#pageScrollLockHTMLScrollTop -= movementY;
  }

  unlockPageScroll() {
    if (this.#pageScrollIsLocked === false) return;
    this.#pageScrollIsLocked = false;

    const htmlElement = document.documentElement;
    htmlElement.style.marginTop = '';
    htmlElement.style.overflow = '';
    htmlElement.style.position = '';
    htmlElement.style.touchAction = '';
    htmlElement.scrollTop = this.#pageScrollLockHTMLScrollTop;
  }

  #clickTimeoutReferences = [];
  addClickTimeout(element, listener, ms = 200) {
    let timeout; 
    let target;
    function down(event) {
      target = event.target;
      timeout = setTimeout(() => {
        element.removeEventListener('mouseup', up);
      }, ms);
      element.addEventListener('mouseup', up);
    }

    function up(event) {
      element.removeEventListener('mouseup', up);
      clearTimeout(timeout);
      if (target === event.target || element.contains(event.target)) listener(event);
    }

    element.addEventListener('mousedown', down);

    this.#clickTimeoutReferences.push({
      element,
      removeClickTimeout() {
        element.removeEventListener('mousedown', down);
        element.removeEventListener('mouseup', up);
      }
    });
  }

  removeClickTimeout(element) {
    this.#clickTimeoutReferences = this.#clickTimeoutReferences.filter(v => {
      if (v.element === element) {
        v.removeClickTimeout();
        return false;
      }
      return true;
    });
  }

  #longPressListeners = [];
  addLongPressListener(element, listener, config = {
    ms: 1500,
    disableMouseEvents: false,
    disableTouchEvents: false
  }) {
    let timeout;
    let target;
    let startX;
    let startY;
    let lastEvent;

    function remove() {
      if (timeout) clearTimeout(timeout);
      lastEvent = undefined;
      element.removeEventListener('mouseup', remove);
      element.removeEventListener('mousemove', move);
      element.removeEventListener('touchend', remove);
      element.removeEventListener('touchmove', move);
    }

    function start(event) {
      target = event.target;
      timeout = setTimeout(() => {
        listener(lastEvent);
        remove();
      }, config.ms || 500);
      lastEvent = event;
      startX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
      startY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY;
      if (!config.disableMouseEvents) {
        element.addEventListener('mouseup', remove);
        element.addEventListener('mousemove', move);
      }
      if (!config.disableTouchEvents) {
        element.addEventListener('touchend', remove);
        element.addEventListener('touchmove', move);
      }
    }

    function move(event) {
      lastEvent = event;
      const x = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
      const y = event.changedTouches ? event.changedTouches[0].clientY : event.clientY;
      const distanceX = x - startX;
      const distanceY = y - startY;
      const distance = Math.sqrt((distanceX * distanceX) + (distanceY * distanceY));
      if (distance > 3) remove();
    }

    if (!config.disableMouseEvents) element.addEventListener('mousedown', start);
    if (!config.disableTouchEvents) element.addEventListener('touchstart', start);

    this.#longPressListeners.push({
      element,
      remove
    });
  }

  removeLongPressListener(element) {
    this.#longPressListeners = this.#longPressListeners.filter(v => {
      if (v.element === element) {
        v.remove();
        return false;
      }
      return true;
    });
  }

  toggleColorScheme(scheme) {
    const isDark = ['dark', 'light'].includes(scheme) ? scheme === 'dark' : !document.documentElement.classList.contains('mdw-theme-dark');
    document.documentElement.classList.toggle('mdw-theme-dark', isDark);
    generateBrowser();
    return isDark ? 'dark' : 'light';
  }

  getFocusableElements(parent) {
    const elements = [...parent.querySelectorAll('mdw-button, mdw-icon-button, mdw-checkbox, mdw-switch, mdw-select, mdw-textfield, a[href], button, input, textarea, select, details,[tabindex]:not([tabindex="-1"])')]
      .filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
    return elements;
  }

  #calculateDistance(searchTerm, target) {
    const regex = new RegExp(`^${searchTerm}`, 'i');
    const matchesStart = target.match(regex) !== null;
    const levenshtein = this.#levenshteinDistance(searchTerm, target);

    if (matchesStart) return levenshtein - 2; // make sure these are first in sort
    return levenshtein;
  }

  #levenshteinDistance(searchTerm, target) {
    if (!searchTerm.length) return target.length;
    if (!target.length) return searchTerm.length;
    const arr = [];
    for (let i = 0; i <= target.length; i++) {
      arr[i] = [i];
      for (let j = 1; j <= searchTerm.length; j++) {
        arr[i][j] =
          i === 0
            ? j
            : Math.min(
              arr[i - 1][j] + 1,
              arr[i][j - 1] + 1,
              arr[i - 1][j - 1] + (searchTerm[j - 1] === target[i - 1] ? 0 : 1)
            );
      }
    }
    return arr[target.length][searchTerm.length];
  }

  #scrollHandler(event) {
    const distance = document.documentElement.scrollTop - this.#lastScrollTop;
    
    if (distance === 0) return;

    const direction = document.documentElement.scrollTop >= this.#lastScrollTop ? -1 : 1;
    if (direction !== this.#scrollCurrentDirection) this.#scrollDistanceFromDirectionChange = 0;
    this.#scrollCurrentDirection = direction;

    this.#scrollDistanceFromDirectionChange += distance;
    this.#lastScrollTop = document.documentElement.scrollTop;

    this.#scrollCallbacks.forEach(callback => callback({
      event,
      isScrolled: document.documentElement.scrollTop > 0,
      scrollTop: document.documentElement.scrollTop,
      direction,
      distance,
      distanceFromDirectionChange: this.#scrollDistanceFromDirectionChange || 0
    }));
  }
}

window.mdwUtil = mdwUtil;
export default mdwUtil;
