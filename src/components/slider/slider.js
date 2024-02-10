import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './slider.css' assert { type: 'css' };


class WFCSliderElement extends HTMLComponentElement {
  static tag = 'wfc-slider';
  static useShadowRoot = true;
  static useTemplate = true;
  static shadowRootDelegateFocus = true;
  static styleSheets = styles;
  static formAssociated = true;

  #internals;
  #inputStart;
  #inputEnd;
  #valueLabelStart;
  #valueLabelEnd;
  #value;
  #valueStart;
  #valueEnd;
  #range = false;
  #abort;
  #onInputStart_bound = this.#onInputStart.bind(this);
  #onInputEnd_bound = this.#onInputEnd.bind(this);
  #slotChange_bound = this.#slotChange.bind(this);
  #focusMouseUp_bound = this.#focusMouseUp.bind(this);


  constructor() {
    super();

    this.#internals = this.attachInternals();

    this.render();
    this.#inputStart = this.shadowRoot.querySelector('input.start');
    this.#inputStart.min = 0;
    this.#inputStart.max = 100;
    this.#inputEnd = this.shadowRoot.querySelector('input.end');
    this.#inputEnd.min = 0;
    this.#inputEnd.max = 100;
    this.#valueLabelStart = this.shadowRoot.querySelector('.handle.start .value');
    this.#valueLabelEnd = this.shadowRoot.querySelector('.handle.end .value');
  }

