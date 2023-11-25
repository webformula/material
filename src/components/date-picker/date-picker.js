import HTMLElementExtended from '../HTMLElementExtended.js';
import dateUtil from '../../core/dateUtil.js';
import device from '../../core/device.js';

import './desktop.js';
import './mobile.js';

// NOTE for now this only works with text fields, but there is no reason it cannot work with other controls

customElements.define('mdw-date-picker', class MDWDatePickerElement extends HTMLElementExtended {
  static useTemplate = false;

  #control;
  #input;
  #displayDate = '';
  #initialValue = '';
  #onControlFocus_bound = this.#onControlFocus.bind(this);
  #onControlClick_bound = this.#onControlClick.bind(this);
  #onShow_bound = this.#onShow.bind(this);
  #onClose_bound = this.#onClose.bind(this);
  #abort;

  constructor() {
    super();

    this.#control = this.parentNode;
    if (this.#control.nodeName !== 'MDW-TEXTFIELD') throw Error('mdw-date-picker must be a child of mdw-textfield');
    this.#input = this.#control.querySelector('input');
    this.#control.classList.add('mdw-has-date-picker');
    this.#displayDate = dateUtil.parse(this.value ? this.value : dateUtil.today());
    this.#initialValue = this.value;
  }

  connectedCallback() {
    this.#abort = new AbortController();
  }

  afterRender() {
    this.#control.querySelector('input').addEventListener('focus', this.#onControlFocus_bound, { signal: this.#abort.signal });
    // on mobile to prevent the default browser control we disable click events on the input, so no focus
    if (device.isMobile) this.#control.addEventListener('click', this.#onControlClick_bound, { signal: this.#abort.signal });
    this.firstChild.addEventListener('open', this.#onShow_bound, { signal: this.#abort.signal });
    this.firstChild.addEventListener('close', this.#onClose_bound, { signal: this.#abort.signal });
  }

  disconnectedCallback() {
    this.#abort.abort();
  }

  get value() {
    return this.#input.value;
  }
  set value(value) {
    this.#input.value = value;
  }
  get min() {
    return this.#input.min;
  }
  get max() {
    return this.#input.max;
  }

  get valueDate() {
    return dateUtil.parse(this.#input.value);
  }
  set valueDate(date) {
    this.#input.value = dateUtil.format(date, 'YYYY-MM-dd') || '';
  }
  get displayValue() {
    return dateUtil.format(this.#displayDate, 'YYYY-MM-dd');
  }
  set displayValue(value) {
    this.#displayDate = dateUtil.parse(value);
  }
  get displayDate() {
    return this.#displayDate;
  }
  set displayDate(date) {
    this.#displayDate = dateUtil.parse(date);
  }
  get initialValue() {
    return this.#initialValue;
  }

  get minDate() {
    return dateUtil.parse(this.#input.min);
  }
  get maxDate() {
    return dateUtil.parse(this.#input.max);
  }

  get control() {
    return this.#control;
  }

  show() {
    this.firstChild.show();
  }

  close() {
    this.firstChild.close();
  }


  #onControlFocus() {
    this.firstChild.show();
  }

  #onControlClick() {
    this.firstChild.show();
  }

  #onShow() {
    if (device.isMobile) this.#control.removeEventListener('click', this.#onControlClick_bound);
    else this.#input.removeEventListener('focus', this.#onControlFocus_bound);

    this.#displayDate = dateUtil.parse(this.value ? this.value : dateUtil.today());
    this.#initialValue = this.value;
  }

  #onClose() {
    setTimeout(() => {
      if (device.isMobile) this.#control.addEventListener('click', this.#onControlClick_bound, { signal: this.#abort.signal });
      else this.#input.addEventListener('focus', this.#onControlFocus_bound, { signal: this.#abort.signal });
    });
    this.#input.reportValidity();
  }

  template() {
    if (device.state === 'compact') return `<mdw-date-picker-mobile></mdw-date-picker-mobile>`;
    else return `<mdw-date-picker-desktop></mdw-date-picker-desktop>`;
  }
});
