import HTMLElementExtended from '../HTMLElementExtended.js';
import device from '../../core/device.js';

// TODO keyboard controls

customElements.define('mdw-card-group', class MDWCardGroupElement extends HTMLElementExtended {
  #autoSpanRow = this.classList.contains('mdw-auto-span-row');
  #observer = new MutationObserver(this.#onMutation.bind(this));
  #handleWindowState_bound = this.#handleWindowState.bind(this);


  constructor() {
    super();
  }

  connectedCallback() {
    // prevent style calculation during script evaluation
    requestAnimationFrame(() => {
      this.#layout();
      this.#observer.observe(this, { childList: true });
    });
    window.addEventListener('mdwwindowstate', this.#handleWindowState_bound);
  }

  disconnectedCallback() {
    window.removeEventListener('mdwwindowstate', this.#handleWindowState_bound);
    this.#observer.disconnect();
  }

  get #isGrid() {
    return this.classList.contains('mdw-grid') || (!this.classList.contains('mdw-grid') && device.state !== 'compact');
  }

  get autoSpanRow() {
    return this.#autoSpanRow();
  }
  set autoSpanRow(value) {
    this.#autoSpanRow = !!value;
    this.#layout();
  }

  #layout() {
    if (this.#isGrid) this.#layoutGrid();
    else this.#layoutList();
  }

  #layoutGrid() {
    this.classList.add('mdw-grid');
    this.classList.remove('mdw-list');

    const cards = [...this.querySelectorAll('mdw-card')].map((element, i) => {
      element.style.order = i;
      const innerContentHeight = [...element.children].reduce((a, b) => {
        // prevent ripple element from adjusting height
        if (b.classList.contains('mdw-ripple')) return a;
        return a + b.offsetHeight;
      }, 0);

      return {
        order: i,
        height: parseInt(element.style.height || innerContentHeight),
        element
      };
    }).sort((a, b) => a.height - b.height);
    if (cards.length === 0) return;

    const baseHeight = cards[0].height;
    this.style.setProperty('--mdw-card-group-row-height', `${baseHeight}px`);

    cards.forEach(({ element, height }) => {
      if (element.classList.contains('show')) return;

      const span = Math.ceil(height / baseHeight);
      if (baseHeight > 1) element.style.gridRowEnd = `span ${span}`;
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
  }

  #onMutation() {
    this.#observer.disconnect();
    this.#layout();
    this.#observer.observe(this, { childList: true });
  }

  #handleWindowState() {
    this.#observer.disconnect();
    this.#layout();
    this.#observer.observe(this, { childList: true });
  }
});
