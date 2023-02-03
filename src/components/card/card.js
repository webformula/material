import HTMLElementExtended from '../HTMLElementExtended.js';
import './card.css';
import Drag from '../../core/Drag.js';
import arrowDropDownSVG from '../../svg-icons/expand_more_FILL0_wght400_GRAD0_opsz24.svg';
import chevronLeftIconSVGRaw from '../../svg-icons/arrow_back_ios_FILL1_wght300_GRAD0_opsz24.svg';

import util from '../../core/util.js';

// TODO drag close fullscreen and expand


// TODO expanded card on drag. Look at material guidelines for video
// TODO drag reorder grid


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
  // #ondragFullscreen_bound = this.#ondragFullscreen.bind(this);
  // #ondragFullscreenStart_bound = this.#ondragFullscreenStart.bind(this);
  // #ondragFullscreenEnd_bound = this.#ondragFullscreenEnd.bind(this);
  // #dragFullscreenStartPosition;
  // #initialDragFullscreenPosition;
  #fullscreenPlaceHolder;
  #fullscreenBackButton;
  #swipeActionElement = this.querySelector(':scope > mdw-card-swipe-action');
  #dragSwipeActionStartPosition;
  #dragSwipeAction;
  #dragFullscreen;
  #value = ''


  constructor() {
    super();

    this.classList.add('mdw-no-animation');
  }

  connectedCallback() {
    const arrow = this.querySelector('.mdw-expand-arrow');
    if (arrow) arrow.innerHTML = arrowDropDownSVG;

    if (this.#isFullscreen) {
      this.#fullscreenBackButton = document.createElement('div');
      this.#fullscreenBackButton.classList.add('mdw-card-fullscreen-back');
      this.#fullscreenBackButton.innerHTML = chevronLeftIconSVGRaw;
      // this.#fullscreenBackButton.innerHTML = `${chevronLeftIconSVGRaw}<span class="text">Back</span>`;
      this.insertAdjacentElement('afterbegin', this.#fullscreenBackButton);
      this.#fullscreenBackButton.addEventListener('click', this.#fullscreenBackClick_bound);
      this.addEventListener('click', this.#fullscreenClick_bound);
    } else if (this.#isExpanding) {
      this.addEventListener('click', this.#expandClick_bound);
      // this.#dragFullscreen = new Drag(this);
      // this.#dragFullscreen.onDrag(this.#ondragFullscreen_bound);
      // this.#dragFullscreen.onStart(this.#ondragFullscreenStart_bound);
      // this.#dragFullscreen.onEnd(this.#ondragFullscreenEnd_bound);
      // this.#dragFullscreen.enable();
    }

    this.#calculateImgMaxHeightForFullscreen();

    if (this.#swipeActionElement) {
      this.#dragSwipeAction = new Drag(this);
      this.#dragSwipeAction.lockScrollY = true;
      this.#dragSwipeAction.onDrag(this.#ondragSwipeAction_bound);
      this.#dragSwipeAction.onStart(this.#ondragSwipeActionStart_bound);
      this.#dragSwipeAction.onEnd(this.#ondragSwipeActionEnd_bound);
      this.#dragSwipeAction.enable();
      this.#swipeActionElement.addEventListener('click', this.#swipeActionClick_bound);
    }
    
    setTimeout(() => {
      this.classList.remove('mdw-no-animation');
    }, 200);
  }

  disconnectedCallback() {
    this.classList.add('mdw-no-animation');
    if (this.#isFullscreen) {
      this.#fullscreenBackButton.removeEventListener('click', this.#fullscreenBackClick_bound);
      this.removeEventListener('click', this.#fullscreenClick_bound);
    } else {
      this.removeEventListener('click', this.#expandClick_bound);

    }

    if (this.#swipeActionElement) {
      this.#dragSwipeAction.destroy();
      this.#swipeActionElement.removeEventListener('click', this.#swipeActionClick_bound);
    }
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
    this.removeEventListener('click', this.#fullscreenClick_bound);
    this.#fullscreen();
  }

  async #fullscreenBackClick() {
    this.classList.remove('mdw-show');
    await util.animationendAsync(this);
    this.#fullscreenPlaceHolder.remove();
    this.addEventListener('click', this.#fullscreenClick_bound);
  }

  // sets height for fullscreen view so image can expand
  #calculateImgMaxHeightForFullscreen() {
    const img = this.querySelector(':scope > .mdw-card-image img');
    if (!img) return;

    if (!img.height) img.addEventListener('load', this.#imgOnload_bound);
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

  // #ondragFullscreenStart() {
  //   this.classList.add('mdw-dragging');
  //   this.#dragFullscreenStartPosition = parseInt(getComputedStyle(this).getPropertyValue('--mdw-card-drag-expand-position').replace('px', ''));
  //   this.#initialDragFullscreenPosition = this.#dragFullscreenStartPosition;
  // }

  // #ondragFullscreen({ distance }) {
  //   let position = this.#dragFullscreenStartPosition + distance.y;
  //   this.style.setProperty('--mdw-card-drag-expand-position', `${position}px`);
  // }

  // async #ondragFullscreenEnd({ distance, direction }) {
  //   this.classList.remove('mdw-dragging');
  //   const bottom = this.#initialDragFullscreenPosition - distance.y;
  //   if (direction.y === -1) {
  //     if (bottom > this.#initialDragFullscreenPosition) this.#expandClick();
  //     else this.style.setProperty('--mdw-card-drag-expand-position', `0px`);
  //   } else {
  //     if (bottom >= this.#initialDragFullscreenPosition) this.style.setProperty('--mdw-card-drag-expand-position', `0px`);
  //     else this.#expandClick();
  //   }
  // }
}

customElements.define('mdw-card', MDWCardElement);
