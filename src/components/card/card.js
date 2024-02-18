import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './card.css' assert { type: 'css' };
import Ripple from '../../core/Ripple.js';
import util from '../../core/util.js';
import Drag from '../../core/Drag.js';
import device from '../../core/device.js';
import {
  expand_more_FILL0_wght400_GRAD0_opsz24,
  arrow_back_ios_FILL1_wght300_GRAD0_opsz24
} from '../../core/svgs.js';

export default class WFCCardElement2 extends HTMLComponentElement {
  static tag = 'wfc-card2';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = styles;

  #abort;
  #ripple;
  #drag;
  #dragSwipeAction;
  #reorder;
  #reorderSwap;
  #fullscreen;
  #dragSwipeActionStartPosition;
  #value = '';
  #swipeActionElement;
  #hasExpanded;
  #slotChange_bound = this.#slotChange.bind(this);
  #expandedClick_bound = this.#expandedClick.bind(this);
  #fullscreenClick_bound = this.#fullscreenClick.bind(this);
  #fullscreenCloseClick_bound = this.#fullscreenCloseClick.bind(this);
  #imgOnload_bound = this.#imgOnload.bind(this);
  #ondragSwipeAction_bound = this.#ondragSwipeAction.bind(this);
  #ondragSwipeActionStart_bound = this.#ondragSwipeActionStart.bind(this);
  #ondragSwipeActionEnd_bound = this.#ondragSwipeActionEnd.bind(this);
  #swipeActionClick_bound = this.#swipeActionClick.bind(this);
  #keydown_bound = this.#keydown.bind(this);
  #clickOutside_bound = this.#clickOutside.bind(this);

  constructor() {
    super();

    this.render();
    this.#swipeActionElement = this.shadowRoot.querySelector('[name="swipe-action"]');
  }

  template() {
    return /*html*/`
      <div class="placeholder"></div>
      <div class="container">
        <wfc-icon-button class="elevated fullscreen-close">
          <wfc-icon>${arrow_back_ios_FILL1_wght300_GRAD0_opsz24}</wfc-icon>
        </wfc-icon-button>
        <slot name="swipe-action"></slot>
        <slot name="image"></slot>
        <div class="content">
          <div class="expand-arrow">${expand_more_FILL0_wght400_GRAD0_opsz24}</div>
          <slot name="headline"></slot>
          <slot name="subhead"></slot>
          <slot name="supporting-text"></slot>
          <slot name="expanded"></slot>
          <slot class="default-slot"></slot>
          <slot name="action"></slot>
        </div>
        <div class="ripple"></div>
      </div>
    `;
  }

  connectedCallback() {
    this.#abort = new AbortController();
    this.shadowRoot.addEventListener('slotchange', this.#slotChange_bound, { signal: this.#abort.signal });

    if (this.hasAttribute('onclick')) {
      this.#ripple = new Ripple({
        element: this.shadowRoot.querySelector('.ripple'),
        triggerElement: this
      });
    }

    // prevent style calculation during script evaluation
    requestAnimationFrame(() => {
      this.#calculateImgMaxHeightForFullscreen();
    });

