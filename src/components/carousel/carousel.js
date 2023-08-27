import HTMLElementExtended from '../HTMLElementExtended.js';
import util from '../../core/util.js';
import Drag from '../../core/Drag.js';

// TODO snapping


export default class MDWCarouselElement extends HTMLElementExtended {
  #drag;
  #onDrag_bound = this.#onDrag.bind(this);
  #calculateLayout_debounce = util.debounce(this.#calculateLayout.bind(this), 0);
  #calculateLayout_bound = this.#calculateLayout.bind(this);
  #scrollToItemOnScrollEnd_bound = this.#scrollToItemOnScrollEnd.bind(this);
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
    // TODO replace for opacity
    // this.style.setProperty('--mdw-carousel-item-full-width', `${this.#widthProperty}px`)
    this.insertAdjacentHTML('afterbegin', '<div class="mdw-carousel-front-padding"></div>');
    this.insertAdjacentHTML('beforeend', '<div class="mdw-carousel-back-padding"></div>');
    this.addEventListener('mdw-carousel-item-change', this.#calculateLayout_debounce);
    this.#drag = new Drag(this);
    this.#drag.noTouchEvents = true;
    this.#drag.overflowDrag = true;
    this.#drag.lockScrollY = true;
    this.#drag.on('mdwdragstart', () => this.#hasDragged = true);
    this.#drag.on('mdwdragmove', this.#onDrag_bound);
    this.#drag.enable();
    this.#initiated = true;
  }

