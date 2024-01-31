import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './subheader.css' assert { type: 'css' };


const overflowScrollRegex = /(auto|scroll)/

const observers = new WeakMap();

customElements.define('mdw-list-subheader', class MDWListSubheaderElement extends HTMLComponentElement {
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
    this.#observer.observe(this); 
  }

  disconnectedCallback() {
    this.#observer.unobserve(this);
  }


  #setupObserver() {
    if (!observers.get(this.parentElement)) {
      const scrollParent = this.#getScrollParent();
      observers.set(this.parentElement, new IntersectionObserver(entries => {
        entries.forEach(entry => {
          entry.target.classList.toggle('stuck', entry.isIntersecting);
        });
      }, { root: scrollParent, rootMargin: `0px 0px -${scrollParent.offsetHeight - 56}px 0px` }))
    }
    this.#observer = observers.get(this.parentElement);
  }


  #getScrollParent() {
    let parentElement = this.parentElement;
    if (this.parentElement.nodeName !== 'MDW-list') parentElement = parentElement.parentElement;
    
    while (parentElement !== null) {
      if (parentElement === document.documentElement) return window;
      const style = getComputedStyle(parentElement);
      if (overflowScrollRegex.test(style.overflow + style.overflowY)) return parentElement;
      parentElement = parentElement.parentElement;
    }
  }
});
