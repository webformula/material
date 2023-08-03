import HTMLElementExtended from '../HTMLElementExtended.js';

export default class MDWCarouselItemElement extends HTMLElementExtended {
  constructor() {
    super();
  }
}

customElements.define('mdw-carousel-item', MDWCarouselItemElement);
