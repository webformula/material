import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './subheader.css' assert { type: 'css' };


const overflowScrollRegex = /(auto|scroll)/

const observers = new WeakMap();

class WFCListSubheaderElement extends HTMLComponentElement {
  static tag = 'wfc-list-subheader';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = styles;

  #observer;

  constructor() {
    super();

    this.render();
  }

  template() {
    return /*html*/`
      <slot></slot>
    `;
  }

  connectedCallback() {
    this.#setupObserver();
    setTimeout(() => this.classList.add('animation'), 150);
  }

  disconnectedCallback() {
    if (this.#observer) this.#observer.unobserve(this);
  }


  #setupObserver() {
    if (!observers.get(this.parentElement)) {
      const scrollParent = this.#getScrollParent();

      setTimeout(() => {
        const newObserver = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            entry.target.classList.toggle('stuck', entry.isIntersecting);
          });
        }, { root: scrollParent, rootMargin: `0px 0px -${Math.max(scrollParent.offsetHeight - 56, 0)}px 0px` });
        observers.set(this.parentElement, newObserver);
      }, 100);
    }

    setTimeout(() => {
      this.#observer = observers.get(this.parentElement);
      this.#observer.observe(this);
    }, 101);
  }


  #getScrollParent() {
    let parentElement = this.parentElement;
    if (this.parentElement.nodeName !== 'WFC-list') parentElement = parentElement.parentElement;
    
    while (parentElement !== null) {
      if (parentElement === document.documentElement) return window;
      const style = getComputedStyle(parentElement);
      if (overflowScrollRegex.test(style.overflow + style.overflowY)) return parentElement;
      parentElement = parentElement.parentElement;
    }
  }
}
customElements.define(WFCListSubheaderElement.tag, WFCListSubheaderElement);
