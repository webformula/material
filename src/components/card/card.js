import HTMLElementExtended from '../HTMLElementExtended.js';
import './card.css';
import Drag from '../../core/Drag.js';
import {
  expand_more_FILL0_wght400_GRAD0_opsz24,
  arrow_back_ios_FILL1_wght300_GRAD0_opsz24
} from '../../core/svgs.js';
import util from '../../core/util.js';


// TODO drag close fullscreen and expand
// TODO expanded card on drag. Look at material guidelines for video
// TODO drag reorder grid
// TODO ripple
// TODO aria labels


export default class MDWCardElement extends HTMLElementExtended {
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
  #fullscreenPlaceHolder;
  #fullscreenBackButton;
  #swipeActionElement = this.querySelector(':scope > mdw-card-swipe-action');
  #dragSwipeActionStartPosition;
  #dragSwipeAction;
  #value = '';
  #abort = new AbortController();
  #focus_bound = this.#focus.bind(this);
  #blur_bound = this.#blur.bind(this);
  #focusKeydown_bound = this.#focusKeydown.bind(this);


  constructor() {
    super();

    this.classList.add('mdw-no-animation');
  }

  connectedCallback() {    
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
      this.addEventListener('click', this.#expandClick_bound, { signal: this.#abort.signal });
    }

    if (this.#isFullscreen || this.hasAttribute('onclick')) {
      this.tabIndex = 0;
      this.addEventListener('focus', this.#focus_bound, { signal: this.#abort.signal });
    }

    this.#calculateImgMaxHeightForFullscreen();

    if (this.#swipeActionElement) {
      this.#dragSwipeAction = new Drag(this);
      this.#dragSwipeAction.lockScrollY = true;
      this.#dragSwipeAction.onDrag(this.#ondragSwipeAction_bound);
      this.#dragSwipeAction.onStart(this.#ondragSwipeActionStart_bound);
      this.#dragSwipeAction.onEnd(this.#ondragSwipeActionEnd_bound);
      this.#dragSwipeAction.enable();
      this.#swipeActionElement.addEventListener('click', this.#swipeActionClick_bound, { signal: this.#abort.signal });
    }
    
    setTimeout(() => {
      this.classList.remove('mdw-no-animation');
    }, 200);
  }

  disconnectedCallback() {
    this.classList.add('mdw-no-animation');
    this.#abort.abort();
    if (this.#swipeActionElement) this.#dragSwipeAction.destroy();
  }

  static get observedAttributes() {
    return ['value'];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
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
    if (!this.#fullscreenPlaceHolder) this.#fullscreenPlaceHolder = document.createElement('div');
    const bounds = this.getBoundingClientRect();


    this.#fullscreenPlaceHolder.style.height = `${bounds.height}px`;
    this.#fullscreenPlaceHolder.style.width = `${bounds.width}px`;
    this.#fullscreenPlaceHolder.style.margin = getComputedStyle(this).margin;
    this.insertAdjacentElement('beforebegin', this.#fullscreenPlaceHolder);
    this.style.setProperty('--mdw-card-fullscreen-top', `${bounds.top}px`);
    this.style.setProperty('--mdw-card-fullscreen-left', `${bounds.left}px`);
    this.style.setProperty('--mdw-card-fullscreen-width', `${bounds.width}px`);
    this.style.setProperty('--mdw-card-fullscreen-height', `${bounds.height}px`);
    this.classList.add('mdw-show');
  }

  #expandClick() {
    const expanded = this.querySelector('.mdw-card-content > .mdw-expanded');
    if (this.classList.contains('mdw-show')) {
      expanded.style.height = '';
      this.classList.remove('mdw-show');
    } else {
      expanded.style.height = `${expanded.offsetHeight + expanded.scrollHeight}px`;
      this.classList.add('mdw-show')
    }
  }

  #fullscreenClick() {
    this.removeEventListener('click', this.#fullscreenClick_bound, { signal: this.#abort.signal });
    this.#fullscreen();
  }

  async #fullscreenBackClick() {
    this.classList.remove('mdw-show');
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
      const maxHeight = img.height / img.width * window.innerWidth;
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

  #ondragSwipeAction({ distance }) {
    let position = this.#dragSwipeActionStartPosition + distance.x;
    if (position > 60) position = 60;
    if (position < 0) position = 0;
    this.style.setProperty('--mdw-card-swipe-action-position', `${position}px`);
  }

  async #ondragSwipeActionEnd() {
    this.classList.remove('mdw-dragging');
    const position = parseInt(getComputedStyle(this).getPropertyValue('--mdw-card-swipe-action-position').replace('px', ''));
    if (position < 30) this.style.setProperty('--mdw-card-swipe-action-position', `0px`);
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
    console.log(actionRemove)
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
}

customElements.define('mdw-card', MDWCardElement);
