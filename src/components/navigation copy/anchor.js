import HTMLElementExtended from '../HTMLElementExtended.js';
import styles from './anchor.css' assert { type: 'css' };
import Ripple from '../../core/Ripple.js';
import util from '../../core/util.js';
import { expand_more_FILL0_wght400_GRAD0_opsz24 } from '../../core/svgs.js';



customElements.define('mdw-anchor', class MDWAnchorElement extends HTMLElementExtended {
  useShadowRoot = true;
  useTemplate = false;
  static styleSheets = styles;

  #ripple;
  #active = false;
  #target = this.getAttribute('target');
  #onClick_bound = this.#onClick.bind(this);
  #focus_bound = this.#focus.bind(this);
  #blur_bound = this.#blur.bind(this);
  #focusKeydown_bound = this.#focusKeydown.bind(this);
  #mousedown_bound = this.#mousedown.bind(this);
  #mouseup_bound = this.#mouseup.bind(this);


  constructor() {
    super();
    this.tabIndex = 0;
    this.#setupClasses();
    
    if (!this.hasAttribute('aria-label')) {
      const text = util.getTextFromNode(this);
      this.setAttribute('aria-label', text);
    }
    
    if (this.hasAttribute('group')) this.insertAdjacentHTML('beforeend', `<div class="mdw-group-arrow">${expand_more_FILL0_wght400_GRAD0_opsz24}</div>`);
  }

  #setupClasses() {
    const hasIcon = this.querySelector(':scope > mdw-icon');
    const rail = this.querySelector('[slot=rail]');
    const hasRailContent = rail !== null;
    const railHasIcon = hasRailContent ? this.querySelector('[slot=rail] mdw-icon') : false;
    const railHasText = hasRailContent && util.getTextFromNode(rail) !== '';

    if (hasIcon) this.classList.add('mdw-has-icon');
    if (hasRailContent) this.classList.add('mdw-has-rail');
    if (railHasIcon) this.classList.add('mdw-has-rail-icon');
    if (railHasText) this.classList.add('mdw-has-rail-text');
  }

  connectedCallback() {
    this.setAttribute('role', 'link');
    this.addEventListener('focusin', this.#focus_bound);
  }

  afterRender() {
    this.#ripple = new Ripple({
      element: this.shadowRoot.querySelector('.ripple'),
      triggerElement: this
    });
    this.addEventListener('click', this.#onClick_bound);
    this.addEventListener('mousedown', this.#mousedown_bound);
    setTimeout(() => {
      this.classList.add('mdw-animation');
    }, 50);
  }

  disconnectedCallback() {
    if (this.#ripple) this.#ripple.destroy();
    this.removeEventListener('click', this.#onClick_bound);
    this.removeEventListener('focusin', this.#focus_bound);
    this.removeEventListener('blur', this.#blur_bound);
    this.removeEventListener('keydown', this.#focusKeydown_bound);
    this.removeEventListener('mousedown', this.#mousedown_bound);
  }

  template() {
    return /*html*/`
      <div class="background"></div>
      <slot class="main"></slot>
      <slot class="rail" name="rail"></slot>
      <div class="ripple"></div>
    `;
  }

  get href() {
    return `${location.origin}${this.getAttribute('href')}`;
  }

  get active() {
    return this.#active;
  }
  set active(value) {
    this.#active = !!value;
    this.classList.toggle('mdw-active', this.#active);

    if (this.parentElement.nodeName === 'MDW-NAVIGATION-GROUP') {
      util.nextAnimationFrameAsync().then(() => {
        this.parentElement.updateActive();
      });
    }
  }

  #onClick() {
    if (['_blank', '_self', '_parent', '_top'].includes(this.#target)) {
      window.open(this.href, this.#target).focus();
    } else if (!window.webformulaCoreLinkIntercepts) {
      location.href = this.href;
    }
  }

  // prevent focus adjustments when using mouse
  #mousedown() {
    this.removeEventListener('focusin', this.#focus_bound);
    this.addEventListener('mouseup', this.#mouseup_bound);
  }
  #mouseup() {
    this.addEventListener('focusin', this.#focus_bound);
    this.removeEventListener('mouseup', this.#mouseup_bound);
  }

  #focus(e) {
    // on first anchor focus redirect to active anchor
    if (e.relatedTarget?.nodeName !== 'MDW-ANCHOR') {
      const selected = document.body.querySelector('mdw-navigation mdw-anchor.mdw-active:not([group])');
      if (selected && this !== selected) return selected.focus();
    }

    this.addEventListener('blur', this.#blur_bound);
    this.addEventListener('keydown', this.#focusKeydown_bound);
  }

  #blur() {
    this.removeEventListener('blur', this.#blur_bound);
    this.removeEventListener('keydown', this.#focusKeydown_bound);
  }

  #focusKeydown(e) {
    // TODO shoudl we skip to first sub navigation in nav or on page
    if (e.code === 'Tab') {
      const firstFocusablePageContent = [...document.body.querySelectorAll('page-content *')].find(e => e.tabindex > -1 || parseInt(e.getAttribute('tabindex') || -1) > -1);
      if (firstFocusablePageContent) firstFocusablePageContent.focus();
      e.preventDefault();
    } if (e.code === 'Enter' || e.code === 'Space') {
      this.click();
      this.#ripple.trigger();
      this.blur();
      e.preventDefault();
    } else if (e.code === 'ArrowDown') {
      this.#focusNext(e.target);
      e.preventDefault();
    } else if (e.code === 'ArrowUp') {
      this.#focusPrevious(e.target);
      e.preventDefault();
    }

    // TODO add left right arrow for sub menu
  }

  walk(root) {
    const children = [...root.children];
    while (children.length > 0) {
      const child = children.shift();
      if (child.tabIndex > -1 || parseInt(child.getAttribute('tabindex') || -1) > -1) return child;
      const walked = this.walk(child);
      if (walked) return walked;
    }
  }

  #focusNext(focusedElement) {
    if (!focusedElement || focusedElement.nodeName !== 'MDW-ANCHOR') return;
    let nextFocus = focusedElement.nextElementSibling;

    // step out of navigation group
    if (!nextFocus && focusedElement.parentElement.nodeName === 'MDW-NAVIGATION-GROUP') nextFocus = focusedElement.parentElement.nextElementSibling;
    
    while (nextFocus) {
      if (nextFocus.nodeName === 'MDW-ANCHOR' || nextFocus.nodeName === 'MDW-NAVIGATION-GROUP') break;
      nextFocus = nextFocus.nextElementSibling;
    }
    if (!nextFocus) return;

    // step into navigation group
    if (nextFocus.nodeName === 'MDW-NAVIGATION-GROUP') {
      nextFocus.open = true;
      nextFocus = nextFocus.querySelector('mdw-anchor:not([group])');
    }

    if (nextFocus) nextFocus.focus();
  }

  #focusPrevious(focusedElement) {
    if (!focusedElement || focusedElement.nodeName !== 'MDW-ANCHOR') return;
    let nextFocus = focusedElement.previousElementSibling;

    // step out of navigation group
    if (!nextFocus && focusedElement.parentElement.nodeName === 'MDW-NAVIGATION-GROUP') nextFocus = focusedElement.parentElement.previousElementSibling;

    while (nextFocus) {
      if (nextFocus.nodeName === 'MDW-ANCHOR' || nextFocus.nodeName === 'MDW-NAVIGATION-GROUP') break;
      nextFocus = nextFocus.previousElementSibling;
    }
    if (!nextFocus) return;

    // step into navigation group
    if (nextFocus.nodeName === 'MDW-NAVIGATION-GROUP') {
      nextFocus.open = true;
      nextFocus = nextFocus.querySelector('mdw-anchor:not([group]):last-of-type');
    }

    if (nextFocus) nextFocus.focus();
  }
});
