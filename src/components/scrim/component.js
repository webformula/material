import HTMLElementExtended from '../HTMLElementExtended.js';
import util from '../../core/util.js';

customElements.define('mdw-scrim', class MDWScrimElement extends HTMLElementExtended {
  constructor() {
    super();
  }

  async connectedCallback() {
    await util.nextAnimationFrameAsync();
    this.classList.add('mdw-show');
  }

  async remove() {
    this.classList.remove('mdw-show');
    await util.transitionendAsync(this);
    super.remove();
  }
});
