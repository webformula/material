import WFCIconButtonElement from '../icon-button/component.js';
import {
  menu_FILL1_wght400_GRAD0_opsz24,
  menu_open_FILL1_wght400_GRAD0_opsz24
} from '../../core/svgs.js';

class WFCNavigationButtonElement extends WFCIconButtonElement {
  static tag = 'wfc-navigation-button';
  #onclick_bound = this.#onclick.bind(this);
  #onNavigationState_bound = this.#onNavigationState.bind(this);

  constructor() {
    super();
    this.shadowRoot.querySelector('button').ariaLabel = 'Navigation toggle';
  }

  get navigation() {
    return document.body.querySelector('wfc-navigation-drawer');
  }

  get open() {
    return document.body.querySelector('wfc-navigation-drawer').open;
  }
  set open(value) {
    document.body.querySelector('wfc-navigation-drawer').open = !!value;
  }

  connectedCallback() {
    super.connectedCallback();
    this.insertAdjacentHTML('afterbegin', `
      <wfc-icon>${menu_FILL1_wght400_GRAD0_opsz24}</wfc-icon>
      <wfc-icon slot="selected">${menu_open_FILL1_wght400_GRAD0_opsz24}</wfc-icon>
    `);
    this.addEventListener('click', this.#onclick_bound);
    this.navigation?.addEventListener('change', this.#onNavigationState_bound);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.#onclick_bound);
    this.navigation?.removeEventListener('change', this.#onNavigationState_bound);
  }

  toggle() {
    document.body.querySelector('wfc-navigation-drawer').toggle();
  }

  #onclick() {
    this.toggle();
  }

  #onNavigationState() {
    this.checked = !this.navigation?.open;
  }
}
customElements.define(WFCNavigationButtonElement.tag, WFCNavigationButtonElement);
