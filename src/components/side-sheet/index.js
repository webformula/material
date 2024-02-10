import WFCSurfaceElement from '../surface/component.js';
import styles from './side-sheet.css' assert { type: 'css' };
import dividerStyles from '../divider/global.css' assert { type: 'css' };
import {
  close_FILL0_wght400_GRAD0_opsz24,
  arrow_back_FILL1_wght300_GRAD0_opsz24
} from '../../core/svgs.js';

// TODO right
// TODO do i want modal on compact?
// TODO aria for buttons

class WFCSideSheetElement extends WFCSurfaceElement {
  static tag = 'wfc-side-sheet';
  static styleSheets = [dividerStyles, styles];
  
  #abort;
  #left = false;
  #modal = false;
  #back = false;
  #global = false;
  #inset = false;
  #hideClose = false;
  #slotChange_bound = this.#slotChange.bind(this);
  #close_bound = this.#close.bind(this);

  constructor() {
    super();

    this.alwaysVisible = true;
    this.allowClose = false;
    this.viewportBound = false;
    this.animation = 'translate-right';
  }

  template() {
    return /*html*/`
      <div class="scrim"></div>
      <div class="placeholder"></div>
      <div class="surface">
        <div class="surface-content">
          <div class="item-padding">
            <div class="header">
              <wfc-icon-button class="back" aria-label="back">
                <wfc-icon>${arrow_back_FILL1_wght300_GRAD0_opsz24}</wfc-icon>
              </wfc-icon-button>
              <slot name="headline"></slot>
              <wfc-icon-button class="close" aria-label="close">
                <wfc-icon>${close_FILL0_wght400_GRAD0_opsz24}</wfc-icon>
              </wfc-icon-button>
            </div>
            <slot class="default-slot"></slot>
            <div class="actions">
              <wfc-divider></wfc-divider>
              <slot name="action"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }


  static get observedAttributesExtended() {
    return [
      ['open', 'boolean'],
      ['left', 'boolean'],
      ['modal', 'boolean'],
      ['scrim', 'boolean'],
      ['inset', 'boolean'],
      ['back', 'boolean'],
      ['global', 'boolean'],
      ['hide-close', 'boolean'],
      ['onback', 'event']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  connectedCallback() {
    super.connectedCallback();

    this.#abort = new AbortController();
    this.shadowRoot.addEventListener('slotchange', this.#slotChange_bound, { signal: this.#abort.signal });
    if (!this.#hideClose) this.shadowRoot.querySelector('.close').addEventListener('click', this.#close_bound, { signal: this.#abort.signal });
    this.shadowRoot.querySelector('.back').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('back'));
    }, { signal: this.#abort.signal });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.#abort) this.#abort.abort();
  }

  get left() { return this.#left; }
  set left(value) {
    this.#left = !!value;
    this.animation = this.#left ? 'translate-left' : 'translate-right';
  }

  get modal() { return this.#modal; }
  set modal(value) {
    this.#modal = !!value;
    this.toggleAttribute('modal', this.#modal);
  }

  get global() { return this.#global; }
  set global(value) {
    this.#global = !!value;
    this.toggleAttribute('global', this.#global);
  }

  get inset() { return this.#inset; }
  set inset(value) {
    this.#inset = !!value;
    this.toggleAttribute('inset', this.#inset);
  }

  get back() { return this.#back; }
  set back(value) {
    this.#back = !!value;
    this.toggleAttribute('back', this.#back);
  }

  get hideClose() { return this.#hideClose; }
  set hideClose(value) {
    this.#hideClose = !!value;
    this.toggleAttribute('hide-close', this.#hideClose);
  }

  onShow() {
    this.dispatchEvent(new Event('change'));
  }

  onHide() {
    this.dispatchEvent(new Event('change'));
  }

  toggle() {
    this.open = !this.open;
  }


  #slotChange(event) {
    if (event.target.getAttribute('name') === 'action') {
      this.shadowRoot.querySelector('.item-padding').classList.toggle('has-actions', event.target.assignedElements().length > 0);
    }
  }

  #close() {
    this.open = false;
  }
}
customElements.define(WFCSideSheetElement.tag, WFCSideSheetElement);
