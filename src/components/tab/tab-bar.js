import HTMLElementExtended from '../HTMLElementExtended.js';
import util from '../../core/util.js';


class WFCTabBarElement extends HTMLElementExtended {
  static tag = 'wfc-tab-bar';
  #underline = document.createElement('div');
  #onClick_bound = this.#onClick.bind(this);
  #secondary = this.classList.contains('wfc-tab-secondary');
  #lastValue;


  constructor() {
    super();
  }

  connectedCallback() {
    this.#underline.classList.add('wfc-tab-underline');
    this.insertAdjacentElement('beforeend', this.#underline);
    this.#handleTabsWithLabelsAndIcons();
    this.addEventListener('click', this.#onClick_bound);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#onClick_bound);
  }

  static get observedAttributes() {
    return ['value'];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get value() {
    const activeTab = this.querySelector('wfc-tab[active]');
    return activeTab && activeTab.value;
  }
  set value(value) {
    const activeTab = this.querySelector('wfc-tab[active]');
    if (activeTab) activeTab.active = false;

    const tab = this.querySelector(`wfc-tab[value="${value}"]`);
    if (tab) tab.active = true;
  }

  update() {
    this.#positionUnderline();
    const value = this.value;
    if (value !== this.#lastValue) this.dispatchEvent(new Event('change'));
    this.#lastValue = value;
  }

  #positionUnderline() {
    const activeTab = this.querySelector('wfc-tab[active]');
    if (!activeTab) {
      return;
    }


    const containerBounds = this.getBoundingClientRect();
    const tabBounds = activeTab.getBoundingClientRect();
    const textWidth = util.getTextWidth(activeTab);
    const icon = activeTab.querySelector('wfc-icon');

    let width = icon ? icon.offsetWidth : textWidth + 3;
    let left = tabBounds.x - containerBounds.x + (tabBounds.width / 2) - (width / 2);
    if (this.#secondary) {
      width = tabBounds.width;
      left = tabBounds.x - containerBounds.x;
    }
    const distance = parseInt(Math.abs(left - parseInt(getComputedStyle(this.#underline).left.replace('px', ''))));

    // base time + 25% of distance
    this.#underline.style.transitionDuration = `${120 + distance * 0.25}ms`;
    this.#underline.style.left = `${left}px`;
    this.#underline.style.width = `${width}px`;
  }

  #onClick(event) {
    this.value = event.target.value;
  }


  // change tab height when containing both labels and icons
  #handleTabsWithLabelsAndIcons() {
    const twoLine = [...this.querySelectorAll('wfc-tab')].find(tab => {
      const icon = tab.querySelector('wfc-icon');
      if (!icon) return false;

      const text = util.getTextFromNode(tab);
      if (text === '') return false;
      return true;
    });

    if (twoLine) this.classList.add('wfc-line-two');
  }
}
customElements.define(WFCTabBarElement.tag, WFCTabBarElement);
