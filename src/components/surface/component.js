import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './component.css' assert { type: 'css' };
import util from '../../core/util.js';

const animations = ['translate-y', 'translate-left', 'translate-right', 'height'];
const validPositionRegex = /^(?:position-)?(center|top|bottom)(?:[\s|-](center|left|right))?$/;


// TODO scrim


export default class MDWSurfaceElement extends HTMLComponentElement {
  static useShadowRoot = true;
  static useTemplate = true;

  #abort;
  #anchor;
  #anchorElement;
  #surfaceElement;
  #position = 'center center';
  #positionMouse;
  #mouseX;
  #mouseY;
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
  #onClickOutside_bound = this.#onClickOutside.bind(this);
  #onEsc_bound = this.#onEsc.bind(this);
  #setMousePosition_bound = this.#setMousePosition.bind(this);


  constructor() {
    super();

    // add stylesheet here so it will not be overridden by extending class
    this.constructor.styleSheets = [].concat(...[styles, this.constructor.styleSheets]);

    this.render();
    this.#surfaceElement = this.shadowRoot.querySelector('.surface');
  }

  /* Default template can be overridden
   * as long as you have .surface and .surface-content
   */
  template() {
    return /*html*/`
      <div class="surface">
        <div class="surface-content">
          <slot></slot>
        </div>
      </div>
      <div class="scrim"></div>
    `;
  }

