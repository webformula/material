import HTMLElementExtended from '../HTMLElementExtended.js';
import util from '../../core/util.js';
import Drag from '../../core/Drag.js';


export default class MDWCarouselElement extends HTMLElementExtended {
  #drag;
  #onDrag_bound = this.#onDrag.bind(this);
  #calculateLayout_debounce = util.debounce(this.#calculateLayout.bind(this), 0);
  #calculateLayout_bound = this.#calculateLayout.bind(this);
  #strategy = 'multi-browse';
  #strategies = ['multi-browser', 'hero-start', 'hero-center'];
  #itemScrollPositions = [];
  #initiated = false;
  #hasDragged = false;
  #hasCalculated = false;


  constructor() {
    super();
  }

  connectedCallback() {
    this.insertAdjacentHTML('afterbegin', '<div class="mdw-carousel-front-padding"></div>');
    this.insertAdjacentHTML('beforeend', '<div class="mdw-carousel-back-padding"></div>');
    this.addEventListener('mdw-carousel-item-change', this.#calculateLayout_debounce);
    this.#drag = new Drag(this, {
      disableTouchEvents: true,
      overflowDrag: true,
      lockScrollY: true
    });
    this.#drag.on('mdwdragstart', () => this.#hasDragged = true);
    this.#drag.on('mdwdragmove', this.#onDrag_bound);
    this.#drag.enable();
    this.addEventListener('scroll', this.#calculateLayout_bound);
    this.#initiated = true;
  }

  disconnectedCallback() {
    this.removeEventListener('scroll', this.#calculateLayout_bound);
    this.removeEventListener('mdw-carousel-item-change', this.#calculateLayout_debounce);
    this.#drag.destroy();
  }

  static get observedAttributes() {
    return ['strategy'];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get strategy() {
    return this.#strategy;
  }

  set strategy(value) {
    if (!this.#strategies.includes(value)) throw Error(`Invalid strategy. Use (${this.#strategies})`);
    this.#strategy = value;
    if (this.#initiated) this.#calculateLayout();
  }

  scrollToItem(index, animation = true) {
    this.scrollTo({ left: this.#itemScrollPositions[index], behavior: animation ? 'smooth' : 'instant' });
  }

  #onDrag({ distanceDeltaX }) {
    this.scrollLeft -= distanceDeltaX;
  }

  #calculateLayout() {
    switch(this.#strategy) {
      case 'multi-browse':
        this.#calculateLayoutRunner({
          minWidth: 40,
          maxWidth: this.offsetWidth - 40 + 8,
          useOpacity: true,
          snapOffset: 0
        });
        break;
      case 'hero-start':
        this.#calculateLayoutRunner({
          minWidth: 56,
          maxWidth: this.offsetWidth - 56 + 8,
          useOpacity: false,
          snapOffset: 0
        });
        break;
      case 'hero-center':
        this.#calculateLayoutRunner({
          minWidth: 56,
          maxWidth: this.offsetWidth - ((56 + 8) * 2),
          useOpacity: false,
          snapOffset: 56 + 8
        });
        if (!this.#hasDragged) this.scrollToItem(Math.floor(this.querySelectorAll('mdw-carousel-item').length / 2), false);
        break;
    }

    if (!this.#hasCalculated) {
      this.#hasCalculated = true;
      this.classList.add('mdw-loaded');
    }
  }

  #calculateLayoutRunner({
    minWidth,
    maxWidth,
    useOpacity,
    snapOffset
  }) {
    const gap = 8;
    const minWidthGap = minWidth + gap;
    const opacityWidth = (minWidth * 2) - gap;
    const displayWidth = this.offsetWidth;
    const scrollLeft = this.scrollLeft;
    const scrollSnapPositions = [];
    const bounds = this.getBoundingClientRect();
    const itemElements = [...this.querySelectorAll('mdw-carousel-item')];

    let totalWidth = 0;
    let totalAdjustedWidth = 0;
    let scrollLeftPadding = 0;
    let pastFirstItem = false;
    let leftOverSpace;

    for (const [index, itemElement] of itemElements.entries()) {
      const itemBounds = itemElement.getBoundingClientRect();
      const itemWidth = Math.max(minWidth, Math.min(maxWidth, itemElement.width || 0));
      const itemWidthAndGap = itemWidth + gap;
      this.#itemScrollPositions[index] = index === 0 ? 0 : totalWidth - snapOffset;
      scrollSnapPositions.push(index === 0 ? 0 : totalWidth - snapOffset);
      totalWidth += itemWidthAndGap;
      const itemScrollDistance = Math.max(0, totalWidth - scrollLeft);
      const isFirstItem = itemScrollDistance > 0 && itemScrollDistance <= itemWidthAndGap;
      const isVisible = itemBounds.left < bounds.right;
      const lastItem = index === itemElements.length - 1;
      let adjustWidth = minWidth;
      let opacity = 0;
      let textOpacity = 0;

      if (isFirstItem) {
        pastFirstItem = true;
        leftOverSpace = displayWidth - itemScrollDistance;
        const adjustPercent = Math.max(0, itemScrollDistance - minWidth) / (itemWidthAndGap - minWidth);
        adjustWidth = Math.min(itemWidth, ((itemWidth - minWidth) * adjustPercent) + minWidth);
        scrollLeftPadding += itemWidth - adjustWidth;
        if (useOpacity) opacity = (opacityWidth - Math.max(0, scrollLeft - totalWidth + opacityWidth)) / opacityWidth;
        textOpacity = (opacityWidth - Math.max(0, scrollLeft - totalWidth + opacityWidth + (itemWidth / 3))) / opacityWidth;

      } else if (!pastFirstItem) { // before first
        scrollLeftPadding += itemWidth - minWidth;

      } else if (isVisible && lastItem) { // last item is visible
        adjustWidth = Math.min(itemWidth, Math.max(minWidth, leftOverSpace));
        if (useOpacity) opacity = Math.min(1, (bounds.right - itemBounds.left) / opacityWidth);
        textOpacity = Math.min(1, (bounds.right - itemBounds.left - (minWidth / 2)) / opacityWidth);

      } else if (isVisible) { // visible
        const tamperWidth = this.offsetWidth - minWidthGap - minWidth;
        const left = Math.max(0, itemBounds.left - bounds.left - minWidthGap);
        const tamperPercent = (left / tamperWidth);
        const temperOffset = Math.ceil(tamperPercent * (itemWidth / 2));
        adjustWidth = Math.min(leftOverSpace, itemWidth - temperOffset);
        leftOverSpace -= (adjustWidth + gap);

        if (useOpacity) opacity = Math.min(1, (bounds.right - itemBounds.left) / opacityWidth);
        textOpacity = Math.min(1, (bounds.right - itemBounds.left - (minWidth / 2)) / opacityWidth);
      }

      totalAdjustedWidth += adjustWidth + gap;
      itemElement.style.flexBasis = `${adjustWidth}px`;
      itemElement.style.width = `${adjustWidth}px`;
      if (useOpacity) itemElement.style.opacity = opacity;
      itemElement.style.setProperty('--mdw-carousel-item-text-opacity', textOpacity);
    }

    this.querySelector('.mdw-carousel-front-padding').style.width = `${scrollLeftPadding}px`;
    this.querySelector('.mdw-carousel-back-padding').style.width = `${totalWidth - (totalAdjustedWidth + scrollLeftPadding)}px`;
    this.#drag.scrollSnapPositions = scrollSnapPositions.map(x => ({ x }));
  }
}

customElements.define('mdw-carousel', MDWCarouselElement);
