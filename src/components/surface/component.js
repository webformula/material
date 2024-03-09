import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import util from '../../core/util.js';
import device from '../../core/device.js';
import Drag from '../../core/drag.js';

const animations = ['translate-y', 'translate-left', 'transition-right', 'translate-right', 'height', 'height-center-to-opacity', 'fullscreen', 'opacity'];
const validPositionRegex = /^(?:position-)?(center|top|bottom)(?:[\s|-](center|left|right))?$/;


export default class WFCSurfaceElement extends HTMLComponentElement {
  static tag = 'wfc-surface';
  static useShadowRoot = true;
  static useTemplate = true;

  #abort;
  #drag;
  #anchor;
  #anchorElement;
  #surfaceElement;
  #position = 'center center';
  #positionMouse;
  #positionMouseOnly;
  #mouseX;
  #mouseY;
  #shrink = true;
  #fixed = false;
  #overlap = true;
  #animation = 'height';
  #viewportBound = true;
  #alwaysVisible = false;
  #offsetTop = 0;
  #offsetBottom = 0;
  #closeDelay = 0;
  #scrim = false;
  #open = false;
  #initialOpen = false;
  #allowClose = false;
  #resizable = false;
  #swipeClose;
  #mutationObserver;
  #predictiveBackIcon;
  #onChildrenChange_bound = this.#onChildrenChange.bind(this);
  #onClickOutside_bound = this.#onClickOutside.bind(this);
  #onEsc_bound = this.#onEsc.bind(this);
  #setMousePosition_bound = this.#setMousePosition.bind(this);
  #swipeCloseStart_bound = this.#swipeCloseStart.bind(this);
  #swipeCloseMove_bound = this.#swipeCloseMove.bind(this);
  #swipeCloseEnd_bound = this.#swipeCloseEnd.bind(this);


  constructor(callRender = true) {
    super();

    // add stylesheet here so it will not be overridden by extending class
    if (this.constructor.styleSheets) this.constructor.styleSheets = [].concat(...[styles, this.constructor.styleSheets]);
    else this.constructor.styleSheets = [styles];

    if (callRender) {
      this.render();
      this.#surfaceElement = this.shadowRoot.querySelector('.surface');
    }
  }

  /* Default template can be overridden
   * as long as you have .surface and .surface-content
   */
  template() {
    return /*html*/`
      <div class="scrim"></div>
      <div class="surface">
        <div class="surface-content">
          <slot></slot>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    if (!this.#surfaceElement) this.#surfaceElement = this.shadowRoot.querySelector('.surface');
    this.#abort = new AbortController();
    const positionClass = [...this.classList].find(v => v.startsWith('position-'));
    if (positionClass) this.position = positionClass;
    if (this.#closeDelay) this.#surfaceElement.style.setProperty('--wfc-surface-close-delay', `${this.#closeDelay}ms`);
    this.#surfaceElement.classList.toggle('viewport-bound', this.#viewportBound);
    this.#surfaceElement.classList.toggle('always-visible', this.#alwaysVisible);
    if (device.hasTouchScreen && this.#swipeClose) {
      this.#drag = new Drag(this.#surfaceElement);
      this.#drag.horizontalOnly = true;
      this.#drag.preventSwipeNavigation = true;
      this.#drag.on('wfcdragstart', this.#swipeCloseStart_bound);
      this.#drag.on('wfcdragmove', this.#swipeCloseMove_bound);
      this.#drag.on('wfcdragend', this.#swipeCloseEnd_bound);
      this.#drag.enable();

      this.#predictiveBackIcon = this.shadowRoot.querySelector('.predictive-back-icon');
    }

    setTimeout(() => {
      this.classList.add('animation');
    }, 150);
  }

  #swipeCloseStart({ clientX }) {
    if (
      ((clientX < (device.windowWidth / 2)  && clientX > 30)
      || (clientX > (device.windowWidth / 2) && (device.windowWidth - clientX) > 50))
    ) {
      this.#drag.cancel();
    }
  }

