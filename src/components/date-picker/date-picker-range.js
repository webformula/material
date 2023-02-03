import HTMLElementExtended from '../HTMLElementExtended.js';
import dateUtil from '../../core/dateUtil.js';
import device from '../../core/device.js';

import './desktop-range.js';
import './mobile-range.js';


customElements.define('mdw-date-picker-range', class MDWDatePickerRangeElement extends HTMLElementExtended {
  useTemplate = false;

  #controlStart;
  #inputStart;
  #controlEnd;
  #inputEnd;
  #displayDateStart = '';
  #displayDateEnd = '';
  #initialValueStart = '';
  #initialValueEnd = '';

  #onControlFocus_bound = this.#onControlFocus.bind(this);
  #onControlClick_bound = this.#onControlClick.bind(this);
  #onShow_bound = this.#onShow.bind(this);
  #onClose_bound = this.#onClose.bind(this);
  #abort = new AbortController();

  constructor() {
    super();

    this.#controlStart = this.parentNode;
    if (this.#controlStart.nodeName !== 'MDW-TEXTFIELD') throw Error('mdw-date-picker-range must be a child of mdw-textfield');
    this.#controlEnd = document.querySelector(this.getAttribute('end-input'));
    if (this.#controlEnd?.nodeName !== 'MDW-TEXTFIELD') throw Error('mdw-date-picker-range[end-input] must be a valid css selector for second mdw-textfield');
    this.#inputStart = this.#controlStart.querySelector('input');
    this.#inputEnd = this.#controlEnd.querySelector('input');
    this.#controlStart.classList.add('mdw-has-date-picker');
    this.#controlEnd.classList.add('mdw-has-date-picker');
    this.#displayDateStart = dateUtil.parse(this.valueStart ? this.valueStart : dateUtil.today());
    this.#displayDateEnd = dateUtil.parse(this.valueEnd ? this.valueEnd : dateUtil.today());
    this.#initialValueStart = this.valueStart;
    this.#initialValueEnd = this.valueEnd;
  }

  connectedCallback() {
    this.#inputStart.addEventListener('focus', this.#onControlFocus_bound, { signal: this.#abort.signal });
    this.#inputEnd.addEventListener('focus', this.#onControlFocus_bound, { signal: this.#abort.signal });
    if (device.isMobile) {
      this.#controlStart.addEventListener('click', this.#onControlClick_bound, { signal: this.#abort.signal });
      this.#controlEnd.addEventListener('click', this.#onControlClick_bound, { signal: this.#abort.signal });
    }
  }

  afterRender() {
    this.firstChild.addEventListener('open', this.#onShow_bound, { signal: this.#abort.signal });
    this.firstChild.addEventListener('close', this.#onClose_bound, { signal: this.#abort.signal });
  }

  disconnectedCallback() {
    this.#abort.abort();
  }

  get value() {
    return `${this.valueStart}:${this.valueEnd}`;
  }

  get inputStart() {
    return this.#inputStart;
  }

  get inputEnd() {
    return this.#inputEnd;
  }

  get valueStart() {
    return this.#inputStart.value;
  }
  set valueStart(value) {
    this.#inputStart.value = value;
  }

  get valueEnd() {
    return this.#inputEnd.value;
  }
  set valueEnd(value) {
    this.#inputEnd.value = value;
  }

  get valueDate() {
    return [this.valueDateStart, this.valueDateEnd];
  }

  get valueDateStart() {
    return dateUtil.parse(this.#inputStart.value);
  }
  set valueDateStart(date) {
    this.#inputStart.value = dateUtil.format(date, 'YYYY-MM-dd') || '';
  }

  get valueDateEnd() {
    return dateUtil.parse(this.#inputEnd.value);
  }
  set valueDateEnd(date) {
    this.#inputEnd.value = dateUtil.format(date, 'YYYY-MM-dd') || '';
  }

  get displayValueStart() {
    return dateUtil.format(this.#displayDateStart, 'YYYY-MM-dd');
  }
  set displayValueStart(value) {
    this.#displayDateStart = dateUtil.parse(value);
  }

  get displayValueEnd() {
    return dateUtil.format(this.#displayDateStart, 'YYYY-MM-dd');
  }
  set displayValueEnd(value) {
    this.#displayDateStart = dateUtil.parse(value);
  }

  get displayDate() {
    return [this.displayDateStart, this.displayDateEnd];
  }

  get displayDateStart() {
    return this.#displayDateStart;
  }
  set displayDateStart(date) {
    this.#displayDateStart = dateUtil.parse(date);
  }

  get displayDateEnd() {
    return this.#displayDateEnd;
  }
  set displayDateEnd(date) {
    this.#displayDateEnd = dateUtil.parse(date);
  }

  get initialValueStart() {
    return this.#initialValueStart;
  }

  get initialValueEnd() {
    return this.#initialValueEnd;
  }

  get min() {
    return this.#inputStart.min;
  }
  get max() {
    return this.#inputStart.max;
  }

  get minDate() {
    return dateUtil.parse(this.#inputStart.min);
  }
  get maxDate() {
    return dateUtil.parse(this.#inputStart.max);
  }

  get controlStart() {
    return this.#controlStart;
  }

  get controlEnd() {
    return this.#controlEnd;
  }

  get label() {
    return this.getAttribute('label') || 'Select date range';
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
    if (device.isMobile) {
      this.#controlStart.removeEventListener('click', this.#onControlClick_bound);
      this.#controlEnd.removeEventListener('click', this.#onControlClick_bound);
    } else {
      this.#inputStart.removeEventListener('focus', this.#onControlFocus_bound);
      this.#inputEnd.removeEventListener('focus', this.#onControlFocus_bound);
    }

    this.#displayDateStart = dateUtil.parse(this.valueStart ? this.valueStart : dateUtil.today());
    this.#displayDateEnd = dateUtil.parse(this.valueEnd ? this.valueEnd : dateUtil.today());
    this.#initialValueStart = this.valueStart;
    this.#initialValueEnd = this.valueEnd;
  }

  #onClose() {
    setTimeout(() => {
      if (device.isMobile) {
        this.#controlStart.addEventListener('click', this.#onControlClick_bound, { signal: this.#abort.signal });
        this.#controlEnd.addEventListener('click', this.#onControlClick_bound, { signal: this.#abort.signal });
      } else {
        this.#inputStart.addEventListener('focus', this.#onControlFocus_bound, { signal: this.#abort.signal });
        this.#inputEnd.addEventListener('focus', this.#onControlFocus_bound, { signal: this.#abort.signal });
      }
    });
    this.#controlStart.querySelector('input').reportValidity();
    this.#controlEnd.querySelector('input').reportValidity();
  }

  template() {
    if (device.isMobile) return `<mdw-date-picker-range-mobile></mdw-date-picker-range-mobile>`;
    else return `<mdw-date-picker-range-desktop></mdw-date-picker-range-desktop>`;
  }
});
