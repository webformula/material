import HTMLElementExtended from '../HTMLElementExtended.js';
import './component.css';
import util from '../../core/util.js';


export default class MDWPanelElement extends HTMLElementExtended {
  #overflowScrollRegex = /(auto|scroll)/;
  #validAnimations = ['translateY', 'scale', 'expand', 'transitionYReverse', 'opacity'];
  #animation = this.getAttribute('animation') || 'translateY';
  #backdrop = false;
  #clickOutsideClose = true;
  #onClickOutside_bound = this.#onClickOutside.bind(this);
  #clickOutsideCloseIgnoreElements = [];
  #target = null;
  #lastOffsetHeight;
  #lastOffsetWidth;
  #targetScrollContainer;
  #positionOverlap = false;
  #onTargetScroll_bound = util.rafThrottle(this.#onTargetScroll.bind(this));
  #backdropElement;
  
  constructor() {
    super();
  }

  connectedCallback() {
    this.classList.add('mdw-panel');
    this.classList.add('mdw-no-animation');
    if (this.classList.contains('mdw-position-overlap')) this.#positionOverlap = true;
  }

  disconnectedCallback() {
    this.#removeBackdrop();
    document.body.removeEventListener('click', this.#onClickOutside_bound);
    if (this.#targetScrollContainer) this.#targetScrollContainer.removeEventListener('scroll', this.#onTargetScroll_bound);
  }

  static get observedAttributes() {
    return ['target'];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get open() {
    return this.hasAttribute('open');
  }

  get animation() {
    return this.#animation;
  }
  set animation(value) {
    if (!this.#validAnimations.includes(value)) throw Error(`not valid values. Must be one of these: ${this.#validAnimations.join(',')}`);
    this.#animation = value;
  }

  get backdrop() {
    return this.#backdrop;
  }
  set backdrop(value) {
    this.#backdrop = value;
  }

  get clickOutsideClose() {
    return this.#clickOutsideClose;
  }
  set clickOutsideClose(value) {
    this.#clickOutsideClose = value;
  }

  get target() {
    return this.#target;
  }
  set target(value) {
    if (value && value.nodeName) this.#target = value;
    else this.#target = document.querySelector(value);
    this.classList.toggle('mdw-target', !!this.#target);
  }

  get positionOverlap() {
    return this.#positionOverlap;
  }
  set positionOverlap(value) {
    this.#positionOverlap = !!value;
  }

  addClickOutsideCloseIgnore(element) {
    this.#clickOutsideCloseIgnoreElements.push(element);
  }


  show(backdrop = this.#backdrop) {
    this.classList.remove('mdw-no-animation');
    if (this.open === true) return;

    if (this.#animation === 'scale') this.classList.add('mdw-animation-scale');
    if (this.#animation === 'expand') this.classList.add('mdw-animation-expand');
    if (this.#animation === 'transitionYReverse') this.classList.add('mdw-animation-transitionYReverse');
    if (this.#animation === 'opacity') this.classList.add('mdw-animation-opacity');
    if (backdrop) this.#addBackdrop();
    if (this.#target) this.#setupTarget();
    this.setAttribute('open', '');
    this.dispatchEvent(new Event('open'));
    if (this.#clickOutsideClose === true) {
      setTimeout(() => {
        document.body.addEventListener('click', this.#onClickOutside_bound);
      }, 100);
    }

    if (this.#targetScrollContainer) this.#targetScrollContainer.addEventListener('scroll', this.#onTargetScroll_bound);

    this.classList.add('mdw-animating');
    util.animationendAsync(this).finally(() => {
      this.classList.remove('mdw-animating');
      this.#lastOffsetHeight = this.offsetHeight;
      this.#lastOffsetWidth = this.offsetWidth;
    });
  }

  close() {
    if (this.open !== true) return;

    if (this.#clickOutsideClose === true)  document.body.removeEventListener('click', this.#onClickOutside_bound);
    if (this.#targetScrollContainer) this.#targetScrollContainer.removeEventListener('scroll', this.#onTargetScroll_bound);

    this.removeAttribute('open');
    this.#removeBackdrop();
    this.dispatchEvent(new Event('close'));

    this.classList.add('mdw-animating');
    util.animationendAsync(this).finally(() => {
      this.classList.remove('mdw-animating');
    });
  }

  #onClickOutside(event) {
    if (event.target === this) return;
    if (this.contains(event.target)) return;
    const isIgnoreElement = this.#clickOutsideCloseIgnoreElements.find(v => v.contains(event.target));
    if (isIgnoreElement) return;
    this.close();
  }

  #setupTarget() {
    this.#setTargetPosition();
    this.#targetScrollContainer = this.#getScrollContainerForTarget();
  }

  #setTargetPosition() {
    const bounds = this.#target.getBoundingClientRect();
    const { clientWidth, clientHeight } = document.documentElement;
    // initial position is top left panel aligned with bottom left target

    if (!this.#lastOffsetHeight) this.#lastOffsetHeight = this.offsetHeight;
    if (!this.#lastOffsetWidth) this.#lastOffsetWidth = this.offsetWidth;
    const panelBottom = bounds.bottom + this.#lastOffsetHeight;
    const panelRight = bounds.left + this.#lastOffsetWidth;

    // Panel offscreen adjustment
    if (panelBottom <= clientHeight) {
      this.style.bottom = 'unset';
      if (this.#positionOverlap) this.style.top = `${bounds.top}px`;
      else this.style.top = `${bounds.bottom}px`;
    } else {
      this.style.top = 'unset';
      if (this.#positionOverlap) this.style.bottom = `${clientHeight - bounds.bottom}px`;
      else this.style.bottom = `${clientHeight - bounds.top}px`;
    }

    if (panelRight <= clientWidth) {
      this.style.right = 'unset';
      this.style.left = `${bounds.left}px`;
    } else {
      this.style.left = 'unset';
      this.style.right = `${client.width - bounds.right}px`;
    }
  }

  #onTargetScroll() {
    this.#setTargetPosition();
  }

  #getScrollContainerForTarget() {
    let parentNode = this.#target.parentNode;
    while (parentNode !== null) {
      const style = getComputedStyle(parentNode);
      if (this.#overflowScrollRegex.test(style.overflow + style.overflowY)) return parentNode;
      parentNode = parentNode.parentNode;
      if (parentNode === document.documentElement) return window;
    }
  }

  #addBackdrop() {
    if (this.#backdropElement) return;
    this.#backdropElement = document.createElement('mdw-backdrop');
    this.insertAdjacentElement('beforebegin', this.#backdropElement);
  }

  #removeBackdrop() {
    if (!this.#backdropElement) return;
    this.#backdropElement.remove();
    this.#backdropElement = undefined;
  }
}


customElements.define('mdw-panel', MDWPanelElement);
