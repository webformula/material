import util from '../core/util.js';

const templateElements = {};

export default class HTMLElementExtended extends HTMLElement {
  // if not using shadowRoot templates and rendering still work
  useShadowRoot = false;

  /** Use template element to clone from
   *   If your template uses dynamic variables you do not want to use this
   */
  useTemplate = true;
  
  #rendered = false;
  #templateString;
  #templateElement;
  // browser may or may not include the word "function" so we need to run an includes check
  #hasTemplate = !this.template.toString().includes('template(){return""}');
  #root = this;
  #classId = hashCodeForId(this.constructor.toString());


  constructor() {
    super();

    if (this.#hasTemplate) {
      /** Render as soon as possible while making sure all class variables exist
       *    The other 2 options would be to use setTimeout or call render in connectedCallback
       *    SetTimeout is slower
       *    connectedCallback would force the extending class to call super.connectedCallback()
       */
      util.nextTick(() => {
        this.#prepareRender();
        this.render();
      });
    }
  }

  get rendered() {
    return this.#rendered;
  }

  // connectedCallback exists in customElement->HTMLElement. Called by browser when added to DOM
  connectedCallback() {}
  // disconnectedCallback exists in customElement->HTMLElement. Called by browser when removed from DOM
  disconnectedCallback() { }


  // beforeRender not called on initial render
  beforeRender() { }
  afterRender() { }

  // Return an HTML template string
  // If template is set then initial rendering will happen automatically
  template(){return""}

  // If template is set then initial rendering will happen automatically
  render() {
    if (this.#rendered) this.beforeRender();
    if (!this.useTemplate) this.#templateElement.innerHTML = this.template();
    this.#root.replaceChildren(this.#templateElement.content.cloneNode(true));
    this.#rendered = true;
    this.afterRender();
  }

  #prepareRender() {
    this.#templateString = this.template();

    if (this.useTemplate) {
      if (!templateElements[this.#classId]) {
        templateElements[this.#classId] = document.createElement('template');
        templateElements[this.#classId].innerHTML = this.#templateString;
      }

      this.#templateElement = templateElements[this.#classId];
    } else {
      this.#templateElement = document.createElement('template');
    }

    if (this.useShadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.#root = this.shadowRoot;
    } else this.#root = this;
  }

  escape(str) {
    return str.replace(/[^\w. ]/gi, function (c) {
      return '&#' + c.charCodeAt(0) + ';';
    });
  };
}


function hashCodeForId(str) {
  return Array.from(str).reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0)
}
