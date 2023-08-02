import HTMLElementExtended from '../HTMLElementExtended.js';
import util from '../../core/util.js';
import Drag from '../../core/Drag.js';


export default class MDWCarouselElement extends HTMLElementExtended {
  #drag;
  #onDrag_bound = this.#onDrag.bind(this);
  #resizeItems_bound = util.rafThrottle(this.#resizeItems.bind(this));
  #itemDisplayCountMinimum = 3;
  #sizeFactor = 0.67;
  #gap = 8;
  #minWidth = 40;
  #minWidthGap = this.#minWidth + this.#gap;
  #items = [];
  #widthProperty;
  // helps when loading images from cache
  #resizeItems_debounce = util.debounce(this.#resizeItems.bind(this), 0);


  constructor() {
    super();
  }

  connectedCallback() {
    this.#widthProperty = this.hasAttribute('mdw-item-width') && parseInt(this.getAttribute('mdw-item-width'));
    this.style.setProperty('--mdw-carousel-item-full-width', `${this.#widthProperty}px`)
    this.insertAdjacentHTML('afterbegin', '<div class="mdw-carousel-front-padding"></div>');
    this.insertAdjacentHTML('beforeend', '<div class="mdw-carousel-back-padding"></div>');
    this.#items = this.#buildItems();
    setTimeout(() => this.#resizeItems());
    this.addEventListener('scroll', this.#resizeItems_bound);
    this.#drag = new Drag(this);
    this.#drag.noTouchEvents = true;
    this.#drag.overflowDrag = true;
    this.#drag.onDrag(this.#onDrag_bound);
    this.#drag.enable();
  }

  disconnectedCallback() {
    this.removeEventListener('scroll', this.#resizeItems_bound);
    this.#drag.destroy();
  }

  #onDrag({ distance }) {
    this.scrollLeft -= distance.moveX;
    this.#resizeItems();
  }

  #resizeItems() {
    const maxWidth = this.#items[0].width;
    const maxWidthGap = maxWidth + this.#gap;
    const startIndex = Math.floor(this.scrollLeft / maxWidthGap);
    const distance = maxWidthGap - (this.scrollLeft % maxWidthGap);
    const fullWidthItemsCount = Math.max(0, Math.floor(this.offsetWidth / maxWidthGap) - 2);
    let scrollPaddingOffset = this.#minWidthGap * startIndex;
    if (distance < this.#minWidthGap) scrollPaddingOffset += this.#minWidthGap - distance;
 
    let totalWidth = 0;
    const widths = [];
    const length = this.#items.length - startIndex;
    let i = 0;
    for (i; i < length; i += 1) {
      let width;
      if (i === 0) width = distance;
      else if (i <= fullWidthItemsCount) width = maxWidthGap;
      else if (i === fullWidthItemsCount + 1) width = Math.min(maxWidthGap, (this.#sizeFactor + ((1 - this.#sizeFactor) * (1 - (distance / maxWidthGap)))) * maxWidthGap);
      else width = Math.max(this.#minWidthGap, widths[i - 1] * this.#sizeFactor);
      widths.push(Math.round(width));
      totalWidth += width;
      if (totalWidth > this.offsetWidth) break;
    }
    widths.forEach((width, i) => {
      const index = startIndex + i;
      let newWidth;
      if (index === this.#items.length - 1) {
        const endWidth = this.offsetWidth - widths.slice(0, -1).reduce((a, b) => a + b, 0);
        newWidth = Math.min(maxWidth, Math.max(this.#minWidth, endWidth));
      } else newWidth = Math.max(this.#minWidth, width - this.#gap);

      const item = this.#items[startIndex + i];
      item.element.style.flexBasis = `${newWidth}px`;
      item.element.style.width = `${newWidth}px`;
      if (i === 0 && item.textElement) item.textElement.style.opacity = Math.min(1, (newWidth - 40) / 80);
    });

    const scrollPadding = this.#items.reduce((w, i) => w += i.width - i.element.offsetWidth, 0);
    this.querySelector('.mdw-carousel-back-padding').style.width = `${scrollPadding - this.scrollLeft + scrollPaddingOffset}px`;
    this.querySelector('.mdw-carousel-front-padding').style.width = `${this.scrollLeft - scrollPaddingOffset}px`;
  }

  #buildItems() {
    const maxPossibleItemWidth = this.offsetWidth - (8 * this.#itemDisplayCountMinimum) - (40 * (this.#itemDisplayCountMinimum - 1));
    return [...this.querySelectorAll('mdw-carousel-item')].map(element => {
      const item = {
        element,
        textElement: element.querySelector('.mdw-text'),
        width: this.#widthProperty || maxPossibleItemWidth
      };

      if (!this.#widthProperty) {
        const img = element.querySelector('img');
        if (img) {
          const widthValue = img.getAttribute('width');
          if (widthValue) item.width = Math.min(widthValue, maxPossibleItemWidth);
          else img.onload = () => {
            item.width = Math.min(img.offsetWidth, maxPossibleItemWidth);
            this.#resizeItems_debounce();
          };
        }
      }

      return item;
    });
  }
}

customElements.define('mdw-carousel', MDWCarouselElement);