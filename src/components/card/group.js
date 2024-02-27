import HTMLComponentElement from '../HTMLComponentElement.js';
import device from '../../core/device.js';

// TODO keyboard controls

class WFCCardGroupElement extends HTMLComponentElement {
  static tag = 'wfc-card-group';
  #autoSpanRow = this.classList.contains('wfc-auto-span-row');
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

      // TODO figure why this is needed if page containing is initial load vs spa navigated to
      requestAnimationFrame(() => {
        this.#layout();
      });
    });
    window.addEventListener('wfcwindowstate', this.#handleWindowState_bound);
  }

  disconnectedCallback() {
    window.removeEventListener('wfcwindowstate', this.#handleWindowState_bound);
    this.#observer.disconnect();
  }

  get #isGrid() {
    return this.classList.contains('grid') || (!this.classList.contains('grid') && device.state !== 'compact');
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
    this.classList.add('grid');
    this.classList.remove('list');

    const cards = [...this.querySelectorAll('wfc-card')].map((element, i) => {
      element.style.order = i;
      const innerContentHeight = [...element.children].reduce((a, b) => {
        // prevent ripple element from adjusting height
        if (b.classList.contains('ripple')) return a;
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
    this.style.setProperty('--wfc-card-group-row-height', `${baseHeight}px`);

    cards.forEach(({ element, height }) => {
      if (element.classList.contains('show')) return;

      const span = Math.ceil(height / baseHeight);
      if (baseHeight > 1) element.style.gridRowEnd = `span ${span}`;
    });

    // auto adjust column count to keep content on screen
    const overFlow = this.scrollWidth - this.offsetWidth;
    if (overFlow > 0) {
      let cardWidth = 0;
      [...this.querySelectorAll('wfc-card')].forEach(card => {
        if (card.offsetWidth > cardWidth) cardWidth = card.offsetWidth;
      });
      this.style.setProperty('--wfc-card-group-columns', Math.max(1, Math.floor(this.offsetWidth / cardWidth)));
    }
  }

  #layoutList() {
    this.classList.remove('grid');
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
}
customElements.define(WFCCardGroupElement.tag, WFCCardGroupElement);
