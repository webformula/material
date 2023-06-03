import HTMLElementExtended from '../HTMLElementExtended.js';
import util from '../../core/util.js';
import styles from './tab-content.css' assert { type: 'css' };
HTMLElementExtended.registerGlobalStyleSheet(styles);

// TODO add proper tab panel transitions
customElements.define('mdw-tab-content', class MDWTabContentElement extends HTMLElementExtended {
  #bar;
  #tabChange_bound = this.#tabChange.bind(this);


  constructor() {
    super();

    this.#bar = document.querySelector(this.getAttribute('bar'));
    if (!this.#bar || this.#bar.nodeName !== 'MDW-TAB-BAR') throw Error('mdw-tab-content requires the "bar" attribute, containing a valid css selector to a mdw-tab-bar');
  }

  connectedCallback() {
    this.#bar.addEventListener('change', this.#tabChange_bound);

    util.nextAnimationFrameAsync().then(() => {
      const active = this.querySelector(`mdw-tab-panel[value="${this.#bar.value}"]`);
      if (active) active.active = true;
    });
  }

  disconnectedCallback() {
    this.#bar.removeEventListener('change', this.#tabChange_bound);
  }

  #tabChange() {
    const activePanel = this.querySelector('mdw-tab-panel[active]');
    const nextActive = this.querySelector(`mdw-tab-panel[value="${this.#bar.value}"]`);
    if (!nextActive) console.warn(`No mdw-tab-panel found for value: "${this.#bar.value}". Current active panel will stay active`);
    else {
      if (activePanel) activePanel.active = false;
      nextActive.active = true;
    }
  }
});
