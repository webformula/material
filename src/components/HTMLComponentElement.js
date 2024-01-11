const templateElements = {};
const dashCaseRegex = /-([a-z])/g;

export default class HTMLComponentElement extends HTMLElement {
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
  #attributesLookup;
  #classId;
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
    this.attributeChangedCallbackExtended(
      name,
      this.#attributeDescriptorTypeConverter(oldValue, type),
      this.#attributeDescriptorTypeConverter(newValue, type)
    );
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
      this.#classId = btoa(this.constructor.toString().replace(/\s/g, ''));
      // this.#classId = Array.from(this.constructor.toString()).reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0);
      if (!templateElements[this.#classId]) {
        templateElements[this.#classId] = document.createElement('template');
        templateElements[this.#classId].innerHTML = this.template();
      }
      this.#templateElement = templateElements[this.#classId];
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


  #attributeDescriptorTypeConverter(value, type = 'string') {
    switch (type) {
      case 'boolean':
        return value !== null && `${value}` !== 'false';
      case 'number':
        const num = parseInt(value);
        return isNaN(num) ? '' : num;
      case 'string':
        return value || '';
      default:
        return value;
    }
  }
}