  connectedCallback() {
    this.#abort = new AbortController();
    const positionClass = [...this.classList].find(v => v.startsWith('position-'));
    if (positionClass) this.position = positionClass;
    if (this.#closeDelay) this.#surfaceElement.style.setProperty('--mdw-surface-close-delay', `${this.#closeDelay}ms`);
    this.#surfaceElement.classList.toggle('viewport-bound', this.#viewportBound);
    this.#surfaceElement.classList.toggle('always-visible', this.#alwaysVisible);
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
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

  get alwaysVisible() { return this.#alwaysVisible; }
  set alwaysVisible(value) {
    this.#alwaysVisible = !!value
    this.#surfaceElement.classList.toggle('always-visible', this.#alwaysVisible);
  }

  get open() { return this.#open; }
  set open(value) {
    if (!!value) this.show();
    else this.close();
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

  get overlap() { return this.#overlap; }
  set overlap(value) { this.#overlap = !!value; }

  get closeDelay() { return this.#closeDelay }
  set closeDelay(value) {
    this.#closeDelay = parseInt(value || 0);
    this.#surfaceElement.style.setProperty('--mdw-surface-close-delay', `${this.#closeDelay}ms`);
  }



  async show() {
    if (this.open) return;
    this.#open = true;
    this.classList.add('open');
    
    this.#setPosition();
    this.onShow();
    this.#surfaceElement.classList.add('animating');
    this.dispatchEvent(new Event('change'));
    await util.animationendAsync(this.#surfaceElement);
    this.#surfaceElement.classList.remove('animating');

    // TODO if no animation then these can trigger immediately
    if (this.#allowClose) {
      window.addEventListener('click', this.#onClickOutside_bound, { signal: this.#abort.signal });
      window.addEventListener('keydown', this.#onEsc_bound, { signal: this.#abort.signal });
    }
  }

  async close() {
    if (!this.open) return;
    this.#open = false;

    this.onHide();
    if (this.#allowClose) {
      window.removeEventListener('click', this.#onClickOutside_bound);
      window.removeEventListener('keydown', this.#onEsc_bound);
    }
    this.#surfaceElement.classList.add('animating');
    this.classList.remove('open');
    this.dispatchEvent(new Event('change'));
    await util.animationendAsync(this.#surfaceElement);
    this.#surfaceElement.classList.remove('animating');
    this.#surfaceElement.style.removeProperty('--mdw-surface-height');
    this.#surfaceElement.style.removeProperty('--mdw-surface-width');
    this.#surfaceElement.style.left = '';
    this.#surfaceElement.style.bottom = '';
    this.#surfaceElement.style.top = '';
    this.dispatchEvent(new Event('close'));

    this.onHideEnd();
  }

  toggle() {
    this.open = !this.open;
  }

  onShow() {}
  onHide() {}
  onHideEnd() { }


  #setPosition() {
    if (this.#anchorElement || this.#positionMouse) this.#setAnchorPosition();
    else this.#setNonAnchorPosition();
  }

  #getAnchorPosition() {
    // TODO more alignments
    const position = this.#position.split(' ');
    const alignTop = position[0] === 'top';
    const alignRight = position[1] === 'right';

    const { clientWidth, clientHeight } = document.documentElement;
    const anchorBounds = this.#anchorElement.getBoundingClientRect();
    const offsetParent = this.#surfaceElement.offsetParent;
    const offsetParentBounds = offsetParent?.getBoundingClientRect();
    const verticalStart = !alignTop && !this.#overlap ? anchorBounds.top : anchorBounds.bottom + this.#offsetBottom;
    const verticalEnd = alignTop || this.#overlap ? anchorBounds.top : anchorBounds.bottom + this.#offsetBottom;
    const horizontalStart = alignRight ? anchorBounds.right : anchorBounds.left;
    const horizontalEnd = !alignRight ? anchorBounds.right : anchorBounds.left;

    return {
      clientHeight,
      clientWidth,
      verticalStart,
      verticalEnd,
      horizontalStart,
      horizontalEnd,
      offsetTop: offsetParentBounds?.top || 0,
      offsetBottom: offsetParentBounds?.bottom || clientHeight,
      offsetLeft: offsetParentBounds?.left || 0
    };
  }

  #getMousePosition() {
    const { clientWidth, clientHeight } = document.documentElement;
    const offsetParent = this.#surfaceElement.offsetParent;
    const offsetParentBounds = offsetParent.getBoundingClientRect();

    return {
      clientHeight,
      clientWidth,
      verticalStart: this.#mouseY,
      verticalEnd: this.#mouseY,
      horizontalStart: this.#mouseX,
      horizontalEnd: this.#mouseX,
      offsetTop: offsetParentBounds?.top || 0,
      offsetBottom: offsetParentBounds?.bottom || clientHeight,
      offsetLeft: offsetParentBounds?.left || 0
    };
  }

  #setAnchorPosition() {
    const {
      clientHeight,
      clientWidth,
      verticalStart,
      verticalEnd,
      horizontalStart,
      horizontalEnd,
      offsetTop,
      offsetBottom,
      offsetLeft
    } = this.#positionMouse ? this.#getMousePosition() : this.#getAnchorPosition();

    const width = this.#surfaceElement.offsetWidth;
    let height = this.#surfaceElement.offsetHeight;
    let left = (horizontalStart - offsetLeft);
    let top = (verticalEnd - offsetTop);
    let bottom;

    if (this.#viewportBound) {
      const overlapPadding = 24;
      const overlapBottom = clientHeight - (verticalEnd + height + overlapPadding);
      const overlapRight = Math.min(0, clientWidth - (horizontalEnd + width + 12));

      this.#surfaceElement.classList.remove('above');

      if (overlapBottom < 0) {
        const overlapTop = verticalStart - (height + overlapPadding);
        const overLapBottomLessThanHalfHeight = Math.abs(overlapBottom) <= height / 2;
        const enoughRoomToShiftUp = overlapTop + height >= Math.abs(overlapBottom);
        const canShiftUp = this.#overlap === true && overLapBottomLessThanHalfHeight && enoughRoomToShiftUp;


        // shift up
        if (canShiftUp) {
          top += overlapBottom

          // position above anchor
        } else if (overlapTop >= 0) {
          bottom = (offsetBottom - verticalStart) + this.#offsetTop;
          top = undefined;

          this.#surfaceElement.classList.add('above');

          // shrink with overlap
        } else if (this.#overlap) {
          const newHeight = Math.min(height, clientHeight - (overlapPadding * 2));
          top += overlapBottom + (height - newHeight);
          height = newHeight;

          // shrink
        } else {
          // choose above or below based on how much room there is
          if (overlapBottom > overlapTop) {
            height += overlapBottom;
          } else {
            height += overlapTop;
            bottom = (offsetBottom - verticalStart) + this.#offsetTop;
            top = undefined;
          }
        }
      }

      // basic translation for horizontal for now
      if (overlapRight) left -= overlapRight;
    }

    this.#surfaceElement.classList.toggle('overlap', this.#overlap);
    this.#surfaceElement.style.setProperty('--mdw-surface-height', `${height}px`);
    this.#surfaceElement.style.setProperty('--mdw-surface-width', `${width}px`);
    this.#surfaceElement.style.left = `${left}px`;
    this.#surfaceElement.style.bottom = bottom !== undefined ? `${bottom}px` : '';
    this.#surfaceElement.style.top = top !== undefined ? `${top}px` : '';
  }

  #setNonAnchorPosition() {
    // TODO offsets for non anchor
    // this.#surfaceElement.style.setProperty('--mdw-surface-offset-y', `${this.#offsetBottom || 0}px`);
    // this.#surfaceElement.style.setProperty('--mdw-surface-offset-X', `${this.#offsetX || 0}px`);
    this.#surfaceElement.style.setProperty('--mdw-surface-height', `${this.#surfaceElement.offsetHeight}px`);
    this.#surfaceElement.style.setProperty('--mdw-surface-width', `${this.#surfaceElement.offsetWidth}px`);
  }

  #setMousePosition(event) {
    this.#mouseX = event.clientX;
    this.#mouseY = event.clientY;
  }

  #onClickOutside(event) {
    // if (event.target === this) return;
    // if (this.contains(event.target)) return;
    // const isIgnoreElement = this.#allowCloseIgnoreElements.find(v => v.contains(event.target));
    // if (isIgnoreElement) return;
    this.close();
  }

  #onEsc(e) {
    if (e.code !== 'Escape') return;
    this.close();
    e.preventDefault();
  }
};

customElements.define('mdw-surface', MDWSurfaceElement);
