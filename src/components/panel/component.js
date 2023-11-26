import HTMLElementExtended from '../HTMLElementExtended.js';
import util from '../../core/util.js';

// TODO fix spinner position
// TODO Should i remove dialog after prevent navigation alert ok click? When the user clicks ok on the alert the page will navigate back and the dialog will still be there.


export default class MDWPanelElement extends HTMLElementExtended {
  #overflowScrollRegex = /(auto|scroll)/;
  #validAnimations = ['translateY', 'scale', 'expand', 'transitionYReverse', 'opacity'];
  #animation = this.getAttribute('animation') || 'translateY';
  #scrim = false;
  #clickOutsideClose = false;
  #preventNavigation = true;
  #preventNavigationSet = false;
  #onClickOutside_bound = this.#onClickOutside.bind(this);
  #clickOutsideCloseIgnoreElements = [];
  #target = null;
  #lastOffsetHeight;
  #lastOffsetWidth;
  #targetScrollContainer;
  #positionOverlap = false;
  #positionSide = false;
  #onTargetScroll_bound = util.rafThrottle(this.#onTargetScroll.bind(this));
  #scrimElement;
  #fixedParent;
  #onEsc_bound = this.#onEsc.bind(this);
  #beforeUnload_bound = this.#beforeUnload.bind(this);
  #position;
  
  constructor() {
    super();
  }

  connectedCallback() {
    this.classList.add('mdw-panel');
    this.classList.add('mdw-no-animation');
    if (this.classList.contains('mdw-position-overlap')) this.#positionOverlap = true;
    if (this.classList.contains('mdw-position-side')) this.#positionSide = true;
  }

