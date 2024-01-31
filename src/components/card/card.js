import HTMLComponentElement from '../HTMLComponentElement.js';
import Drag from '../../core/Drag.js';
import {
  expand_more_FILL0_wght400_GRAD0_opsz24,
  arrow_back_ios_FILL1_wght300_GRAD0_opsz24
} from '../../core/svgs.js';
import util from '../../core/util.js';
import device from '../../core/device.js';
import Ripple from '../../core/Ripple.js';


// TODO refactor

export default class MDWCardElement extends HTMLComponentElement {
  static tag = 'mdw-card';
  #isFullscreen = this.classList.contains('mdw-fullscreen');
  #isExpanding = !!this.querySelector(':Scope > .mdw-card-content > .mdw-expanded');

  #expandClick_bound = this.#expandClick.bind(this);
  #fullscreenClick_bound = this.#fullscreenClick.bind(this);
  #fullscreenBackClick_bound = this.#fullscreenBackClick.bind(this);
  #imgOnload_bound = this.#imgOnload.bind(this);
  #ondragSwipeAction_bound = this.#ondragSwipeAction.bind(this);
  #ondragSwipeActionStart_bound = this.#ondragSwipeActionStart.bind(this);
  #ondragSwipeActionEnd_bound = this.#ondragSwipeActionEnd.bind(this);
  #swipeActionClick_bound = this.#swipeActionClick.bind(this);
  #focusMousedown_bound = this.#focusMousedown.bind(this);
  #fullscreenPlaceHolder;
  #fullscreenBackButton;
  #swipeActionElement = this.querySelector(':scope > mdw-card-swipe-action');
  #dragSwipeActionStartPosition;
  #dragSwipeAction;
  #value = '';
  #abort;
  #focus_bound = this.#focus.bind(this);
  #blur_bound = this.#blur.bind(this);
  #focusKeydown_bound = this.#focusKeydown.bind(this);
  #handleWindowState_bound = this.#handleWindowState.bind(this);
  #hasReorder = false;
  #drag;
  #ripple;
  #expandDrag;
  #expandDragEnd_bound = this.#expandDragEnd.bind(this);


  constructor() {
    super();
  }

  connectedCallback() {
    this.#abort = new AbortController();
    const arrow = this.querySelector('.mdw-expand-arrow');
    if (arrow) arrow.innerHTML = expand_more_FILL0_wght400_GRAD0_opsz24;

    if (this.#isFullscreen) {
      this.#fullscreenBackButton = document.createElement('div');
      this.#fullscreenBackButton.classList.add('mdw-card-fullscreen-back');
      this.#fullscreenBackButton.innerHTML = arrow_back_ios_FILL1_wght300_GRAD0_opsz24;
      // this.#fullscreenBackButton.innerHTML = `${arrow_back_ios_FILL1_wght300_GRAD0_opsz24}<span class="text">Back</span>`;
      this.insertAdjacentElement('afterbegin', this.#fullscreenBackButton);
      this.#fullscreenBackButton.addEventListener('click', this.#fullscreenBackClick_bound, { signal: this.#abort.signal });
      this.addEventListener('click', this.#fullscreenClick_bound, { signal: this.#abort.signal });
    } else if (this.#isExpanding) {
      this.classList.add('mdw-expanding');
      this.addEventListener('click', this.#expandClick_bound, { signal: this.#abort.signal });
      if (device.state === 'compact') {
        this.#expandDrag = new Drag(this, {
          disableMouseEvents: true,
          ignoreElements: [this.querySelector('.mdw-expanded')]
        });
        this.#expandDrag.on('mdwdragend', this.#expandDragEnd_bound);
        this.#expandDrag.enable();
      }
    }

    if (this.#isFullscreen || this.hasAttribute('onclick')) {
      this.tabIndex = 0;
      this.addEventListener('focus', this.#focus_bound, { signal: this.#abort.signal });
      this.addEventListener('mousedown', this.#focusMousedown_bound, { signal: this.#abort.signal });
    }

    this.#hasReorder = this.parentElement.classList.contains('mdw-reorder') || this.parentElement.classList.contains('mdw-reorder-swap');
    if (this.#swipeActionElement) {
      this.#dragSwipeAction = new Drag(this, {
        disableMouseEvents: true,
        lockScrollY: true
      });
      this.#dragSwipeAction.on('mdwdragmove', this.#ondragSwipeAction_bound);
      this.#dragSwipeAction.on('mdwdragstart', this.#ondragSwipeActionStart_bound);
      this.#dragSwipeAction.on('mdwdragend', this.#ondragSwipeActionEnd_bound);
      this.#dragSwipeAction.enable();
      this.#swipeActionElement.addEventListener('click', this.#swipeActionClick_bound, { signal: this.#abort.signal });
    } else if (this.#hasReorder) {
      this.#drag = new Drag(this, {
        reorder: true,
        reorderSwap: this.parentElement.classList.contains('mdw-reorder-swap'),
        reorderAnimation: !this.parentElement.classList.contains('mdw-reorder-no-animation')
      });
      this.#drag.enable();
    }
    
