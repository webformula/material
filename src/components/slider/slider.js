import HTMLElementExtended from '../HTMLElementExtended.js';
import styles from './slider.css' assert { type: 'css' };
import Drag from '../../core/Drag.js';
import util from '../../core/util.js';


customElements.define('mdw-slider', class MDWSlider extends HTMLElementExtended {
  useShadowRoot = true;
  useTemplate = false;
  static styleSheets = styles;

  #disabled = false;
  #min = 0;
  #max = 100;
  #value = 50;
  #step = 1;
  #isDiscrete = this.classList.contains('mdw-discrete');
  #control;
  #activeTrack;
  #inactiveTrack;
  #thumb;
  #label;
  #dragStartLeftPosition;
  #drag;
  #onDrag_bound = this.#onDrag.bind(this);
  #onDragStart_bound = this.#onDragStart.bind(this);
  #onclick_bound = this.#onclick.bind(this);
  #onKeydown_bound = this.#onKeydown.bind(this);
  #onFocus_bound = this.#onFocus.bind(this);
  #onBlur_bound = this.#onBlur.bind(this);
  #abort = new AbortController();


  constructor() {
    super();

    if (this.querySelector('mdw-icon')) this.classList.add('mdw-has-icon');
  }

  template() {
    return /* html */`
      <slot></slot>

      <div class="control">
        <div class="track-inactive"></div>
        <div class="track-active"></div>

        <div class="marks">
          ${this.#isDiscrete ? [...new Array(this.#stepCount)].map(i => `<div class="mark"></div>`).join('\n') : ''}
        </div>

        <div class="thumb">
          <div class="label">
            <div class="label-text"></div>
          </div>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    this.tabIndex = 0;
    this.setAttribute('role', 'slider');
    this.setAttribute('aria-valuenow', this.#value);
  }

  disconnectedCallback() {
    this.#drag.destroy();
    this.#abort.abort();
  }

  afterRender() {
    this.addEventListener('focus', this.#onFocus_bound, { signal: this.#abort.signal });
    this.#control = this.shadowRoot.querySelector('.control');
    this.#activeTrack = this.shadowRoot.querySelector('.track-active');
    this.#inactiveTrack = this.shadowRoot.querySelector('.track-inactive');
    this.#thumb = this.shadowRoot.querySelector('.thumb');
    this.#label = this.shadowRoot.querySelector('.label-text');
    this.#setPosition({ percent: this.percent });

    const label = util.getTextFromNode(this);
    if (label) this.setAttribute('aria-label', label);

    this.#drag = new Drag(this.#thumb);
    this.#drag.lockScrollY = true;
    this.#drag.onDrag(this.#onDrag_bound);
    this.#drag.onStart(this.#onDragStart_bound);
    this.#drag.enable();

    this.#inactiveTrack.addEventListener('click', this.#onclick_bound, { signal: this.#abort.signal });
    this.#activeTrack.addEventListener('click', this.#onclick_bound, { signal: this.#abort.signal });
  }

  static get observedAttributes() {
    return ['disabled', 'min', 'max', 'value', 'step'];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === 'disabled') this.disabled = newValue !== null;
    if (name === 'min') this.min = newValue;
    if (name === 'max') this.max = newValue;
    if (name === 'value') this.value = newValue;
    if (name === 'step') this.step = newValue;
  }

  get disabled() {
    return this.#disabled;
  }
  set disabled(value) {
    this.#disabled = !!value;
    this.toggleAttribute('disabled', this.#disabled);
  }

  get value() {
    return `${this.#value}`;
  }
  set value(value) {
    this.#value = parseFloat(value);
    this.#adjustValueOnParams();
  }

  get min() {
    return `${this.#min}`;
  }
  set min(value) {
    this.#min = parseInt(value);
    this.setAttribute('aria-valuemin', value);
    this.#adjustValueOnParams();
  }

  get max() {
    return `${this.#max}`;
  }
  set max(value) {
    this.#max = parseInt(value);
    this.setAttribute('aria-valuemax', value);
    this.#adjustValueOnParams();
  }

  get step() {
    return `${this.#step}`;
  }
  set step(value) {
    this.#step = parseFloat(value);
    this.#adjustValueOnParams();
  }

  get percent() {
    return (this.#value - this.#min) / (this.#max - this.#min);
  }

  get #stepCount() {
    return Math.floor((this.#max - this.#min) / this.#step) + 1;
  }

  get #controlWidth() {
    return this.#control.offsetWidth;
  }
  get #controlOffset() {
    return this.#control.getBoundingClientRect().x - this.getBoundingClientRect().x;
  }
  get #controlX() {
    return this.#control.getBoundingClientRect().x;
  }

  #adjustValueOnParams() {
    if (this.#value < this.#min) this.#value = this.#min;
    if (this.#value > this.#max) this.#value = this.#max;
    this.#value = this.#roundByStep(this.#value);
    this.setAttribute('aria-valuenow', this.#value);
    if (this.rendered) this.#setPosition({ percent: this.percent });
  }

  #roundByStep(value) {
    const inverse = 1 / this.#step;
    return Math.round(value * inverse) / inverse;
  }

  #setPosition({ percent, pixels }) {
    if (!isNaN(percent) && percent > 1) throw Error('percent must be from 0 - 1');
    const controlWidth = this.#controlWidth;
    if (!isNaN(percent)) pixels = controlWidth * percent;
    if (pixels < 0) pixels = 0;
    if (pixels > controlWidth) pixels = controlWidth;

    this.#thumb.style.left = `${pixels}px`;
    this.#activeTrack.style.width = `${pixels}px`;
    this.#inactiveTrack.style.left = `${pixels}px`;

    if (this.#isDiscrete) {
      const marks = [...this.shadowRoot.querySelectorAll('.mark')];
      const thumbX = this.#thumb.getBoundingClientRect().x;
      marks.forEach(mark => {
        if (mark.getBoundingClientRect().x <= thumbX) {
          mark.classList.remove('inactive');
          mark.classList.add('active');
        } else {
          mark.classList.remove('active');
          mark.classList.add('inactive');
        }
      });
    }

    this.#label.innerHTML = this.#value;
  }

  #setValueFromPixels(pixels) {
    const controlWidth = this.#controlWidth;
    let percent = pixels / controlWidth;
    if (percent <= 0) percent = 0;
    if (percent >= 1) percent = 1;

    const lastValue = this.#value;
    this.#value = this.#roundByStep(this.#min + (this.#max - this.#min) * percent);
    this.setAttribute('aria-valuenow', this.#value);

    if (lastValue !== this.#value) this.dispatchEvent(new Event('change'));

    // this will snap to marks
    if (this.#isDiscrete) pixels = (controlWidth * this.percent) + this.#controlOffset;
    this.#setPosition({ pixels });
  }

  #onclick(event) {
    this.#setValueFromPixels(event.clientX - this.#controlX);
  }

  #onDragStart() {
    // there is a margin offset of -10px on the thumb.
    this.#dragStartLeftPosition = this.#thumb.getBoundingClientRect().x - this.#controlX + 10;
  }

  #onDrag({ distanceX }) {
    this.#setValueFromPixels(this.#dragStartLeftPosition + distanceX);
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

    if (leftArrow || downArrow) {
      this.value = parseFloat(this.value) - this.#step;
    } else if (rightArrow || upArrow) {
      this.value = parseFloat(this.value) + this.#step;
    }
  }
});