  #swipeCloseMove({ distanceX, directionX }) {
    distanceX = Math.abs(distanceX);
    const scalePercent = Math.max(0, this.#easeInQuint(1 - (distanceX / device.windowWidth)));
    const scaleOffset = 0.02;
    const scale = (1 - scaleOffset) + (scalePercent * scaleOffset);
    const translatePercent = Math.min(1, this.#easeInQuart(distanceX / device.windowWidth));
    const translate = translatePercent * 3;
    this.#surfaceElement.style.transform = `translateX(${translate * directionX}px) scale(${scale})`;

    if (this.#predictiveBackIcon && distanceX > 50) {
      this.#predictiveBackIcon.classList.remove('hide');
      const stretch = Math.min(1, ((distanceX - 45) / (device.windowWidth / 2)));
      this.#predictiveBackIcon.style.setProperty('--wfc-predictive-back-stretch', `${stretch * 16}px`);
    } else {
      this.#predictiveBackIcon.classList.add('hide');
    }
  }
  #swipeCloseEnd({ distanceX }) {
    this.#surfaceElement.style.transform = '';
    this.#predictiveBackIcon.classList.add('hide');
    if (Math.abs(distanceX) > device.windowWidth / 4) this.close();
  }

  #easeInQuart(x) {
    return x * x * x * x;
  }

  #easeInQuint(x) {
    return x * x * x * x * x;
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
    if (this.#mutationObserver) {
      this.#mutationObserver.disconnect();
      this.#mutationObserver = undefined;
    }
  }

  static get observedAttributesExtended() {
    return [['anchor', 'string']];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get anchor() { return this.#anchor; }
  set anchor(value) {
    const anchorElement = document.querySelector(value);
    if (anchorElement) {
      this.#anchor = value;
      this.#anchorElement = anchorElement;
      this.classList.add('anchor');
    } else {
      this.classList.remove('anchor');
      this.#anchor = undefined;
      this.#anchorElement = undefined;
    }
  }

  get anchorElement() { return this.#anchorElement; }
  set anchorElement(value) {
    if (!value || !value.nodeName) {
      this.classList.remove('anchor');
      this.#anchorElement = undefined;
    } else {
      this.classList.add('anchor');
      this.#anchorElement = value;
    }
  }

  get animation() { return this.#animation; }
  set animation(value) {
    if (!animations.includes(value)) throw Error(`Invalid value. values = (${animations.join(', ')})`);
    this.#animation = value;
    this.classList.toggle('animation-height', value === 'height');
    this.classList.toggle('animation-translate-left', value === 'translate-left');
    this.classList.toggle('animation-translate-right', value === 'translate-right');
    this.classList.toggle('animation-height-center-to-opacity', value === 'height-center-to-opacity');
    this.classList.toggle('animation-fullscreen', value === 'fullscreen');
    this.classList.toggle('animation-opacity', value === 'opacity');
  }

  get viewportBound() { return this.#viewportBound; }
  set viewportBound(value) {
    this.#viewportBound = !!value;
    this.#surfaceElement.classList.toggle('viewportBound-bound', this.#viewportBound);
  }

  get scrim() { return this.#scrim; }
  set scrim(value) {
    this.#scrim = !!value;
    this.classList.toggle('scrim', this.#scrim);
  }

  get offsetBottom() { return this.#offsetBottom; }
  set offsetBottom(value) {
    this.#offsetBottom = parseInt(value);
  }

  get offsetTop() { return this.#offsetTop; }
  set offsetTop(value) {
    this.#offsetTop = parseInt(value);
  }

  get allowClose() { return this.#allowClose; }
  set allowClose(value) { this.#allowClose = !!value; }

  get shrink() { return this.#shrink; }
  set shrink(value) { this.#shrink = !!value; }

  get alwaysVisible() { return this.#alwaysVisible; }
  set alwaysVisible(value) {
    this.#alwaysVisible = !!value
    this.#surfaceElement.classList.toggle('always-visible', this.#alwaysVisible);
  }

  get open() { return this.#open; }
  set open(value) {
    if (!!value) this.show();
    else this.close();
    this.toggleAttribute('open', !!value);
  }

  get initialOpen() { return this.#initialOpen; }
  set initialOpen(value) {
    this.#initialOpen = !!value;
    this.#open = true;
    this.classList.add('open');
  }

  get fixed() { return this.#fixed }
  set fixed(value) {
    this.#fixed = !!value;
    this.classList.toggle('fixed', this.#fixed);
  }

  get position() { return this.#position; }
  set position(value) {
    if (!value) return;
    const match = value.match(validPositionRegex);
    if (!match) {
      console.error('Invalid position');
      return;
    }
    this.#position = `${match[1]} ${match[2] || 'center'}`;
    const positionClass = `position-${match[1]}${match[2] ? `-${match[2]}` : ''}`;
    if (!this.classList.contains(positionClass)) this.classList.add(positionClass);
  }

  get positionMouse() { return this.#positionMouse; }
  set positionMouse(value) {
    this.#positionMouse = !!value;
    if (this.#positionMouse) window.addEventListener('mousedown', this.#setMousePosition_bound, { signal: this.#abort.signal });
    else window.removeEventListener('mousedown', this.#setMousePosition_bound);
  }

  get positionMouseOnly() { return this.#positionMouseOnly; }
  set positionMouseOnly(value) {
    this.#positionMouseOnly = !!value;
    if (this.#positionMouseOnly) window.addEventListener('mousedown', this.#setMousePosition_bound, { signal: this.#abort.signal });
    else window.removeEventListener('mousedown', this.#setMousePosition_bound);
  }

  set mouseX(value) {
    this.#mouseX = value;
  }
  set mouseY(value) {
    this.#mouseY = value;
  }

  get overlap() { return this.#overlap; }
  set overlap(value) { this.#overlap = !!value; }

  get closeDelay() { return this.#closeDelay }
  set closeDelay(value) {
    this.#closeDelay = parseInt(value || 0);
    this.#surfaceElement.style.setProperty('--wfc-surface-close-delay', `${this.#closeDelay}ms`);
  }

  get resizable() { return this.#resizable; }
  set resizable(value) {
    this.#resizable = !!value;
    if (this.#resizable === true) {
      this.#mutationObserver = new MutationObserver(this.#onChildrenChange_bound);
    } else if (this.#mutationObserver) {
      this.#mutationObserver.disconnect();
      this.#mutationObserver = undefined;
    }
  }

  get swipeClose() { return this.#swipeClose; }
  set swipeClose(value) {
    this.#swipeClose = !!value;
  }


  async show() {
    if (this.open) return;
    this.#open = true;
    this.onShowBefore();
    if (this.animation === 'fullscreen') {
      this.#preShowFullscreen();
      util.lockPageScroll();
    }
    this.classList.add('open');
    
    this.#setPosition();
    this.onShow();
    this.#surfaceElement.classList.add('animating');
    if (this.animation === 'fullscreen') await util.transitionendAsync(this);
    else await util.animationendAsync(this.#surfaceElement);
    this.#surfaceElement.classList.remove('animating');
    this.#surfaceElement.style.removeProperty('--wfc-surface-height');
    this.#surfaceElement.style.removeProperty('--wfc-surface-width');

    // If no animation then these can trigger immediately
    if (this.#allowClose) {
      if (this.#scrim) this.shadowRoot.querySelector('.scrim').addEventListener('click', this.#onClickOutside_bound, { signal: this.#abort.signal });
      else window.addEventListener('click', this.#onClickOutside_bound, { signal: this.#abort.signal });
      window.addEventListener('keydown', this.#onEsc_bound, { signal: this.#abort.signal });
    }

    // handle changes in items. Example: options list filter
    if (this.#resizable && this.#surfaceElement.classList.contains('above')) this.#mutationObserver.observe(this, { attributes: true, subtree: true });

    this.onShowEnd();
  }

  async close() {
    if (!this.open) return;
    this.#open = false;

    if (this.#resizable && this.#mutationObserver) this.#mutationObserver.disconnect();

    this.onHide();
    if (this.#allowClose) {
      if (this.#scrim) this.shadowRoot.querySelector('.scrim').removeEventListener('click', this.#onClickOutside_bound);
      else window.removeEventListener('click', this.#onClickOutside_bound);
      window.removeEventListener('keydown', this.#onEsc_bound);
    }

    if (this.animation === 'height') {
      this.#surfaceElement.style.setProperty('--wfc-surface-height', `${this.#surfaceElement.offsetHeight}px`);
      this.#surfaceElement.style.setProperty('--wfc-surface-width', `${this.#surfaceElement.offsetWidth}px`);
    }

    this.#surfaceElement.classList.add('animating');
    this.classList.add('closing');
    this.classList.remove('open');
    if (this.animation === 'fullscreen') this.#postHideFullscreen();
    if (this.animation === 'fullscreen') await util.transitionendAsync(this);
    else await util.animationendAsync(this.#surfaceElement);
    this.#surfaceElement.classList.remove('above');
    this.#surfaceElement.classList.remove('animating');
    this.#surfaceElement.style.left = '';
    this.#surfaceElement.style.bottom = '';
    this.#surfaceElement.style.top = '';
    this.classList.remove('closing');
    if (this.animation === 'fullscreen') {
      this.#clearFullScreen();
      this.#fullscreenPlaceholder.remove();
      util.unlockPageScroll();
    }
    this.dispatchEvent(new Event('close'));

    this.onHideEnd();
  }

  toggle() {
    this.open = !this.open;
  }

  onShowBefore() {}
  onShow() {}
  onShowEnd() {}
  onHide() {}
  onHideEnd() {}

  #setPosition(maintainAbove = false) {
    if (this.#positionMouseOnly) this.#setMousePositionOnly();
    else if (this.#anchorElement || this.#positionMouse) this.#setAnchorPosition(maintainAbove);
    else this.#setNonAnchorPosition();
  }
  
  #setAnchorPosition(maintainAbove = false) {
    const overlapPadding = 16;
    const position = this.#position.split(' ');
    const alignTop = position[0] === 'top';
    const alignRight = position[1] === 'right';
    const { clientWidth, clientHeight, scrollTop } = document.documentElement;
    const width = this.#surfaceElement.offsetWidth;
    const anchorBounds = this.#anchorElement.getBoundingClientRect();
    let height = this.#surfaceElement.querySelector('.surface-content').scrollHeight;
    let translateY = !alignTop ? 0 + this.#offsetBottom : anchorBounds.height;
    let translateX = this.#positionMouse ? this.#mouseX - anchorBounds.left : (alignRight ? (anchorBounds.width - overlapPadding) : 0);
    if (maintainAbove && !this.#surfaceElement.classList.contains('above')) maintainAbove = false;

    if (this.fixed) {
      translateY -= scrollTop;
      translateY += (height / 2) + (anchorBounds.height / 2);
    }

    if (this.#viewportBound) {
      const verticalStart = anchorBounds.bottom + this.#offsetBottom;
      const overlapBottom = clientHeight - (verticalStart + height + overlapPadding);
      const overlapRight = Math.min(0, clientWidth - (anchorBounds.left + width + translateX + overlapPadding));

      if (overlapBottom < 0 || maintainAbove) {
        const overlapTop = verticalStart - (height + overlapPadding);
        const overLapBottomLessThanHalfHeight = Math.abs(overlapBottom) <= height / 2;
        const enoughRoomToShiftUp = overlapTop + height >= Math.abs(overlapBottom);
        const canShiftUp = this.#overlap === true && overLapBottomLessThanHalfHeight && enoughRoomToShiftUp;

        // shift up
        if (canShiftUp && !maintainAbove) {
          translateY += overlapBottom;

        // position above anchor
        } else if (overlapTop >= 0 || maintainAbove) {
          translateY -= height;
          if (!this.#overlap) translateY -= anchorBounds.height;
          this.#surfaceElement.classList.add('above');

        // shrink with overlap
        } else if (this.#overlap && this.#shrink) {
          const newHeight = Math.min(height, clientHeight - (overlapPadding * 2));
          translateY += overlapBottom + (height - newHeight);
          height = newHeight;

        // shrink
        } else {
          // choose above or below based on how much room there is
          if (overlapBottom > overlapTop) {
            if (this.#shrink) height += overlapBottom - anchorBounds.height;
            translateY -= anchorBounds.height - anchorBounds.height;
          } else {
            if (this.#shrink) height += overlapTop - anchorBounds.height;
            translateY -= height + anchorBounds.height;
          }
        }
      }

      // basic translation for horizontal for now
      if (overlapRight) translateX += overlapRight;
    }

    this.#surfaceElement.classList.toggle('overlap', this.#overlap);
    this.#surfaceElement.style.setProperty('--wfc-surface-height', `${height}px`);
    this.#surfaceElement.style.setProperty('--wfc-surface-width', `${width}px`);
    this.#surfaceElement.style.setProperty('--wfc-surface-translate-x', `${translateX}px`);
    this.#surfaceElement.style.setProperty('--wfc-surface-translate-y', `${translateY}px`);
    this.#surfaceElement.style.setProperty('--wfc-surface-offset-bottom', `${this.#offsetBottom}px`);
    this.#surfaceElement.style.transform = 'translate(var(--wfc-surface-translate-x), var(--wfc-surface-translate-y))';
  }

  #setMousePositionOnly() {
    this.#surfaceElement.style.left = `${this.#mouseX}px`;
    this.#surfaceElement.style.top = `${this.#mouseY}px`;
  }

  #setNonAnchorPosition() {
    this.#surfaceElement.style.setProperty('--wfc-surface-height', `${this.#surfaceElement.offsetHeight}px`);
    this.#surfaceElement.style.setProperty('--wfc-surface-width', `${this.#surfaceElement.offsetWidth}px`);

    if (this.animation === 'fullscreen') this.#clearFullScreen();
  }

  #preFullscreenBounds;
  #fullscreenPlaceholder;
  #preShowFullscreen() {
    if (!this.#fullscreenPlaceholder) {
      this.#fullscreenPlaceholder = document.createElement('div');
      this.#fullscreenPlaceholder.classList.add('wfc-surface-placeholder');
    }
    this.#preFullscreenBounds = this.getBoundingClientRect();
    this.#postHideFullscreen();

    this.#fullscreenPlaceholder.style.top = `${this.#preFullscreenBounds.top}px`;
    this.#fullscreenPlaceholder.style.left = `${this.#preFullscreenBounds.left}px`;
    this.#fullscreenPlaceholder.style.width = `${this.#preFullscreenBounds.width}px`;
    this.#fullscreenPlaceholder.style.height = `${this.#preFullscreenBounds.height}px`;
    this.insertAdjacentElement('afterend', this.#fullscreenPlaceholder);
  }

  #postHideFullscreen() {
    this.style.top = `${this.#preFullscreenBounds.top}px`;
    this.style.left = `${this.#preFullscreenBounds.left}px`;
    this.style.width = `${this.#preFullscreenBounds.width}px`;
    this.style.height = `${this.#preFullscreenBounds.height}px`;
  }

  #clearFullScreen() {
    this.style.top = '';
    this.style.left = '';
    this.style.width = '';
    this.style.height = '';
  }

  #setMousePosition(event) {
    this.#mouseX = event.clientX;
    this.#anchorElement = event.target;
  }

  #onClickOutside(event) {
    if (event.target === this) return;
    if (!event.target.classList.contains('scrim') && this.contains(event.target)) return;
    this.close();
  }

  #onEsc(e) {
    if (e.code !== 'Escape') return;
    this.close();
    e.preventDefault();
  }

  #onChildrenChange() {
    this.#setPosition(true);
  }
};

customElements.define(WFCSurfaceElement.tag, WFCSurfaceElement);
