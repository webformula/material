const MDWPanel = class MDWPanel {
  #panel = null;

  #template;
  #target = null;
  #animation = 'translateY';
  #scrim = false;
  #clickOutsideClose = true;
  #clickOutsideCloseIgnoreElements = [];
  #created = false;


  constructor(params = {
    template: '',
    target: null,
    scrim: false,
    clickOutsideClose: true,
    clickOutsideCloseIgnoreElements: [],
    animation: 'translateY'
  }) {
    if (params.template)  this.#template = params.template;
    if (params.target) this.#target = params.target;
    if (params.scrim === true) this.#scrim = true;
    if (params.clickOutsideClose === false) this.#clickOutsideClose = false;
    if (Array.isArray(params.clickOutsideCloseIgnoreElements.length)) {
      this.#clickOutsideCloseIgnoreElements = params.clickOutsideCloseIgnoreElements;
    }
    if (params.animation) this.#animation = params.animation;

    // create panel immediately so events can be attached
    this.#panel = document.createElement('mdw-panel');
  }

  get element() {
    return this.#panel;
  }

  get open() {
    return this.#panel && this.#panel.open;
  }

  get template() {
    return this.#template;
  }
  set template(value) {
    this.#template = value;
    if (this.#created) this.#updatePanelTemplate();
  }

  get target() {
    return this.#target;
  }
  set target(value) {
    if (value && value.nodeName) this.#target = value;
    else this.#target = document.querySelector(value);
    if (this.#created) this.#panel.target = this.#target;
  }

  get animation() {
    return this.#animation;
  }
  set animation(value) {
    this.#animation = value;
    if (this.#created) this.#panel.animation = value;
  }


  get scrim() {
    return this.#scrim;
  }
  set scrim(value) {
    this.#scrim = value;
    if (this.#created) this.#panel.scrim = value;
  }

  get clickOutsideClose() {
    return this.#clickOutsideClose;
  }
  set clickOutsideClose(value) {
    this.#clickOutsideClose = value;
    if (this.#created) this.#panel.clickOutsideClose = value;
  }

  addClickOutsideCloseIgnore(element) {
    this.#clickOutsideCloseIgnoreElements.push(element);
    if (this.#created) this.#panel.addClickOutsideCloseIgnore(element);
  }


  show() {
    if (!this.#template) throw Error('template required');
    if (!this.#created) this.#createPanel();
    this.#panel.show();
  }

  close() {
    this.#panel.close();
  }

  remove() {
    this.#panel.remove();
  }

  #createPanel() {
    this.#panel.target = this.#target;
    this.#panel.animation = this.#animation;
    this.#panel.scrim = this.#scrim;
    this.#panel.clickOutsideClose = this.#clickOutsideClose;
    this.#panel.innerHTML = this.#template;
    this.#clickOutsideCloseIgnoreElements.forEach(element => this.#panel.addClickOutsideCloseIgnore(element));
    document.body.insertAdjacentElement('beforeend', this.#panel);
    this.#created = true;
  }

  #updatePanelTemplate() {
    this.#panel.innerHTML = this.#template;
  }
}

window.MDWPanel = MDWPanel;
export default MDWPanel;
