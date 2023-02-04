/// used for nextTick poly
const nextTickNode = document.createTextNode('');
let nextTickQueue = [];
let nextTickObserving = false;
const nextTickObserveCallback = () => {
  while (nextTickQueue.length) {
    nextTickQueue.pop()();
  }
  nextTickObserve.disconnect();
  nextTickObserving = false;
};
const nextTickObserve = new MutationObserver(nextTickObserveCallback);



const mdwUtil = new class MDWUtil {
  #uidCounter = 0;
  #nextTickNodeData = 0;
  #textLengthDiv = document.createElement('div');
  #scrollTarget;
  #lastScrollTop;
  #scrollCallbacks = [];
  #scrollCurrentDirection;
  #scrollDistanceFromDirectionChange;
  #pageScrollIsLocked = false;
  #pageScrollLockHTMLScrollTop;
  #scrollHandler_bound = this.rafThrottle(this.#scrollHandler).bind(this);

  constructor() {
    this.#textLengthDiv.classList.add('mdw-text-length');
    document.body.insertAdjacentElement('beforeend', this.#textLengthDiv);
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
      element.addEventListener('animationend', function onAnimationend() {
        element.removeEventListener('animationend', onAnimationend);
        resolve();
      });
    });
  }

  async transitionendAsync(element) {
    return new Promise(resolve => {
      element.addEventListener('transitionend', function onTransitionend() {
        element.removeEventListener('transitionend', onTransitionend);
        resolve();
      });
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

  getTextWidth(element) {
    const styles = window.getComputedStyle(element);
    this.#textLengthDiv.style.fontSize = styles.getPropertyValue('font-size');
    this.#textLengthDiv.style.fontWeight = styles.getPropertyValue('font-weight');
    this.#textLengthDiv.style.linHeight = styles.getPropertyValue('line-height');
    this.#textLengthDiv.style.letterSpacing = styles.getPropertyValue('letter-spacing');
    this.#textLengthDiv.innerText = this.getTextFromNode(element);
    return this.#textLengthDiv.offsetWidth;
  }

  getTextWidthFromInput(inputElement) {
    if (!inputElement || inputElement.nodeName !== 'INPUT') throw Error('requires input element');

    const styles = window.getComputedStyle(inputElement);
    this.#textLengthDiv.style.fontSize = styles.getPropertyValue('font-size');
    this.#textLengthDiv.style.fontWeight = styles.getPropertyValue('font-weight');
    this.#textLengthDiv.style.linHeight = styles.getPropertyValue('line-height');
    this.#textLengthDiv.style.letterSpacing = styles.getPropertyValue('letter-spacing');
    this.#textLengthDiv.innerText = inputElement.value;
    return this.#textLengthDiv.offsetWidth;
  }


  /** use observer to mimic process.nextTick behavior
   *    This triggers faster than using setTimeout and is more predictable */
  nextTick(callback) {
    nextTickQueue.push(callback);
    if (nextTickObserving === false) {
      nextTickObserve.observe(nextTickNode, { characterData: true });
      nextTickObserving = true;
      nextTickNode.data = this.#nextTickNodeData++;
    }
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

  trackPageScroll(callback = () => { }) {
    if (!this.#scrollTarget) this.#scrollTarget = document.documentElement;
    if (this.#scrollCallbacks.length === 0) window.addEventListener('scroll', this.#scrollHandler_bound);
    this.#scrollCallbacks.push(callback);
  }

  untrackPageScroll(callback = () => { }) {
    this.#scrollCallbacks = this.#scrollCallbacks.filter(c => c !== callback);
    if (this.#scrollCallbacks.length === 0) window.removeEventListener('scroll', this.#scrollHandler_bound);
  }

  // can use array of strings ['one', 'two']
  // can also use array of objects with label property [{ label: 'one' }, { label: 'two' }]
  fuzzySearch(searchTerm, items = [], distanceCap = 2) {
    items = items.filter(v => !!v);
    if (items.length === 0) return [];
    const type = typeof items[0];
    if (!['string', 'object'].includes(type)) throw Error('Incorrect items array');
    if (type === 'object') {
      if (typeof items[0].label !== 'string') throw Error('Items array with objects must contain a label property that is a string');
    }

    searchTerm = searchTerm.toLowerCase().trim();
    const filterArr = items.map(item => {
      let label;
      if (type == 'object') label = item.label;
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

    const htmlElement = document.querySelector('html');
    this.#pageScrollLockHTMLScrollTop = htmlElement.scrollTop;
    htmlElement.style.overflow = 'hidden';
    htmlElement.style.position = 'relative';
    htmlElement.style.touchAction = 'none';

    const bodyElement = document.body;
    bodyElement.style.overflow = 'hidden';
    bodyElement.style.position = 'absolute';
    bodyElement.style.touchAction = 'none';
    bodyElement.style.bottom = '0';
    bodyElement.style.height = 'unset';
    bodyElement.style.top = `-${this.#pageScrollLockHTMLScrollTop}px`;

    // return offset
    // Locking page can
    return this.#pageScrollLockHTMLScrollTop;
  }

  unlockPageScroll() {
    if (this.#pageScrollIsLocked === false) return;
    this.#pageScrollIsLocked = false;

    const htmlElement = document.querySelector('html');
    htmlElement.style.overflow = '';
    htmlElement.style.position = '';
    htmlElement.style.touchAction = '';
    htmlElement.style.top = '';
    htmlElement.style.bottom = '';
    htmlElement.style.height = '';
    htmlElement.scrollTop = this.#pageScrollLockHTMLScrollTop;

    const bodyElement = document.body;
    bodyElement.style.overflow = '';
    bodyElement.style.position = '';
    bodyElement.style.touchAction = '';
    bodyElement.style.top = '';
    bodyElement.style.bottom = '';
    bodyElement.style.height = '';
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
      if (target === event.target) listener(event);
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
    const distance = this.#scrollTarget.scrollTop - this.#lastScrollTop;
    if (distance === 0) return;

    const direction = this.#scrollTarget.scrollTop >= this.#lastScrollTop ? -1 : 1;
    if (direction !== this.#scrollCurrentDirection) this.#scrollDistanceFromDirectionChange = 0;
    this.#scrollCurrentDirection = direction;

    this.#scrollDistanceFromDirectionChange += distance;
    this.#lastScrollTop = this.#scrollTarget.scrollTop;

    this.#scrollCallbacks.forEach(callback => callback({
      event,
      isScrolled: this.#scrollTarget.scrollTop > 0,
      direction,
      distance,
      distanceFromDirectionChange: this.#scrollDistanceFromDirectionChange || 0
    }));
  }
}

window.mdwUtil = mdwUtil;
export default mdwUtil;
