import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import util from '../../core/util.js';


class WFCBottomAppBarElement extends HTMLComponentElement {
  static tag = 'wfc-bottom-app-bar';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = styles;


  #autoHide = false;
  #secondaryHash;
  #scrollDirectionChange_bound = this.#scrollDirectionChange.bind(this);
  #hashchange_bound = this.#hashchange.bind(this);
  #slotChange_bound = this.#slotChange.bind(this);

  constructor() {
    super();

    this.render();
    document.body.classList.add('has-bottom-app-bar');
  }

  template() {
    return /*html*/`
      <slot class="default-slot"></slot>
      <slot name="secondary"></slot>
    `;
  }

  connectedCallback() {
    this.shadowRoot.addEventListener('slotchange', this.#slotChange_bound);
    if (this.#secondaryHash) this.#hashchange();
  }

  disconnectedCallback() {
    util.untrackScrollDirectionChange(this.#scrollDirectionChange_bound);
    this.shadowRoot.removeEventListener('slotchange', this.#slotChange_bound);
    window.removeEventListener('hashchange', this.#hashchange_bound);
  }
  

  static get observedAttributesExtended() {
    return [
      ['auto-hide', 'boolean'],
      ['secondary-hash', 'string']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get autoHide() { return this.#autoHide; }
  set autoHide(value) {
    this.#autoHide = !!value;
    this.toggleAttribute('auto-hide', this.#autoHide);
    document.body.classList.toggle('bottom-app-bar-auto-hide', this.#autoHide);
    if (this.#autoHide) util.trackScrollDirectionChange(this.#scrollDirectionChange_bound);
    else util.untrackScrollDirectionChange(this.#scrollDirectionChange_bound);
  }

  get secondaryHash() { return this.#secondaryHash; }
  set secondaryHash(value) {
    this.#secondaryHash = value;
    if (!!this.#secondaryHash) window.addEventListener('hashchange', this.#hashchange_bound);
    else window.removeEventListener('hashchange', this.#hashchange_bound);
  }


  async showPrimary() {
    const primary = this.shadowRoot.querySelector('.default-slot');
    primary.classList.remove('hide');

    const currentSecondary = this.shadowRoot.querySelector('[name="secondary"].show');
    if (currentSecondary) currentSecondary.classList.remove('show');
  }

  async showSecondary() {
    const secondary = this.shadowRoot.querySelector('[name="secondary"]');
    if (!secondary) {
      console.error('Could not find secondary bottom-app-bar content');
      return;
    }
    secondary.classList.add('show');

    const primary = this.shadowRoot.querySelector('.default-slot');
    primary.classList.add('hide');
  }


  #scrollDirectionChange(direction) {
    this.classList.toggle('hide', direction === -1);
    document.body.classList.toggle('bottom-app-bar-hide', direction === -1);
  }

  #hashchange() {
    if (location.hash === this.#secondaryHash) this.showSecondary();
    else this.showPrimary();
  }

  #slotChange(event) {
    event.target.assignedElements().forEach((el, i) => el.setAttribute('place', i + 1));
  }
}

customElements.define(WFCBottomAppBarElement.tag, WFCBottomAppBarElement);
