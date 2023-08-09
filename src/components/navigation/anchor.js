import HTMLElementExtended from '../HTMLElementExtended.js';
import util from '../../core/util.js';
import Ripple from '../../core/Ripple.js';
import { expand_more_FILL0_wght400_GRAD0_opsz24 } from '../../core/svgs.js';

const rippleTemplate = document.createElement('template');
const rippleElement = document.createElement('div');
rippleElement.classList.add('ripple');
rippleTemplate.content.append(rippleElement);

const arrowTemplate = document.createElement('template');
const arrowElement = document.createElement('div');
arrowElement.classList.add('mdw-group-arrow');
arrowElement.innerHTML = expand_more_FILL0_wght400_GRAD0_opsz24;
arrowTemplate.content.append(arrowElement);

customElements.define('mdw-anchor', class MDWAnchorElement extends HTMLElementExtended {
  #ripple;
  #target = this.getAttribute('target');
  #onClick_bound = this.#onClick.bind(this);
  #focus_bound = this.#focus.bind(this);
  #blur_bound = this.#blur.bind(this);
  #focusKeydown_bound = this.#focusKeydown.bind(this);
  #mousedown_bound = this.#mousedown.bind(this);
  #mouseup_bound = this.#mouseup.bind(this);

  constructor() {
    super();
  }

  connectedCallback() {
    const text = util.getTextFromNode(this);
    if (text) this.classList.add('mdw-has-text');
    if (!this.hasAttribute('aria-label')) {
      this.setAttribute('aria-label', text);
    }

    if (this.hasAttribute('group')) this.appendChild(arrowTemplate.content.cloneNode(true));
    
    this.tabIndex = 0;
    this.setAttribute('role', 'link');
    this.appendChild(rippleTemplate.content.cloneNode(true));
    this.#ripple = new Ripple({
      element: this.querySelector('.ripple'),
      triggerElement: this
    });
    this.addEventListener('click', this.#onClick_bound);
    this.addEventListener('focusin', this.#focus_bound);
    this.addEventListener('mousedown', this.#mousedown_bound);
  }

  disconnectedCallback() {
    if (this.#ripple) this.#ripple.destroy();
    this.removeEventListener('click', this.#onClick_bound);
    this.removeEventListener('focusin', this.#focus_bound);
    this.removeEventListener('mousedown', this.#mousedown_bound);
  }

  get href() {
    return `${location.origin}${this.getAttribute('href')}`;
  }

  get active() {
    return this.classList.contains('mdw-active');
  }
  set active(value) {
    this.classList.toggle('mdw-active', !!value);
  }

  #onClick() {
    if (['_blank', '_self', '_parent', '_top'].includes(this.#target)) {
      window.open(this.href, this.#target).focus();
    } else if (!window.webformulaCoreLinkIntercepts) {
      location.href = this.href;
    }
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

  // prevent focus adjustments when using mouse
  #mousedown() {
    this.removeEventListener('focusin', this.#focus_bound);
    this.addEventListener('mouseup', this.#mouseup_bound);
  }
  #mouseup() {
    this.addEventListener('focusin', this.#focus_bound);
    this.removeEventListener('mouseup', this.#mouseup_bound);
  }

  #focusKeydown(e) {
    // TODO should we skip to first sub navigation in nav or on page
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