  static get observedAttributesExtended() {
    return [
      ['aria-label', 'string'],
      ['name', 'string'],
      ['name-start', 'string'],
      ['name-end', 'string'],
      ['value', 'number'],
      ['value-start', 'number'],
      ['value-end', 'number'],
      ['range', 'boolean'],
      ['max', 'number'],
      ['min', 'number'],
      ['step', 'number']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  template() {
    return /*html*/`
      <slot name="leading-icon"></slot>
      <div class="container">
        <slot class="label"></slot>
        <input class="start" type="range">
        <input class="end" type="range">

        <div class="track"></div>
        <div class="tick-marks"></div>

        <div class="handle-padding">
          <div class="handle start">
            <div class="value-container">
              <div class="value"></div>
            </div>
          </div>

          <div class="handle end">
            <div class="value-container">
              <div class="value"></div>
            </div>
          </div>
        </div>
        
      </div>
    `;
  }

  connectedCallback() {
    if (this.#range) {
      const rangeValueQuarter = (this.max - this.min) * 0.25;
      if (this.#valueStart === undefined) this.#valueStart = rangeValueQuarter;
      if (this.#valueEnd === undefined) this.#valueEnd = rangeValueQuarter * 3;
      this.valueStart = this.valueStart;
      this.valueEnd = this.valueEnd;
    }
    this.#abort = new AbortController();
    this.#inputStart.addEventListener('input', this.#onInputStart_bound, { signal: this.#abort.signal });
    this.shadowRoot.addEventListener('slotchange', this.#slotChange_bound, { signal: this.#abort.signal });
    this.addEventListener('mouseup', this.#focusMouseUp_bound, { signal: this.#abort.signal });
    if (this.#range) {
      this.#inputEnd.addEventListener('input', this.#onInputEnd_bound, { signal: this.#abort.signal });
    } else {
      this.#onInputStart();
    }
    this.#updateValidity();
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
  }

  get value() { return this.#value; }
  set value(value) {
    if (this.#range) return;

    this.#value = value;
    this.#inputStart.value = value;
    this.#internals.setFormValue(this.#inputStart.value);
    this.#valueLabelStart.innerHTML = this.#value;
    let percent = parseInt(((this.#value - this.min) / (this.max - this.min)) * 100);
    if (percent <= 0) percent = 0;
    else if (percent >= 100) percent = 100;
    else this.dispatchEvent(new Event('change', { bubbles: true }));
    this.shadowRoot.querySelector('.container').style.setProperty('--wfc-slider-active-end', `${percent}%`);
  }

  get valueStart() { return this.#valueStart; }
  set valueStart(value) {
    value = parseFloat(value);

    if (value >= this.valueEnd) value = this.#valueEnd;
    this.#valueStart = value;
    this.#inputStart.value = value;
    const data = new FormData();
    data.append(this.nameStart, String(this.valueStart));
    data.append(this.nameEnd, String(this.valueEnd));
    this.#internals.setFormValue(data);
    this.#valueLabelStart.innerHTML = this.#valueStart;

    let percent = ((this.#valueStart - this.min) / (this.max - this.min)) * 100;
    if (percent <= 0) percent = 0;
    else if (percent >= 100) percent = 100;
    else this.dispatchEvent(new Event('change', { bubbles: true }));
    this.shadowRoot.querySelector('.container').style.setProperty('--wfc-slider-active-start', `${percent}%`);

    this.#updateDisplay();
  }

  get valueEnd() { return this.#valueEnd; }
  set valueEnd(value) {
    value = parseFloat(value);
    
    if (value <= this.valueStart) value = this.#valueStart;
    this.#valueEnd = value;
    this.#inputEnd.value = value;
    const data = new FormData();
    data.append(this.nameStart, String(this.valueStart));
    data.append(this.nameEnd, String(this.valueEnd));
    this.#internals.setFormValue(data);
    this.#valueLabelEnd.innerHTML = this.#valueEnd;

    let percent = parseInt(((this.#valueEnd - this.min) / (this.max - this.min)) * 100);
    if (percent <= 0) percent = 0;
    else if (percent >= 100) percent = 100;
    else this.dispatchEvent(new Event('change', { bubbles: true }));
    this.shadowRoot.querySelector('.container').style.setProperty('--wfc-slider-active-end', `${percent}%`);

    this.#updateDisplay(true);
  }

  get ariaLabel() { return this.#inputStart.ariaLabel; }
  set ariaLabel(value) {
    this.#inputStart.ariaLabel = value;
    this.#inputEnd.ariaLabel = `${value} end`;
  }

  get range() { return this.#range; }
  set range(value) {
    this.#range = value;
  }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(value) {
    this.setAttribute('disabled', !!value);
  }

  get max() { return this.range ? this.#inputEnd.max : this.#inputStart.max; }
  set max(value) {
    this.#inputStart.max = value;
    if (this.#range) this.#inputEnd.max = value;
  }

  get min() { return this.#inputStart.min; }
  set min(value) {
    this.#inputStart.min = value;
    if (this.#range) this.#inputEnd.min = value;
  }

  get step() { return this.#inputStart.step; }
  set step(value) {
    this.#inputStart.step = value;
    if (this.#range) this.#inputEnd.step = value;
    const stepCount = (this.max - this.min) / value;
    this.shadowRoot.querySelector('.container').classList.toggle('step', !!value);
    this.shadowRoot.querySelector('.container').style.setProperty('--wfc-slider-tick-mark-count', stepCount);
  }

  get name() {
    return this.getAttribute('name');
  }
  set name(value) {
    this.setAttribute('name', value);
  }

  get nameStart() {
    return this.getAttribute('name-start') ?? this.getAttribute('name');
  }
  set nameStart(value) {
    this.setAttribute('name-start', value);
  }

  get nameEnd() {
    return this.getAttribute('name-end') ?? this.nameStart;
  }
  set nameEnd(value) {
    this.setAttribute('name-end', value);
  }

  get validationMessage() { return this.#internals.validationMessage; }
  get validity() { return this.#internals.validity; }
  get willValidate() { return this.#internals.willValidate; }


  reset() {
    if (this.#range) {
      this.value = this.getAttribute('value') ?? '';
    } else {
      this.valueStart = this.getAttribute('value-start') ?? '';
      this.valueEnd = this.getAttribute('value-end') ?? '';
    }
  }
  formResetCallback() { this.reset(); }

  checkValidity() { return this.#internals.checkValidity(); }
  reportValidity() {
    return this.checkValidity();
  }
  

  #onInputStart() {
    if (!this.#range) {
      this.value = this.#inputStart.value;
    } else {
      this.valueStart = this.#inputStart.value;
    }

    this.#updateValidity();
  }

  #onInputEnd() {
    this.valueEnd = this.#inputEnd.value;
    this.#updateValidity();
  }

  #updateValidity() {
    if (this.#range) {
      this.#internals.setValidity(this.#inputStart.validity, this.#inputStart.validationMessage || '');
    } else {
      if (this.#inputStart.validity.valid === false) this.#internals.setValidity(this.#inputStart.validity, this.#inputStart.validationMessage || '');
      else if (this.#inputEnd.validity.valid === false) this.#internals.setValidity(this.#inputEnd.validity, this.#inputEnd.validationMessage || '');
      else this.#internals.setValidity(this.#inputStart.validity, this.#inputStart.validationMessage || '');
    }
  }

  #slotChange(event) {
    if (event.target.classList.contains('label')) {
      const label = [...event.target.assignedNodes()].map(e => e.data).join('').trim();
      this.shadowRoot.querySelector('slot[name="leading-icon"]').classList.toggle('has-label', !!label);
      if (!this.ariaLabel) this.ariaLabel = label;
    }
  }

  // prevent focus hold
  #focusMouseUp() {
    this.blur();
  }

  #updateDisplay(isEnd = false) {
    const diff = ((this.#valueEnd - this.#valueStart) / (this.max - this.min)) / 2 * 100;
    this.shadowRoot.querySelector('.container').style.setProperty('--wfc-slider-range-active-diff', `${diff}%`);

    const handleStart = this.shadowRoot.querySelector('.handle.start');
    const handleEnd = this.shadowRoot.querySelector('.handle.end');
    handleStart.classList.remove('overlap');
    handleEnd.classList.remove('overlap');
    if (handleStart.getBoundingClientRect().right > handleEnd.getBoundingClientRect().left) {
      if (isEnd) handleEnd.classList.add('overlap');
      else handleStart.classList.add('overlap');
    }
  }
}
customElements.define(WFCSliderElement.tag, WFCSliderElement);
