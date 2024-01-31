import MDWIconButtonElement from '../icon-button/component.js';
import {
  menu_FILL1_wght400_GRAD0_opsz24,
  menu_open_FILL1_wght400_GRAD0_opsz24
} from '../../core/svgs.js';

class MDWNavigationButtonElement extends MDWIconButtonElement {
  static tag = 'mdw-navigation-button';
  #onclick_bound = this.#onclick.bind(this);
  #onNavigationState_bound = this.#onNavigationState.bind(this);

  constructor() {
    super();
  }

  get navigation() {
    return document.body.querySelector('mdw-navigation-drawer');
  }

  get open() {
    return document.body.querySelector('mdw-navigation-drawer').open;
  }
  set open(value) {
    document.body.querySelector('mdw-navigation-drawer').open = !!value;
  }

  connectedCallback() {
    super.connectedCallback();
    this.insertAdjacentHTML('afterbegin', `
      <mdw-icon>${menu_FILL1_wght400_GRAD0_opsz24}</mdw-icon>
      <mdw-icon slot="selected">${menu_open_FILL1_wght400_GRAD0_opsz24}</mdw-icon>
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
    document.body.querySelector('mdw-navigation-drawer').toggle();
  }

  #onclick() {
    this.toggle();
  }

  #onNavigationState() {
    this.checked = !this.navigation?.open;
  }
}
customElements.define(MDWNavigationButtonElement.tag, MDWNavigationButtonElement);
