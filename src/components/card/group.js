import HTMLElementExtended from '../HTMLElementExtended.js';
import device from '../../core/device.js';

customElements.define('mdw-card-group', class MDWCardGroupElement extends HTMLElementExtended {
  #cards = [];
  #autoSpanRow = this.classList.contains('mdw-auto-span-row');
  #observer = new MutationObserver(this.#onMutation.bind(this));


  constructor() {
    super();

    this.#layout();
    this.#observer.observe(this, { childList: true });
  }

  disconnectedCallback() {
    this.#observer.disconnect();
  }

  get #isGrid() {
    return this.classList.contains('mdw-grid') || (!this.classList.contains('mdw-grid') && !device.isMobile);
  }

  get autoSpanRow() {
    return this.#autoSpanRow();
  }
  set autoSpanRow(value) {
    this.#autoSpanRow = !!value;
    this.#layout();
  }

  connectedCallback() {
    setTimeout(() => {
      this.#layout();
    })
  }

  #layout() {
    // reset height style for reflow
    this.#cards.forEach(({ element, styleHeight }) => {
      if (element.classList.contains('mdw-show')) element.style.height = '';
      else element.style.height = styleHeight || '';
    });


    this.#cards = [...this.querySelectorAll('mdw-card')].map(element => {
      return {
        height: element.offsetHeight,
        styleHeight: element.style.height,
        element
      };
    });
    
    if (this.#cards.length === 0) return;
    if (this.#isGrid) this.#layoutGrid();
    else this.#layoutList();
  }

  #layoutGrid() {
    this.classList.add('mdw-grid');
    this.classList.remove('mdw-list');

    this.#cards.sort((a, b) => a.height - b.height);
    const baseHeight = this.#cards[0].height;

    this.#cards.forEach(({ element, height }) => {
      if (element.classList.contains('mdw-show')) return;

      const span = Math.ceil(height / baseHeight);
      if (baseHeight > 1) {
        element.style.gridRowEnd = `span ${span}`;
        if (this.#autoSpanRow) element.style.height = `${baseHeight * span}px`;
        else element.style.height = `${height}px`;
      }
    });

    // auto adjust column count to keep content on screen
    const overFlow = this.scrollWidth - this.offsetWidth;
    if (overFlow > 0) {
      let cardWidth = 0;
      [...this.querySelectorAll('mdw-card')].forEach(card => {
        if (card.offsetWidth > cardWidth) cardWidth = card.offsetWidth;
      });
      this.style.setProperty('--mdw-card-group-columns', Math.max(1, Math.floor(this.offsetWidth / cardWidth)));
    }
  }

  #layoutList() {
    this.classList.remove('mdw-grid');
    this.#cards.forEach(({ element }) => {
      element.style.height = 'unset';
    });
  }

  #onMutation() {
    this.#observer.disconnect();
    this.#layout();
    this.#observer.observe(this, { childList: true });
  }
});
