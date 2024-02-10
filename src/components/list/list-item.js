import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './list-item.css' assert { type: 'css' };
import Ripple from '../../core/Ripple.js';
import Drag from '../../core/Drag.js';
import util from '../../core/util.js';

// TODO Figure out is we should have more configuration for start and end swipe actions (currently events only)
class MDWListItemElement extends HTMLComponentElement {
  static tag = 'mdw-list-item';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = styles;

  #drag;
  #value;
  #ripple;
  #states;
  #selected;
  #selectionControl;
  #container;
  #lastDirection;
  #actionActiveThreshold = 64;
  #onChange_bound = this.#onChange.bind(this);
  #onDrag_bound = this.#onDrag.bind(this);
  #onDragStart_bound = this.#onDragStart.bind(this);
  #onDragEnd_bound = this.#onDragEnd.bind(this);

  constructor() {
    super();

    this.role = 'listitem';
    this.render();
    this.#selectionControl = this.querySelector('mdw-checkbox') || this.querySelector('mdw-switch');
    if (this.#selectionControl && !this.#selectionControl.ariaLabel) this.#selectionControl.ariaLabel = 'select';
  }

  template() {
    return /*html*/`
      <slot name="swipe-start"></slot>
      <div class="container">
        <slot name="start"></slot>
        <div class="text">
          <slot name="overline"></slot>
          <slot class="default-slot"></slot>
          <slot name="headline"></slot>
          <slot name="supporting-text"></slot>
        </div>
        <slot name="trailing-supporting-text"></slot>
        <slot name="end"></slot>
        <div class="state-layer"></div>
      </div>
      <slot name="swipe-end"></slot>
    `;
  }


  static get observedAttributesExtended() {
    return [
      ['value', 'string'],
      ['selected', 'boolean'],
      ['states', 'boolean'],
      ['ripple', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  connectedCallback() {
    if (this.querySelector('[slot="swipe-start"]') || this.querySelector('[slot="swipe-start"]')) {
      this.#container = this.shadowRoot.querySelector('.container');
      this.#drag = new Drag(this);
      this.#drag.lockScrollY = true;
      this.#drag.disableMouseEvents = true;
      this.#drag.on('mdwdragmove', this.#onDrag_bound);
      this.#drag.on('mdwdragstart', this.#onDragStart_bound);
      this.#drag.on('mdwdragend', this.#onDragEnd_bound);
      this.#drag.enable();
    }
  }

  disconnectedCallback() {
    if (this.#ripple) this.#ripple.destroy();
    if (this.#drag) this.#drag.destroy();
    this.removeEventListener('change', this.#onChange_bound);
  }


  get value() { return this.#value; }
  set value(value) {
    this.#value = value;
  }

  get selected() { return !this.#selectionControl ? false : this.#selectionControl.checked; }
  set selected(value) {
    this.#selected = !this.#selectionControl ? false : !!value;
    if (this.#selectionControl) this.#selectionControl.checked = this.#selected;
  }

  get states() { return this.#states; }
  set states(value) {
    this.#states = !!value;
    const stateLayer = this.shadowRoot.querySelector('.state-layer');
    stateLayer.classList.toggle('enabled', this.#states);
    if (this.#states) {
      if (this.querySelector('mdw-checkbox')) this.addEventListener('change', this.#onChange_bound);
    } else if (!this.#states) {
      if (this.querySelector('mdw-checkbox')) this.removeEventListener('change', this.#onChange_bound);
    }
  }

  get ripple() { return this.#ripple; }
  set ripple(value) {
    const stateLayer = this.shadowRoot.querySelector('.state-layer');
    if (value && !this.#ripple) {
      this.#ripple = new Ripple({
        element: stateLayer,
        triggerElement: this
      });
    } else if (!value && this.#ripple) {
      this.#ripple.destroy();
      this.#ripple = undefined;
    }
  }


  async remove() {
    this.style.height = `${this.offsetHeight}px`;
    this.classList.add('remove');
    await util.nextAnimationFrameAsync();
    this.style.height = '';
    await util.transitionendAsync(this);
    super.remove();
  }

  #onChange(event) {
    this.classList.toggle('selected', event.target.checked);
  }


  #onDragStart() {
    this.classList.add('dragging');
  }

  #onDrag({ distanceX, directionX }) {
    this.#container.style.transform = `translateX(${distanceX}px)`;
    if (this.#lastDirection !== directionX) {
      this.#lastDirection = directionX;
      this.shadowRoot.querySelector('slot[name="swipe-start"]').classList.toggle('hide', directionX === -1);
      this.shadowRoot.querySelector('slot[name="swipe-end"]').classList.toggle('hide', directionX === 1);
    }
    if (Math.abs(distanceX) > this.#actionActiveThreshold) {
      this.shadowRoot.querySelector(directionX === 1 ? 'slot[name="swipe-start"]' : 'slot[name="swipe-end"]').classList.add('activate');
    }
  }

  async #onDragEnd({ distanceX, directionX }) {
    this.classList.remove('dragging');
    this.shadowRoot.querySelector('slot[name="swipe-start"]').classList.remove('activate');
    this.shadowRoot.querySelector('slot[name="swipe-end"]').classList.remove('activate');
    this.#container.style.transform = '';
    
    if (Math.abs(distanceX) > this.#actionActiveThreshold) {
      if (directionX === 1) {
        this.dispatchEvent(new Event('swipeactionstart', { bubbles: true }));
      } else {
        this.dispatchEvent(new Event('swipeactionend', { bubbles: true }));
      }
    }
  }
}
customElements.define(MDWListItemElement.tag, MDWListItemElement);
