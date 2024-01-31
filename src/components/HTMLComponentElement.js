import styles from '../styles.css' assert { type: 'css' };
document.adoptedStyleSheets = [...document.adoptedStyleSheets, styles];
import { generateBrowser } from '../core/theme.js';
generateBrowser();

const templateElements = {};
const dashCaseRegex = /-([a-z])/g;

export default class HTMLComponentElement extends HTMLElement {
  static tag = 'none';
  /** if not using shadowRoot templates and rendering still work */
  static useShadowRoot = false;
  static shadowRootDelegateFocus = false;

  /** Use template element to clone from
   *   If your template uses dynamic variables you do not want to use this */
  static useTemplate = true;
  static styleSheets;
  static get observedAttributesExtended() { return []; };
  static get observedAttributes() { return this.observedAttributesExtended.map(a => a[0]); }

  #root = this;
  #prepared = false;
  #attributeEvents = {};
  #attributesLookup;
  #templateElement;

  constructor() {
    super();
    this.#attributesLookup = Object.fromEntries(this.constructor.observedAttributesExtended);
  }

  // Return an HTML template string
  // If template is set then initial rendering will happen automatically
  // template(){ return"" }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    const type = this.#attributesLookup[name];
    name = name.replace(dashCaseRegex, (_, s) => s.toUpperCase());
    if (type === 'event') {
      if (this.#attributeEvents[name]) {
        this.removeEventListener(name.replace(/^on/, ''), this.#attributeEvents[name]);
        this.#attributeEvents[name] = undefined;
      }
      if (newValue) {
        this.#attributeEvents[name] = this.#attributeDescriptorTypeConverter(newValue, type);
        this.addEventListener(name.replace(/^on/, ''), this.#attributeEvents[name]);
      }
    } else {
      this.attributeChangedCallbackExtended(
        name,
        this.#attributeDescriptorTypeConverter(oldValue, type),
        this.#attributeDescriptorTypeConverter(newValue, type)
      );
    }
  }

  attributeChangedCallbackExtended() { }

  connectedCallback() {}
  disconnectedCallback() {}

  render() {
    if (typeof this.template !== 'function') throw Error('Cannot render without a template method');
    if (!this.#prepared) this.#prepareRender();

    if (!this.constructor.useTemplate) this.#templateElement.innerHTML = this.template(); // always re-render
    this.#root.replaceChildren(this.#templateElement.content.cloneNode(true));
  }

  #prepareRender() {
    this.#prepared = true;

    if (this.constructor.useTemplate) {
      if (!templateElements[this.constructor.tag]) {
        templateElements[this.constructor.tag] = document.createElement('template');
        templateElements[this.constructor.tag].innerHTML = this.template();
      }
      this.#templateElement = templateElements[this.constructor.tag];
    } else {
      this.#templateElement = document.createElement('template');
    }

    if (this.constructor.useShadowRoot) {
      this.attachShadow({ mode: 'open', delegatesFocus: this.constructor.shadowRootDelegateFocus });
      this.#root = this.shadowRoot;

      if ((Array.isArray(this.constructor.styleSheets) && this.constructor.styleSheets.length > 0) || this.constructor.styleSheets instanceof CSSStyleSheet) {
        this.#root.adoptedStyleSheets = [].concat(this.constructor.styleSheets);
      }
    }
  }


  #attributeDescriptorTypeConverter(value, type) {
    switch (type) {
      case 'boolean':
        return value !== null && `${value}` !== 'false';
      case 'int':
        const int = parseInt(value);
        return isNaN(int) ? '' : int;
      case 'number':
        const num = parseFloat(value);
        return isNaN(num) ? '' : num;
      case 'string':
        return value || '';
      case 'event':
        return !value ? null : () => new Function('page', value).call(this, window.$page);
        break;
      default:
        return value;
    }
  }
}