  disconnectedCallback() {
    this.#removeScrim();
    document.body.removeEventListener('click', this.#onClickOutside_bound);
    window.removeEventListener('beforeunload', this.#beforeUnload_bound);
    window.removeEventListener('keydown', this.#onEsc_bound);
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

  get scrim() {
    return this.#scrim;
  }
  set scrim(value) {
    this.#scrim = value;
  }

  get clickOutsideClose() {
    return this.#clickOutsideClose;
  }
  set clickOutsideClose(value) {
    this.#clickOutsideClose = !!value;
    if (!this.#preventNavigationSet) this.#preventNavigation = !value;
  }

  // if preventNavigation is not set it will stay in sync with clickOutsideClose;
  get preventNavigation() {
    return this.#preventNavigation;
  }
  set preventNavigation(value) {
    this.#preventNavigationSet = true;
    this.#preventNavigation = !!value;
    if (!value) window.removeEventListener('beforeunload', this.#beforeUnload_bound);
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

  get positionSide() {
    return this.#positionSide;
  }
  set positionSide(value) {
    this.#positionSide = !!value;
  }

  addClickOutsideCloseIgnore(element) {
    this.#clickOutsideCloseIgnoreElements.push(element);
  }

  setPosition(x, y) {
    this.#position = { x, y };
  }


  show(scrim = this.#scrim) {
    this.classList.remove('mdw-no-animation');
    if (this.open === true) return;

    if (this.#animation === 'scale') this.classList.add('mdw-animation-scale');
    if (this.#animation === 'expand') this.classList.add('mdw-animation-expand');
    if (this.#animation === 'transitionYReverse') this.classList.add('mdw-animation-transitionYReverse');
    if (this.#animation === 'opacity') this.classList.add('mdw-animation-opacity');
    if (scrim) this.#addScrim();
    if (this.#position) this.#setupPosition();
    else if (this.#target) this.#setupTarget();
    this.setAttribute('open', '');
    this.dispatchEvent(new Event('open'));
    if (this.#clickOutsideClose === true) {
      setTimeout(() => {
        document.body.addEventListener('click', this.#onClickOutside_bound);
        window.addEventListener('keydown', this.#onEsc_bound);
      }, 100);
    }

    if (this.#preventNavigation) window.addEventListener('beforeunload', this.#beforeUnload_bound);
    if (this.#targetScrollContainer) this.#targetScrollContainer.addEventListener('scroll', this.#onTargetScroll_bound);

    this.classList.add('mdw-animating');
    util.animationendAsync(this).finally(() => {
      this.classList.remove('mdw-animating');
      this.#lastOffsetHeight = this.offsetHeight;
      this.#lastOffsetWidth = this.offsetWidth;
    });
  }

  async close() {
    if (this.open !== true) return;
    window.removeEventListener('beforeunload', this.#beforeUnload_bound);
    if (this.#clickOutsideClose === true)  {
      document.body.removeEventListener('click', this.#onClickOutside_bound);
      window.removeEventListener('keydown', this.#onEsc_bound);
    }
    if (this.#targetScrollContainer) this.#targetScrollContainer.removeEventListener('scroll', this.#onTargetScroll_bound);

    this.removeAttribute('open');
    this.#removeScrim();
    this.dispatchEvent(new Event('close'));

    this.classList.add('mdw-animating');
    await util.animationendAsync(this);
    this.classList.remove('mdw-animating');
  }

  // for prevent navigation
  #beforeUnload(event) {
    event.preventDefault();
    event.returnValue = 'Changes you made may not be saved.';
  }

  #onClickOutside(event) {
    if (event.target === this) return;
    if (this.contains(event.target)) return;
    const isIgnoreElement = this.#clickOutsideCloseIgnoreElements.find(v => v.contains(event.target));
    if (isIgnoreElement) return;
    this.close();
  }

  #setupTarget() {
    if (this.#fixedParent === undefined) this.#fixedParent = this.#getFixedParent();
    this.#setTargetPosition();
    this.#targetScrollContainer = this.#getScrollContainerForTarget();
  }

  #setTargetPosition() {
    let bounds = this.#target.getBoundingClientRect();
    const { clientWidth, clientHeight } = document.documentElement;

    // TODO is this needed?
    // offset for nested fixed div
    if (this.#fixedParent) {
      const fixedBounds = this.#fixedParent.getBoundingClientRect();
      bounds = {
        x: bounds.x - fixedBounds.x,
        left: bounds.left - fixedBounds.left,
        right: bounds.right - fixedBounds.right,
        y: bounds.y - fixedBounds.y,
        top: bounds.top - fixedBounds.top,
        bottom: bounds.bottom - fixedBounds.bottom,
        width: bounds.width,
        height: bounds.height
      };
    }

    // initial position is top left panel aligned with bottom left target

    if (!this.#lastOffsetHeight) this.#lastOffsetHeight = this.offsetHeight;
    if (!this.#lastOffsetWidth) this.#lastOffsetWidth = this.offsetWidth;
    const panelBottom = bounds.bottom + this.#lastOffsetHeight;
    const panelRight = bounds.left + this.#lastOffsetWidth;

    // Panel offscreen adjustment
    if (panelBottom <= clientHeight || (panelBottom - bounds.top) > window.innerHeight) {
      this.style.bottom = 'unset';
      if (this.#positionOverlap || this.#positionSide) this.style.top = `${bounds.top}px`;
      else this.style.top = `${bounds.bottom}px`;
    } else {
      this.style.top = 'unset';
      if (this.#positionOverlap || this.#positionSide) this.style.bottom = `${clientHeight - bounds.bottom}px`;
      else this.style.bottom = `${clientHeight - bounds.top}px`;
    }

    // prefer being cutoff at bottom
    if (this.getBoundingClientRect().y < 0) {
      this.style.bottom = 'unset';
      if (this.#positionOverlap || this.#positionSide) this.style.top = `${bounds.top}px`;
      else this.style.top = `${bounds.bottom}px`;
    }

    if (panelRight <= clientWidth) {
      if (this.#positionSide) {
        this.style.left = `${bounds.right}px`;
        this.style.right = 'unset';
      } else {
        this.style.right = 'unset';
        this.style.left = `${bounds.left}px`;
      }
    } else {
      if (this.#positionSide) {
        this.style.right = `${bounds.left}px`;
        this.style.left = 'unset';
      } else {
        this.style.left = 'unset';
        this.style.right = `${clientWidth - bounds.right}px`;
      }
    }
  }

  #setupPosition() {
    this.classList.add('mdw-target');
    this.style.top = `${this.#position.y}px`;
    this.style.left = `${this.#position.x}px`;
  }

  #onTargetScroll() {
    this.#setTargetPosition();
  }

  #getScrollContainerForTarget() {
    let parentElement = this.#target.parentElement;
    while (parentElement !== null) {
      if (parentElement === document.documentElement) return window;
      const style = getComputedStyle(parentElement);
      if (this.#overflowScrollRegex.test(style.overflow + style.overflowY)) return parentElement;
      parentElement = parentElement.parentElement;
    }
  }

  #addScrim() {
    if (this.#scrimElement) return;
    this.#scrimElement = document.createElement('mdw-scrim');
    this.insertAdjacentElement('beforebegin', this.#scrimElement);
  }

  #removeScrim() {
    if (!this.#scrimElement) return;
    this.#scrimElement.remove();
    this.#scrimElement = undefined;
  }

  #getFixedParent() {
    let parentElement = this.#target.parentElement;
    while (parentElement !== null) {
      if (parentElement === document.body) return null;
      if (['fixed', 'absolute'].includes(getComputedStyle(parentElement).position)) return parentElement;
      parentElement = parentElement.parentElement;
    }
    return null;
  }

  #onEsc(e) {
    if (e.code === 'Escape' && this.#clickOutsideClose) {
      this.close();
      e.preventDefault();
    }
  }
}


customElements.define('mdw-panel', MDWPanelElement);
