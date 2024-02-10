import HTMLElementExtended from '../HTMLElementExtended.js';
import util from '../../core/util.js';

// TODO add proper tab panel transitions
class WFCTabContentElement extends HTMLElementExtended {
  static tag = 'wfc-tab-content';
  #bar;
  #tabChange_bound = this.#tabChange.bind(this);


  constructor() {
    super();

    this.#bar = document.querySelector(this.getAttribute('bar'));
    if (!this.#bar || this.#bar.nodeName !== 'WFC-TAB-BAR') throw Error('wfc-tab-content requires the "bar" attribute, containing a valid css selector to a wfc-tab-bar');
  }

  connectedCallback() {
    this.#bar.addEventListener('change', this.#tabChange_bound);

    util.nextAnimationFrameAsync().then(() => {
      const active = this.querySelector(`wfc-tab-panel[value="${this.#bar.value}"]`);
      if (active) active.active = true;
    });
    this.classList.add('wfc-animation');
  }

  disconnectedCallback() {
    this.#bar.removeEventListener('change', this.#tabChange_bound);
  }

  #tabChange() {
    const activePanel = this.querySelector('wfc-tab-panel[active]');
    const nextActive = this.querySelector(`wfc-tab-panel[value="${this.#bar.value}"]`);
    if (!nextActive) console.warn(`No wfc-tab-panel found for value: "${this.#bar.value}". Current active panel will stay active`);
    else {
      if (activePanel) activePanel.active = false;
      nextActive.active = true;
    }
  }
}

customElements.define(WFCTabContentElement.tag, WFCTabContentElement);
