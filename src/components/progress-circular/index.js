import HTMLElementExtended from '../HTMLElementExtended.js';
import styles from './component.css' assert { type: 'css' };


customElements.define('mdw-progress-circular', class MDWProgressCircular extends HTMLElementExtended {
  useShadowRoot = true;
  useTemplate = false;
  static styleSheets = styles;

  #diameter = 40;
  #max = 1;
  #value = 1;
  #thickness = 4;

  constructor() {
    super();
  }

  connectedCallback() {
    this.setAttribute('role', 'progressbar');
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'progressbar');
  }

  static get observedAttributes() {
    return ['max', 'value', 'diameter', 'thickness'];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get max() {
    return this.#max;
  }
  set max(value) {
    if (isNaN(value)) throw Error('Failed to set the \'max\' property on \'mdw-progress-circular\': Must provide a number');
    this.#max = parseFloat(value);
    if (this.#max < 1) this.#max = 1;
    if (this.#value > this.#max) this.#value = this.#max;
    if (this.rendered) {
      this.shadowRoot.querySelector('circle').style.strokeDashoffset = `${this.#strokeDashoffset}px`;
    }
  }

  get value() {
    return this.#value;
  }
  set value(value) {
    if (isNaN(value)) throw Error('Failed to set the \'value\' property on \'mdw-progress-circular\': Must provide a number');
    this.#value = parseFloat(value);
    if (this.#value < 0) this.#value = 0;
    if (this.#value > this.#max) this.#value = this.#max;
    if (this.rendered) {
      this.shadowRoot.querySelector('circle').style.strokeDashoffset = `${this.#strokeDashoffset}px`;
    }
  }

  get #strokeDashoffset() {
    return this.#strokeCircumference * (this.#max - this.#value) / this.#max;
  }

  get diameter() {
    return this.#diameter;
  }
  set diameter(value) {
    if (isNaN(value)) throw Error('Failed to set the \'diameter\' property on \'mdw-progress-circular\': Must provide a number');
    this.#diameter = parseFloat(value);
  }

  get thickness() {
    return this.#thickness;
  }
  set thickness(value) {
    if (isNaN(value)) throw Error('Failed to set the \'thickness\' property on \'mdw-progress-circular\': Must provide a number');
    this.#thickness = parseFloat(value);
  }


  get #radius() {
    return (this.#diameter - 10) / 2;
  }

  get #strokeCircumference() {
    return 2 * Math.PI * this.#radius;
  }

  template() {
    const startValue = 0.95 * this.#strokeCircumference;
    const endValue = 0.2 * this.#strokeCircumference;
    return /* html*/ `
      <style>
        @keyframes mdw-progress-circular-rotate-${this.#diameter} {
          0%      { stroke-dashoffset: ${startValue};  transform: rotate(0); }
          12.5%   { stroke-dashoffset: ${endValue};    transform: rotate(0); }
          12.5001%  { stroke-dashoffset: ${endValue};    transform: rotateX(180deg) rotate(72.5deg); }
          25%     { stroke-dashoffset: ${startValue};  transform: rotateX(180deg) rotate(72.5deg); }
          25.0001%   { stroke-dashoffset: ${startValue};  transform: rotate(270deg); }
          37.5%   { stroke-dashoffset: ${endValue};    transform: rotate(270deg); }
          37.5001%  { stroke-dashoffset: ${endValue};    transform: rotateX(180deg) rotate(161.5deg); }
          50%     { stroke-dashoffset: ${startValue};  transform: rotateX(180deg) rotate(161.5deg); }
          50.0001%  { stroke-dashoffset: ${startValue};  transform: rotate(180deg); }
          62.5%   { stroke-dashoffset: ${endValue};    transform: rotate(180deg); }
          62.5001%  { stroke-dashoffset: ${endValue};    transform: rotateX(180deg) rotate(251.5deg); }
          75%     { stroke-dashoffset: ${startValue};  transform: rotateX(180deg) rotate(251.5deg); }
          75.0001%  { stroke-dashoffset: ${startValue};  transform: rotate(90deg); }
          87.5%   { stroke-dashoffset: ${endValue};    transform: rotate(90deg); }
          87.5001%  { stroke-dashoffset: ${endValue};    transform: rotateX(180deg) rotate(341.5deg); }
          100%    { stroke-dashoffset: ${startValue};  transform: rotateX(180deg) rotate(341.5deg); }
        }

        :host {
          width: ${this.#diameter}px;
          height: ${this.#diameter}px;
        }
      </style>
      <svg style="width: ${this.#diameter}px; height: ${this.#diameter}px;">
        <circle
          cx="50%"
          cy="50%"
          r="${this.#radius}"
          style="
            animation-name: mdw-progress-circular-rotate-${this.#diameter};
            stroke-dasharray: ${this.#strokeCircumference}px;
            stroke-width: ${this.#thickness}px;
            stroke-dashoffset: ${this.#strokeDashoffset}px;
          "
          ></circle>
      </svg>
    `;
  }
});
