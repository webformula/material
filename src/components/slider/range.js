import HTMLElementExtended from '../HTMLElementExtended.js';
import Drag from '../../core/Drag.js';
import sheet from './range.css' assert { type: 'css' };

// TODO work out proper height

customElements.define('mdw-slider-range', class MDWSliderRange extends HTMLElementExtended {
  useShadowRoot = true;

  #min = 0;
  #max = 100;
  #value = [30, 60];
  #step = 1;
  #dragOne = new Drag(this);
  #onDragOne_bound = this.#onDragOne.bind(this);
  #onDragOneStart_bound = this.#onDragOneStart.bind(this);
  #dragTwo = new Drag(this);
  #onDragTwo_bound = this.#onDragTwo.bind(this);
  #onDragTwoStart_bound = this.#onDragTwoStart.bind(this);
  #onclick_bound = this.#onclick.bind(this);
  #dragOneStartLeftPosition;
  #dragTwoStartLeftPosition;
  #control;
  #activeTrack;
  #inactiveTrack;
  #inactiveTrack2;
  #thumb;
  #thumb2;
  #labelOne;
  #labelTwo;
  #isDiscrete = false;
  #onKeydown_bound = this.#onKeydown.bind(this);
  #onFocus_bound = this.#onFocus.bind(this);
  #onBlur_bound = this.#onBlur.bind(this);
  #abort = new AbortController();


  constructor() {
    super();

    this.#isDiscrete = this.classList.contains('mdw-discrete');
    if (this.querySelector('mdw-icon')) this.classList.add('mdw-has-icon');
  }

  template() {
    return /* html */`
      <slot></slot>

      <div class="control">
        <div class="mdw-track-inactive mdw-one"></div>
        <div class="mdw-track-inactive mdw-two"></div>
        <div class="mdw-track-active"></div>

        <div class="mdw-marks">
          ${!this.#isDiscrete ? '' : [...new Array(this.#stepCount)].map(i => `<div class="mdw-mark"></div>`).join('\n')}
        </div>

        <div class="mdw-thumb mdw-one" tabindex="0">
          <div class="mdw-label"><div class="mdw-label-text"></div></div>
        </div>
        <div class="mdw-thumb mdw-two" tabindex="0">
          <div class="mdw-label"><div class="mdw-label-text"></div></div>
        </div>
      </div>

      <style>${this.stringifyStyleSheet(sheet)}</style>
    `;
  }

  connectedCallback() {
    this.setAttribute('role', 'slider');
  }

  afterRender() {
    this.addEventListener('focus', this.#onFocus_bound, { signal: this.#abort.signal });
    this.#control = this.shadowRoot.querySelector('.control');
    this.#activeTrack = this.shadowRoot.querySelector('.mdw-track-active');
    this.#inactiveTrack = this.shadowRoot.querySelector('.mdw-track-inactive.mdw-one');
    this.#inactiveTrack2 = this.shadowRoot.querySelector('.mdw-track-inactive.mdw-two');
    this.#thumb = this.shadowRoot.querySelector('.mdw-thumb.mdw-one');
    this.#thumb2 = this.shadowRoot.querySelector('.mdw-thumb.mdw-two');
    this.#labelOne = this.shadowRoot.querySelector('.mdw-thumb.mdw-one .mdw-label-text');
    this.#labelTwo = this.shadowRoot.querySelector('.mdw-thumb.mdw-two .mdw-label-text');
    this.#setPositionOne({ percent: this.percents[0] });
    this.#setPositionTwo({ percent: this.percents[1] });

    this.#dragOne = new Drag(this.#thumb);
    this.#dragOne.includeMouseEvents = true;
    this.#dragOne.onDrag(this.#onDragOne_bound);
    this.#dragOne.onStart(this.#onDragOneStart_bound);
    this.#dragOne.enable();

    this.#dragTwo = new Drag(this.#thumb2);
    this.#dragTwo.includeMouseEvents = true;
    this.#dragTwo.onDrag(this.#onDragTwo_bound);
    this.#dragTwo.onStart(this.#onDragTwoStart_bound);
    this.#dragTwo.enable();

    this.#inactiveTrack.addEventListener('click', this.#onclick_bound, { signal: this.#abort.signal });
    this.#inactiveTrack2.addEventListener('click', this.#onclick_bound, { signal: this.#abort.signal });
    this.#activeTrack.addEventListener('click', this.#onclick_bound, { signal: this.#abort.signal });
  }

  disconnectedCallback() {
    this.#dragOne.destroy();
    this.#dragTwo.destroy();
    this.#abort.abort();
  }

  static get observedAttributes() {
    return ['min', 'max', 'value', 'step'];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === 'min') this.min = newValue;
    if (name === 'max') this.max = newValue;
    if (name === 'value') this.value = newValue;
    if (name === 'step') this.step = newValue;
  }

  get value() {
    return `${this.#value.join(',')}`;
  }
  set value(value = '30,60') {
    const split = value.split(',');
    this.#value = [parseFloat(split[0] || this.#min), parseFloat(split[1] || this.#max)];
    this.#adjustValueOnParams();
  }

  get valueArray() {
    return this.#value;
  }

  set value(value = '30,60') {
    const split = value.split(',');
    this.#value = [parseFloat(split[0] || this.#min), parseFloat(split[1] || this.#max)];
    this.#adjustValueOnParams();
  }

  get min() {
    return `${this.#min}`;
  }
  set min(value = 0) {
    this.#min = parseInt(value);
    this.#adjustValueOnParams();
  }

  get max() {
    return `${this.#max}`;
  }
  set max(value = 100) {
    this.#max = parseInt(value);
    this.#adjustValueOnParams();
  }

  get step() {
    return `${this.#step}`;
  }
  set step(value = 1) {
    this.#step = parseFloat(value);
    this.#adjustValueOnParams();
  }

  get percents() {
    return [
      (this.#value[0] - this.#min) / (this.#max - this.#min),
      (this.#value[1] - this.#min) / (this.#max - this.#min)
    ];
  }

  get #stepCount() {
    return Math.floor((this.#max - this.#min) / this.#step) + 1;
  }

  get #controlWidth() {
    return this.#control.offsetWidth;
  }
  get #controlOffset() {
    return this.#control.getBoundingClientRect().x - this.#controlX;
  }
  get #controlX() {
    return this.#control.getBoundingClientRect().x;
  }

  #setValueOneFromPixels(pixels) {
    const thumb2X = this.#thumb2.getBoundingClientRect().x - this.#controlX;
    if (pixels >= thumb2X - 10) {
      pixels = thumb2X - 10;
    }

    const controlWidth = this.#controlWidth;
    let percent = pixels / controlWidth;
    if (percent <= 0) percent = 0;
    if (percent >= 1) percent = 1;

    const lastValue = this.#value[0];
    this.#value[0] = this.#roundByStep(this.#min + (this.#max - this.#min) * percent);

    if (lastValue !== this.#value[0]) this.dispatchEvent(new Event('change'));

    // this will snap to marks
    if (this.#isDiscrete) pixels = controlWidth * this.percents[0];
    this.#setPositionOne({ pixels });
  }

  #setValueTwoFromPixels(pixels) {
    const thumbX = this.#thumb.getBoundingClientRect().x - this.#controlX;
    if (pixels <= thumbX + 30) {
      pixels = thumbX + 30;
    }
    const controlWidth = this.#controlWidth;
    let percent = pixels / controlWidth;
    if (percent <= 0) percent = 0;
    if (percent >= 1) percent = 1;

    const lastValue = this.#value[1];
    this.#value[1] = this.#roundByStep(this.#min + (this.#max - this.#min) * percent);

    if (lastValue !== this.#value[1]) this.dispatchEvent(new Event('change'));

    // this will snap to marks
    if (this.#isDiscrete) pixels = controlWidth * this.percents[1];
    this.#setPositionTwo({ pixels });
  }

  #setPositionOne({ percent, pixels }) {
    if (percent) {
      if (percent > 1) throw Error('percent must be from 0 - 1');
      pixels = this.#controlWidth * percent;
    }
    if (pixels < 0) pixels = 0;
    const thumb2X = this.#thumb2.getBoundingClientRect().x - this.#controlX;
    if (pixels >= thumb2X) pixels = thumb2X - 1;

    this.#thumb.style.left = `${pixels}px`;
    this.#activeTrack.style.left = `${pixels}px`;
    this.#inactiveTrack.style.width = `${pixels}px`;

    this.#updateNotches();
    this.#labelOne.innerHTML = this.#value[0];
  }

  #setPositionTwo({ percent, pixels }) {
    const controlWidth = this.#controlWidth;
    if (percent) {
      if (percent > 1) throw Error('percent must be from 0 - 1');
      pixels = controlWidth * percent;
    }
    const thumbX = this.#thumb.getBoundingClientRect().x - this.#controlX;
    if (pixels <= thumbX) pixels = thumbX + 1;
    if (pixels > controlWidth) pixels = controlWidth;

    this.#thumb2.style.left = `${pixels}px`;
    this.#activeTrack.style.right = `${controlWidth - pixels}px`;
    this.#inactiveTrack2.style.left = `${pixels}px`;

    this.#updateNotches();
    this.#labelTwo.innerHTML = this.#value[1];
  }

  #adjustValueOnParams() {
    if (this.#value[0] < this.#min) this.#value[0] = this.#min;
    if (this.#value[0] >= this.#value[1]) this.#value[0] = this.#value[1] - this.#step;
    this.#value[0] = this.#roundByStep(this.#value[0]);
    this.#value[1] = this.#roundByStep(this.#value[1]);
    if (this.#value[1] > this.#max) this.#value[1] = this.#max;

    if (this.rendered) {
      this.#setPositionOne({ percent: this.percents[0] });
      this.#setPositionTwo({ percent: this.percents[1] });
    }
  }

  #roundByStep(value) {
    const inverse = 1 / this.#step;
    return Math.round(value * inverse) / inverse;
  }

  #updateNotches() {
    if (!this.#isDiscrete) return;

    const marks = [...this.shadowRoot.querySelectorAll('.mdw-mark')];
    const thumbX = this.#thumb.getBoundingClientRect().x;
    const thumbTwoX = this.#thumb2.getBoundingClientRect().x;
    marks.forEach(mark => {
      if (mark.getBoundingClientRect().x >= thumbX && mark.getBoundingClientRect().x <= thumbTwoX) {
        mark.classList.remove('mdw-inactive');
        mark.classList.add('mdw-active');
      } else {
        mark.classList.remove('mdw-active');
        mark.classList.add('mdw-inactive');
      }
    });
  }


  #onclick(event) {
    const thumbDistance = Math.abs(this.#thumb.getBoundingClientRect().x - event.clientX);
    const thumb2Distance = Math.abs(this.#thumb2.getBoundingClientRect().x - event.clientX);

    if (thumbDistance <= thumb2Distance) this.#setValueOneFromPixels(event.clientX - this.#controlX);
    else this.#setValueTwoFromPixels(event.clientX - this.#controlX);
  }

  #onDragOneStart() {
    // there is a margin offset of -10px on the thumb.
    this.#dragOneStartLeftPosition = this.#thumb.getBoundingClientRect().x - this.#controlX + 10;
  }

  #onDragOne({ distance }) {
    this.#setValueOneFromPixels(this.#dragOneStartLeftPosition + distance.x);
  }

  #onDragTwoStart() {
    // there is a margin offset of -10px on the thumb.
    this.#dragTwoStartLeftPosition = this.#thumb2.getBoundingClientRect().x - this.#controlX + 10;
  }

  #onDragTwo({ distance }) {
    this.#setValueTwoFromPixels(this.#dragTwoStartLeftPosition + distance.x);
  }

  #onFocus() {
    this.addEventListener('blur', this.#onBlur_bound, { signal: this.#abort.signal });
    document.body.addEventListener('keydown', this.#onKeydown_bound, { signal: this.#abort.signal });
  }

  #onBlur() {
    this.removeEventListener('blur', this.#onBlur_bound);
    document.body.removeEventListener('keydown', this.#onKeydown_bound);
  }

  #onKeydown(event) {
    const leftArrow = event.key === 'ArrowLeft';
    const rightArrow = event.key === 'ArrowRight';
    const downArrow = event.key === 'ArrowDown';
    const upArrow = event.key === 'ArrowUp';

    const isOne = this.shadowRoot.querySelector(':focus').classList.contains('mdw-one');
    const valueSplit = this.value.split(',');
    let valueOne = parseFloat(valueSplit[0] || 0);
    let valueTwo = parseFloat(valueSplit[1] || 0);

    if (leftArrow || downArrow) {
      if (isOne) valueOne -= this.#step;
      else valueTwo -= this.#step;
    } else if (rightArrow || upArrow) {
      if (isOne) valueOne += this.#step;
      else valueTwo += this.#step;
    }

    this.value = `${valueOne},${valueTwo}`;
  }
});