  disconnectedCallback() {
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
    this.addEventListener('scroll', this.#calculateLayout_bound);
    this.addEventListener('scrollend', this.#scrollToItemOnScrollEnd_bound);
    this.scrollTo({ left: this.#itemScrollPositions[index], behavior: animation ? 'smooth' : 'instant' });
  }



  #scrollToItemOnScrollEnd() {
    this.removeEventListener('scroll', this.#calculateLayout_bound);
    this.removeEventListener('scrollend', this.#scrollToItemOnScrollEnd_bound);
  }

  #onDrag({ movementX }) {
    this.scrollLeft -= movementX;
    this.#calculateLayout();
  }

  #calculateLayout() {
    switch(this.#strategy) {
      case 'multi-browse':
        this.#calculateLayoutMultiBrowse();
        break;
      case 'hero-start':
        this.#calculateLayoutHeroStart();
        break;
      case 'hero-center':
        this.#calculateLayoutHeroCenter();
        if (!this.#hasDragged) this.scrollToItem(Math.floor(this.querySelectorAll('mdw-carousel-item').length / 2), false);
        break;
    }

    if (!this.#hasCalculated) {
      this.#hasCalculated = true;
      this.classList.add('mdw-loaded');
    }
  }

  #calculateLayoutMultiBrowse() {
    const gap = 8;
    const minWidth = 40;
    const minWidthGap = minWidth + gap;
    const opacityWidth = (minWidth * 2) - gap;
    const displayWidth = this.offsetWidth;
    const scrollLeft = this.scrollLeft;
    const bounds = this.getBoundingClientRect();
    const itemElements = [...this.querySelectorAll('mdw-carousel-item')];
    const scrollSnapPositions = [];
    let totalWidth = 0;
    let totalAdjustedWidth = 0;
    let scrollLeftPadding = 0;
    let isFirstItem = false;
    let leftOverSpace;

    for (const [index, itemElement] of itemElements.entries()) {
      const maxItemWidth = this.offsetWidth - minWidthGap;
      const itemBounds = itemElement.getBoundingClientRect();
      const itemWidth = Math.max(minWidth, Math.min(maxItemWidth, itemElement.width || 0));
      let adjustWidth = minWidth;
      const itemWidthAndGap = itemWidth + gap;
      this.#itemScrollPositions[index] = totalWidth;
      scrollSnapPositions.push(totalWidth);
      totalWidth += itemWidthAndGap;
      const itemScrollDistance = Math.max(0, totalWidth - scrollLeft);
      let opacity = 0;
      let textOpacity = 0;

      if (itemScrollDistance > 0 && itemScrollDistance <= itemWidthAndGap) {
        isFirstItem = true;
        leftOverSpace = displayWidth - itemScrollDistance;
        const percent = Math.max(0, itemScrollDistance - minWidth) / (itemWidthAndGap - minWidth);
        adjustWidth = Math.min(itemWidth, ((itemWidth - minWidth) * percent) + minWidth);
        
        // adjust scroll padding for current first item
        scrollLeftPadding += itemWidth - adjustWidth;
        opacity = (opacityWidth - Math.max(0, scrollLeft - totalWidth + opacityWidth)) / opacityWidth;
        textOpacity = (opacityWidth - Math.max(0, scrollLeft - totalWidth + opacityWidth + (itemWidth / 3))) / opacityWidth;
        
      } else if (!isFirstItem) { // before first item
        adjustWidth = minWidth;
        scrollLeftPadding += itemWidth - minWidth;
        
      } else if (itemBounds.left < bounds.right - minWidth) { // visible items after first
        opacity = Math.min(1, (bounds.right - itemBounds.left) / opacityWidth);
        textOpacity = Math.min(1, (bounds.right - itemBounds.left - (minWidth / 2)) / opacityWidth);

        if (index === itemElements.length - 1) { // last item
          adjustWidth = Math.min(itemWidth, Math.max(minWidth, leftOverSpace));
        } else {
          const tamperWidth = this.offsetWidth - minWidthGap - minWidth;
          const left = Math.max(0, itemBounds.left - bounds.left - minWidthGap);
          const tamperPercent = (left / tamperWidth);
          const temperOffset = Math.ceil(tamperPercent * (itemWidth / 2));
          adjustWidth = Math.min(leftOverSpace, itemWidth - temperOffset);
          leftOverSpace -= (adjustWidth + gap);
        }
      } else if (itemBounds.left < bounds.right) {
        opacity = (bounds.right - itemBounds.left) / opacityWidth;
        textOpacity = (bounds.right - itemBounds.left - (minWidth / 2)) / opacityWidth;
      }

      totalAdjustedWidth += adjustWidth + gap;
      itemElement.style.flexBasis = `${adjustWidth}px`;
      itemElement.style.width = `${adjustWidth}px`;
      itemElement.style.opacity = opacity;
      itemElement.style.setProperty('--mdw-carousel-item-text-opacity', textOpacity);
    }

    this.querySelector('.mdw-carousel-front-padding').style.width = `${scrollLeftPadding}px`;
    this.querySelector('.mdw-carousel-back-padding').style.width = `${totalWidth - (totalAdjustedWidth + scrollLeftPadding)}px`;
    this.#drag.scrollSnapPositions = scrollSnapPositions.map(x => ({ x }));
  }

  #calculateLayoutHeroStart() {
    const gap = 8;
    const minWidth = 56;
    const minWidthGap = minWidth + gap;
    const displayWidth = this.offsetWidth;
    const maxWidth = this.offsetWidth - minWidthGap;
    const maxWidthGap = maxWidth + gap;
    const scrollLeft = this.scrollLeft;
    const bounds = this.getBoundingClientRect();
    const itemElements = [...this.querySelectorAll('mdw-carousel-item')];
    const scrollSnapPositions = [];
    let isFirstItem = false;
    let totalWidth = 0;
    let scrollLeftPadding = 0;
    let totalAdjustedWidth = 0;
    let leftOverSpace;

    for (const [index, itemElement] of itemElements.entries()) {
      let adjustWidth = minWidth;
      const itemWidth = maxWidth;
      const itemWidthAndGap = maxWidthGap;
      this.#itemScrollPositions[index] = totalWidth;
      scrollSnapPositions.push(totalWidth);
      totalWidth += itemWidthAndGap;
      const itemScrollDistance = Math.max(0, totalWidth - scrollLeft);

      if (itemScrollDistance > 0 && itemScrollDistance <= itemWidthAndGap) {
        isFirstItem = true;
        leftOverSpace = displayWidth - itemScrollDistance;
        const percent = Math.max(0, itemScrollDistance - minWidth) / (itemWidth - minWidth); // changed
        adjustWidth = Math.min(itemWidth, ((itemWidth - minWidth) * percent) + minWidth);

        // adjust scroll padding for current first item
        scrollLeftPadding += itemWidth - adjustWidth;

      } else if (!isFirstItem) { // before first item
        adjustWidth = minWidth;
        scrollLeftPadding += itemWidth - minWidth;

      } else if (itemElement.getBoundingClientRect().left < bounds.right - minWidth) {
        if (index === itemElements.length - 1) { // last item
          adjustWidth = Math.min(itemWidth, Math.max(minWidth, leftOverSpace));
        } else {
          adjustWidth = Math.min(leftOverSpace, itemWidth);
          leftOverSpace -= (adjustWidth + gap);
        }
      }
      totalAdjustedWidth += adjustWidth + gap;
      itemElement.style.flexBasis = `${adjustWidth}px`;
      itemElement.style.width = `${adjustWidth}px`;
      itemElement.style.setProperty('--mdw-carousel-item-adjusted-width', `${itemWidth}px`);
    }

    this.querySelector('.mdw-carousel-front-padding').style.width = `${scrollLeftPadding}px`;
    this.querySelector('.mdw-carousel-back-padding').style.width = `${totalWidth - (totalAdjustedWidth + scrollLeftPadding)}px`;
    this.#drag.scrollSnapPositions = scrollSnapPositions.map(x => ({ x }));
  }

  // TODO scroll snap is not working correctly
  #calculateLayoutHeroCenter() {
    const gap = 8;
    const minWidth = 56;
    const minWidthGap = minWidth + gap;
    const displayWidth = this.offsetWidth;
    const maxWidth = this.offsetWidth - (minWidthGap * 2);
    const maxWidthGap = maxWidth + gap;
    const scrollLeft = this.scrollLeft;
    const bounds = this.getBoundingClientRect();
    const itemElements = [...this.querySelectorAll('mdw-carousel-item')];
    const scrollSnapPositions = [];
    let isFirstItem = false;
    let totalWidth = 0;
    let scrollLeftPadding = 0;
    let totalAdjustedWidth = 0;
    let leftOverSpace;
    
    for (const [index, itemElement] of itemElements.entries()) {
      let adjustWidth = minWidth;
      const itemWidth = maxWidth;
      const itemWidthAndGap = maxWidthGap;
      this.#itemScrollPositions[index] = index === 0 ? totalWidth : totalWidth - minWidthGap;
      scrollSnapPositions.push(index === 0 ? 0 : totalWidth - minWidthGap);
      totalWidth += itemWidthAndGap;
      const itemScrollDistance = Math.max(0, totalWidth - scrollLeft);

      if (itemScrollDistance > 0 && itemScrollDistance <= itemWidthAndGap) {
        isFirstItem = true;
        leftOverSpace = displayWidth - itemScrollDistance;
        const percent = Math.max(0, itemScrollDistance - minWidth) / (itemWidth - minWidth); // changed
        adjustWidth = Math.min(itemWidth, ((itemWidth - minWidth) * percent) + minWidth);

        // adjust scroll padding for current first item
        scrollLeftPadding += itemWidth - adjustWidth;

      } else if (!isFirstItem) { // before first item
        adjustWidth = minWidth;
        scrollLeftPadding += itemWidth - minWidth;

      } else if (itemElement.getBoundingClientRect().left < bounds.right - minWidth) {
        if (index === itemElements.length - 1) { // last item
          adjustWidth = Math.min(itemWidth, Math.max(minWidth, leftOverSpace));
        } else {
          adjustWidth = Math.min(leftOverSpace, itemWidth);
          leftOverSpace -= (adjustWidth + gap);
        }
      }
      totalAdjustedWidth += adjustWidth + gap;
      itemElement.style.flexBasis = `${adjustWidth}px`;
      itemElement.style.width = `${adjustWidth}px`;
      itemElement.style.setProperty('--mdw-carousel-item-adjusted-width', `${itemWidth}px`);
    }

    this.querySelector('.mdw-carousel-front-padding').style.width = `${scrollLeftPadding}px`;
    this.querySelector('.mdw-carousel-back-padding').style.width = `${totalWidth - (totalAdjustedWidth + scrollLeftPadding)}px`;
    this.#drag.scrollSnapPositions = scrollSnapPositions.map(x => ({ x }));
  }
}

customElements.define('mdw-carousel', MDWCarouselElement);
