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
  #hasTemplate = !this.template.toString().includes("template() {return /*html*/'';}");
  #root = this;


  constructor() {
    super();

    // fastest way to call render while making sure all class variables exist
    //   Other options would be setTimeout or calling from connectedCallback. Both are slower
    if (this.#hasTemplate) {
      util.nextTick(() => {
        // console.log(this.constructor.name)
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
  template() {return /*html*/'';}

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
      if (!templateElements[this.constructor.name]) {
        templateElements[this.constructor.name] = document.createElement('template');
        templateElements[this.constructor.name].innerHTML = this.#templateString;
      }

      this.#templateElement = templateElements[this.constructor.name];
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
