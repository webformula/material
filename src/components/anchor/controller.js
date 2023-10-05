import util from '../../core/util.js';
import { expand_more_FILL0_wght400_GRAD0_opsz24 } from '../../core/svgs.js';

const arrowTemplate = document.createElement('template');
const arrowElement = document.createElement('div');
arrowElement.classList.add('mdw-group-arrow');
arrowElement.innerHTML = expand_more_FILL0_wght400_GRAD0_opsz24;
arrowTemplate.content.append(arrowElement);

export default class AnchorController {
  #element;
  #focus_bound = this.#focus.bind(this);
  #blur_bound = this.#blur.bind(this);
  #focusKeydown_bound = this.#focusKeydown.bind(this);
  #mousedown_bound = this.#mousedown.bind(this);
  #mouseup_bound = this.#mouseup.bind(this);

  constructor(element) {
    this.#element = element;

    const text = util.getTextFromNode(this.#element);
    if (text) this.#element.classList.add('mdw-has-text');
    if (this.#element.querySelector('mdw-icon')) this.#element.classList.add('mdw-has-icon');
    if (!this.#element.hasAttribute('aria-label')) {
      this.#element.setAttribute('aria-label', text);
    }

    if (this.#element.hasAttribute('group')) this.#element.appendChild(arrowTemplate.content.cloneNode(true));

    this.#element.tabIndex = 0;
    this.#element.setAttribute('role', 'link');
    this.#element.addEventListener('focusin', this.#focus_bound);
    this.#element.addEventListener('mousedown', this.#mousedown_bound);
  }

  #focus(e) {
    // on first anchor focus redirect to active anchor
    if (e.relatedTarget?.nodeName !== 'A') {
      const selected = document.body.querySelector('mdw-navigation-drawer .mdw-active:not([group])');
      if (selected && this.#element !== selected) return selected.focus();
    }

    this.#element.addEventListener('blur', this.#blur_bound);
    this.#element.addEventListener('keydown', this.#focusKeydown_bound);
  }

  #blur() {
    this.#element.removeEventListener('blur', this.#blur_bound);
    this.#element.removeEventListener('keydown', this.#focusKeydown_bound);
  }

  // prevent focus adjustments when using mouse
  #mousedown() {
    this.#element.removeEventListener('focusin', this.#focus_bound);
    this.#element.addEventListener('mouseup', this.#mouseup_bound);
  }
  #mouseup() {
    this.#element.addEventListener('focusin', this.#focus_bound);
    this.#element.removeEventListener('mouseup', this.#mouseup_bound);
  }

  #focusKeydown(e) {
    // TODO should we skip to first sub navigation in nav or jump to first element on page
    if (e.code === 'Tab') {
      const pageContent = document.querySelector('#page-content') || document.querySelector('page-content');
      const firstFocusablePageContent = [...pageContent.querySelectorAll('*')].find(e => e.tabindex > -1 || parseInt(e.getAttribute('tabindex') || -1) > -1);
      if (firstFocusablePageContent) firstFocusablePageContent.focus();
      e.preventDefault();
    } if (e.code === 'Enter' || e.code === 'Space') {
      this.#element.click();
      this.#element.blur();
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
    if (!focusedElement || focusedElement.nodeName !== 'A') return;
    let nextFocus = focusedElement.nextElementSibling;

    // step out of navigation group
    if (!nextFocus && focusedElement.parentElement.nodeName === 'MDW-NAVIGATION-DRAWER-GROUP') nextFocus = focusedElement.parentElement.nextElementSibling;

    while (nextFocus) {
      if (nextFocus.nodeName === 'A' || nextFocus.nodeName === 'MDW-NAVIGATION-DRAWER-GROUP') break;
      nextFocus = nextFocus.nextElementSibling;
    }
    if (!nextFocus) return;

    // step into navigation group
    if (nextFocus.nodeName === 'MDW-NAVIGATION-DRAWER-GROUP') {
      nextFocus.open = true;
      nextFocus = nextFocus.querySelector('a:not([group])');
    }

    if (nextFocus) nextFocus.focus();
  }

  #focusPrevious(focusedElement) {
    if (!focusedElement || focusedElement.nodeName !== 'A') return;
    let nextFocus = focusedElement.previousElementSibling;

    // step out of navigation group
    if (!nextFocus && focusedElement.parentElement.nodeName === 'MDW-NAVIGATION-DRAWER-GROUP') nextFocus = focusedElement.parentElement.previousElementSibling;

    while (nextFocus) {
      if (nextFocus.nodeName === 'A' || nextFocus.nodeName === 'MDW-NAVIGATION-DRAWER-GROUP') break;
      nextFocus = nextFocus.previousElementSibling;
    }
    if (!nextFocus) return;

    // step into navigation group
    if (nextFocus.nodeName === 'MDW-NAVIGATION-DRAWER-GROUP') {
      nextFocus.open = true;
      nextFocus = nextFocus.querySelector('a:not([group]):last-of-type');
    }

    if (nextFocus) nextFocus.focus();
  }
}