    setTimeout(() => {
      this.classList.add('mdw-animation');
    }, 150);

    // TODO re enable this
    // this.#handleAria();

    window.addEventListener('mdwwindowstate', this.#handleWindowState_bound);
    this.#handleWindowState();

    const rippleElement = this.querySelector(':scope > .mdw-ripple');
    if (rippleElement) {
      this.#ripple = new Ripple({
        element: rippleElement,
        triggerElement: this
      });
    }

    // prevent style calculation during script evaluation
    requestAnimationFrame(() => {
      this.#calculateImgMaxHeightForFullscreen();
    });
  }

  disconnectedCallback() {
    window.removeEventListener('mdwwindowstate', this.#handleWindowState_bound);
    this.classList.remove('mdw-animation');
    this.#abort.abort();
    if (this.#ripple) this.#ripple.destroy();
    if (this.#swipeActionElement) this.#dragSwipeAction.destroy();
    if (this.#expandDrag) this.#expandDrag.destroy();
    if (this.#drag) {
      this.#drag.destroy();
      this.#drag = undefined;
    }
  }

  static get observedAttributesExtended() {
    return [
      ['value', 'string']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get action(){
    return this.#value;
  }
  set value(value) {
    this.#value = value;
  }

  async remove() {
    this.style.setProperty('--mdw-card-margin-top-remove', `-${this.offsetHeight}px`);
    this.classList.add('mdw-remove');
    await util.transitionendAsync(this);
    super.remove();
  }

  async #fullscreen() {
    const initialized = !!this.#fullscreenPlaceHolder;
    if (!initialized) this.#fullscreenPlaceHolder = document.createElement('div');
    const bounds = this.getBoundingClientRect();

    // TODO change this to a sheet? currently we are just centering with a max-width of 600
    if (device.state !== 'compact') this.style.setProperty('--mdw-card-fullscreen-expanded-left', `calc(50% - ${bounds.width / 2}px)`);
    else this.style.setProperty('--mdw-card-fullscreen-expanded-left', `0px`);

    this.#fullscreenPlaceHolder.style.height = `${bounds.height}px`;
    this.#fullscreenPlaceHolder.style.width = `${bounds.width}px`;
    this.#fullscreenPlaceHolder.style.margin = getComputedStyle(this).margin;
    this.insertAdjacentElement('beforebegin', this.#fullscreenPlaceHolder);
    this.style.setProperty('--mdw-card-fullscreen-top', `${bounds.top}px`);
    this.style.setProperty('--mdw-card-fullscreen-left', `${bounds.left}px`);
    this.style.setProperty('--mdw-card-fullscreen-width', `${bounds.width}px`);
    this.style.setProperty('--mdw-card-fullscreen-height', `${bounds.height}px`);
    this.style.setProperty('--mdw-card-fullscreen-height', `${bounds.height}px`);
    if (!initialized) this.classList.add('mdw-fullscreen-initialized');
    this.classList.add('show');
  }

  #expandClick(event) {
    const expanded = this.querySelector('.mdw-card-content > .mdw-expanded');
    if (event.target === expanded || expanded.contains(event.target)) return;

    const isCompact = device.state === 'compact';
    const { clientHeight } = document.documentElement;
    
    if (this.classList.contains('show')) {
      expanded.style.height = '';
      if (!isCompact) this.style.marginBottom = '';
      this.classList.remove('show');
      util.transitionendAsync(this).then(() => {
        this.style.zIndex = '';
      });
    } else {
      const expandedBounds = expanded.getBoundingClientRect();
      let expandedHeight = expanded.offsetHeight + expanded.scrollHeight;
      if (!isCompact) {
        // max expand hight. will scroll if taller
        if (expandedHeight > 300) expandedHeight = 300;

        // do not expand off screen
        if (expandedBounds.top + expandedHeight > clientHeight - 12) expandedHeight = clientHeight - expandedBounds.top - 12;

        // prevent offscreen expand from being too small
        if (expandedHeight < 80) expandedHeight = 80;
      }
      if (!isCompact && expandedHeight > 300) {
        expandedHeight = 300;
      }
      expanded.style.height = `${expandedHeight}px`;
      if (!isCompact) this.style.marginBottom = `-${expandedHeight}px`;
      this.style.zIndex = '1';
      this.classList.add('show');
    }
  }

  // expand cards with scroll
  #expandDragEnd({ direction, swipe }) {
    if (swipe && direction === 'up' && !this.classList.contains('show')) this.#expandClick({ target: this });
    else if (swipe && direction === 'down' && this.classList.contains('show')) this.#expandClick({ target: this });
  }

  #fullscreenClick() {
    this.removeEventListener('click', this.#fullscreenClick_bound, { signal: this.#abort.signal });
    this.#fullscreen();
  }

  async #fullscreenBackClick() {
    this.classList.remove('show');
    await util.animationendAsync(this);
    this.#fullscreenPlaceHolder.remove();
    this.addEventListener('click', this.#fullscreenClick_bound, { signal: this.#abort.signal });
  }

  // sets height for fullscreen view so image can expand
  #calculateImgMaxHeightForFullscreen() {
    const img = this.querySelector(':scope > .mdw-card-image img');
    if (!img) return;

    if (!img.height) img.addEventListener('load', this.#imgOnload_bound, { signal: this.#abort.signal });
    else {
      const maxHeight = Math.min(img.height, img.height / img.width * window.innerWidth);
      this.style.setProperty('--mdw-card-fullscreen-img-height', `${maxHeight}px`);
    }
  }

  #imgOnload() {
    this.querySelector(':scope > .mdw-card-image img').removeEventListener('load', this.#imgOnload_bound);
    this.#calculateImgMaxHeightForFullscreen();
  }

  #ondragSwipeActionStart() {
    this.classList.add('mdw-dragging');
    this.#dragSwipeActionStartPosition = parseInt(getComputedStyle(this).getPropertyValue('--mdw-card-swipe-action-position').replace('px', ''));
  }

  #ondragSwipeAction({ distanceX }) {
    let position = this.#dragSwipeActionStartPosition + distanceX;
    if (position > 60) position = 60;
    if (position < 0) position = 0;
    this.style.setProperty('--mdw-card-swipe-action-position', `${position}px`);
  }

  async #ondragSwipeActionEnd({ swipeX, direction }) {
    this.classList.remove('mdw-dragging');
    const position = parseInt(getComputedStyle(this).getPropertyValue('--mdw-card-swipe-action-position').replace('px', ''));

    if (swipeX) {
      if (direction === 'right') this.style.setProperty('--mdw-card-swipe-action-position', `60px`);
      else this.style.setProperty('--mdw-card-swipe-action-position', `0px`);
    } else if (position < 30) this.style.setProperty('--mdw-card-swipe-action-position', `0px`);
    else this.style.setProperty('--mdw-card-swipe-action-position', `60px`);
  }

  // TODO make action its own component so it can have .checked ?
  #swipeActionClick() {
    if (this.#swipeActionElement.classList.contains('mdw-toggle')) {
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
      this.style.setProperty('--mdw-card-swipe-action-position', `0px`);
    }, 240);
  }

  #focus() {
    this.addEventListener('blur', this.#blur_bound, { signal: this.#abort.signal });
    this.addEventListener('keydown', this.#focusKeydown_bound, { signal: this.#abort.signal });
  }

  // prevent focus on click
  #focusMousedown(event) {
    event.preventDefault();
  }

  #blur() {
    this.removeEventListener('blur', this.#blur_bound, { signal: this.#abort.signal });
    this.removeEventListener('keydown', this.#focusKeydown_bound, { signal: this.#abort.signal });
  }

  #focusKeydown(e) {
    if (e.code === 'Enter' || e.code === 'Space') {
      this.click();
      e.preventDefault();
    }
  }

  // #handleAria() {
  //   const headline = this.querySelector(':scope > .mdw-card-content > .headline') || this.querySelector(':scope > .headline');
  //   if (headline) {
  //     if (!headline.hasAttribute('role')) headline.setAttribute('role', 'heading');
  //     if (!headline.hasAttribute('aria-label')) headline.setAttribute('aria-label', headline.innerText);
  //     if (!headline.hasAttribute('aria-level')) headline.setAttribute('aria-level', '2');
  //   }

  //   const subhead = this.querySelector(':scope > .mdw-card-content > .mdw-subhead') || this.querySelector(':scope > .mdw-subhead');
  //   if (subhead && !subhead.hasAttribute('aria-label')) subhead.setAttribute('aria-label', subhead.innerText);

  //   const supportingText = this.querySelector(':scope > .mdw-card-content > .mdw-supporting-text') || this.querySelector(':scope > .mdw-supporting-text');
  //   if (supportingText && !supportingText.hasAttribute('aria-label')) supportingText.setAttribute('aria-label', supportingText.innerText);

  //   const img = this.querySelector(':scope > .mdw-card-image > img') || this.querySelector(':scope > img');
  //   if (img && !img.hasAttribute('alt')) img.setAttribute('alt', supportingText ? supportingText.innerText : subhead ? subhead.innerText : headline ? headline.innerText : 'image');
  // }

  #handleWindowState() {
    const compact = device.state === 'compact';
    if (this.#hasReorder && this.#drag) this.#drag.reorderVerticalOnly = compact;
    if (this.#hasReorder) this.classList.toggle('mdw-grid-list-item', compact);
  }
}

customElements.define(MDWCardElement.tag, MDWCardElement);