    if (this.#reorder || this.#reorderSwap) {
      this.#drag = new Drag(this, {
        reorder: true,
        reorderSwap: this.#reorderSwap,
        reorderAnimation: !this.parentElement.classList.contains('reorder-no-animation')
      });
      this.#drag.enable();
    }
  }

  disconnectedCallback() {
    this.#abort.abort();
    if (this.#ripple) this.#ripple.destroy();
    if (this.#drag) this.#drag.destroy();
    if (this.#dragSwipeAction) this.#dragSwipeAction.destroy();
    this.removeEventListener('click', this.#fullscreenClick_bound);
  }

  static get observedAttributesExtended() {
    return [
      ['fullscreen', 'boolean'],
      ['reorder', 'boolean'],
      ['reorder-swap', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get fullscreen() { return this.#fullscreen; }
  set fullscreen(value) {
    this.#fullscreen = !!value;
    if (this.#fullscreen) this.addEventListener('click', this.#fullscreenClick_bound);
    else this.removeEventListener('click', this.#fullscreenClick_bound);
  }

  get reorder() { return this.#reorder; }
  set reorder(value) {
    this.#reorder = !!value;
  }

  get reorderSwap() { return this.#reorderSwap; }
  set reorderSwap(value) {
    this.#reorderSwap = !!value;
  }

  // get action() {
  //   return this.#value;
  // }
  // set value(value) {
  //   this.#value = value;
  // }

  #slotChange(event) {
    const name = event.target.getAttribute('name');
    if (!this.#fullscreen && name === 'expanded') {
      const hasExpanded = event.target.assignedElements().length > 0;
      this.#hasExpanded = hasExpanded;
      this.shadowRoot.querySelector('.expand-arrow').classList.toggle('show', hasExpanded);
      this.classList.toggle('expanding', hasExpanded);

      event.target.classList.toggle('has-content', hasExpanded);
      if (event.target.assignedElements().length > 0) {
        this.addEventListener('click', this.#expandedClick_bound, { signal: this.#abort.signal });
      } else {
        this.removeEventListener('click', this.#expandedClick_bound);
      }
    } else if (name === 'supporting-text') {
      const hasContent = event.target.assignedElements().length > 0;
      event.target.classList.toggle('has-content', hasContent);
    } else if (name === 'image') {
      const hasContent = event.target.assignedElements().length > 0;
      this.classList.toggle('has-image', hasContent);
    } else if (name === 'swipe-action') {
      const hasSwipeAction = event.target.assignedElements().length > 0;
      event.target.classList.toggle('has-swipe-action', hasSwipeAction);
      if (hasSwipeAction) {
        this.#dragSwipeAction = new Drag(this, {
          disableMouseEvents: true,
          lockScrollY: true
        });
        this.#dragSwipeAction.on('wfcdragmove', this.#ondragSwipeAction_bound);
        this.#dragSwipeAction.on('wfcdragstart', this.#ondragSwipeActionStart_bound);
        this.#dragSwipeAction.on('wfcdragend', this.#ondragSwipeActionEnd_bound);
        this.#dragSwipeAction.enable();
        this.#swipeActionElement.addEventListener('click', this.#swipeActionClick_bound, { signal: this.#abort.signal });

        this.#swipeActionElement.assignedElements().forEach(el => {
          if (el.hasAttribute('action')) {
            this.#swipeActionElement.setAttribute('action', el.getAttribute('action'));
            this.#swipeActionElement.toggleAttribute('action-remove', el.hasAttribute('action-remove'));
          }
        })
      }
    } else if (event.target.classList.contains('default-slot')) {
      event.target.classList.toggle('has-content', event.target.assignedElements().length > 0);
    }
  }

  #expandedClick() {
    const isCompact = device.state === 'compact';
    const expanded = this.shadowRoot.querySelector('[name="expanded"]');
    if (!this.hasAttribute('open')) {
      const { clientHeight } = document.documentElement;
      const bounds = expanded.getBoundingClientRect();
      let height = expanded.scrollHeight + 16;
      // max height. scroll 
      if (height > 300) height = 300;

      // do not expand off screen
      if (bounds.top + height > clientHeight - 12) height = clientHeight - bounds.top - 12;

      // prevent offscreen expand from being too small
      if (height < 80) height = 80;

      expanded.style.height = `${height}px`;
      if (!isCompact) this.style.marginBottom = `${-height}px`;

      window.addEventListener('keydown', this.#keydown_bound, { signal: this.#abort.signal });
      window.addEventListener('click', this.#clickOutside_bound, { signal: this.#abort.signal });
    } else {
      expanded.style.height = '';
      if (!isCompact) this.style.marginBottom = '';
      window.removeEventListener('keydown', this.#keydown_bound);
      window.removeEventListener('click', this.#clickOutside_bound);
    }

    this.toggleAttribute('open');
  }

  #fullscreenClick() {
    if (this.hasAttribute('open')) return;

    this.style.setProperty('--wfc-card-fullscreen-img-height-previous', `${this.querySelector('img').offsetHeight}px`);
    const container = this.shadowRoot.querySelector('.container');
    const bounds = container.getBoundingClientRect();
    container.style.top = `${bounds.top}px`;
    container.style.left = `${bounds.left}px`;
    container.style.width = `${bounds.width}px`;
    container.style.height = `${bounds.height}px`;
    const placeholder = this.shadowRoot.querySelector('.placeholder');
    placeholder.style.width = `${bounds.width}px`;
    placeholder.style.height = `${bounds.height}px`;

    this.setAttribute('open', '');
    
    requestAnimationFrame(() => {
      container.style.top = '0px';
      container.style.left = '0px';
      container.style.width = '100%';
      container.style.height = '100%';
    });

    this.shadowRoot.querySelector('.fullscreen-close').addEventListener('click', this.#fullscreenCloseClick_bound, { signal: this.#abort.signal });
    window.addEventListener('keydown', this.#keydown_bound, { signal: this.#abort.signal });
  }

  async #fullscreenCloseClick() {
    this.shadowRoot.querySelector('.fullscreen-close').removeEventListener('click', this.#fullscreenCloseClick_bound);

    const container = this.shadowRoot.querySelector('.container');
    const placeholder = this.shadowRoot.querySelector('.placeholder');
    const bounds = placeholder.getBoundingClientRect();
    container.style.top = `${bounds.top}px`;
    container.style.left = `${bounds.left}px`;
    container.style.width = `${bounds.width}px`;
    container.style.height = `${bounds.height}px`;

    this.classList.add('fullscreen-closing');
    await util.transitionendAsync(container);


    container.style.top = '';
    container.style.left = '';
    container.style.width = '';
    container.style.height = '';
    this.classList.remove('fullscreen-closing');
    this.removeAttribute('open');
    window.removeEventListener('keydown', this.#keydown_bound);
  }

  // sets height for fullscreen view so image can expand
  #calculateImgMaxHeightForFullscreen() {
    const img = this.querySelector('img');
    if (!img) return;

    if (!img.height) img.addEventListener('load', this.#imgOnload_bound, { signal: this.#abort.signal });
    else {
      const maxHeight = Math.min(img.height, img.height / img.width * window.innerWidth);
      this.style.setProperty('--wfc-card-fullscreen-img-height', `${maxHeight}px`);
    }
  }

  #imgOnload() {
    this.querySelector(':scope > .card-image img').removeEventListener('load', this.#imgOnload_bound);
    this.#calculateImgMaxHeightForFullscreen();
  }


  #ondragSwipeActionStart() {
    this.classList.add('dragging');
    this.#dragSwipeActionStartPosition = parseInt(getComputedStyle(this).getPropertyValue('--wfc-card-swipe-action-position').replace('px', ''));
  }

  #ondragSwipeAction({ distanceX }) {
    let position = this.#dragSwipeActionStartPosition + distanceX;
    if (position > 60) position = 60;
    if (position < 0) position = 0;
    this.style.setProperty('--wfc-card-swipe-action-position', `${position}px`);
  }

  async #ondragSwipeActionEnd({ swipeX, direction }) {
    this.classList.remove('dragging');
    const position = parseInt(getComputedStyle(this).getPropertyValue('--wfc-card-swipe-action-position').replace('px', ''));

    if (swipeX) {
      if (direction === 'right') this.style.setProperty('--wfc-card-swipe-action-position', `60px`);
      else this.style.setProperty('--wfc-card-swipe-action-position', `0px`);
    } else if (position < 30) this.style.setProperty('--wfc-card-swipe-action-position', `0px`);
    else this.style.setProperty('--wfc-card-swipe-action-position', `60px`);
  }

  #swipeActionClick() {
    if (this.querySelector('[slot="swipe-action"][toggle]')) {
      if (this.#swipeActionElement.hasAttribute('checked')) this.#swipeActionElement.removeAttribute('checked');
      else this.#swipeActionElement.setAttribute('checked', '');
    }

    const action = this.#swipeActionElement.getAttribute('action');
    const actionRemove = this.#swipeActionElement.hasAttribute('action-remove');
    if (action) {
      this.dispatchEvent(new CustomEvent('change', {
        detail: {
          action,
          value: this.#value,
          card: this,
          ...(actionRemove && { remove: true })
        }
      }));
    }

    if (actionRemove) this.remove();

    setTimeout(() => {
      this.style.setProperty('--wfc-card-swipe-action-position', `0px`);
    }, 240);
  }

  #keydown(event) {
    if (event.code === 'Escape') {
      if (this.#fullscreen) this.#fullscreenCloseClick();
      else if (this.#hasExpanded) this.#expandedClick();
    }
  }

  #clickOutside(event) {
    if (!this.contains(event.target)) {
      if (this.#hasExpanded) this.#expandedClick();
    }
  }
}

customElements.define(WFCCardElement2.tag, WFCCardElement2);
