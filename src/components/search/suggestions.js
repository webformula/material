import MDWPanelElement from '../panel/component.js';


customElements.define('mdw-suggestions', class MDWSuggestionsElement extends MDWPanelElement {
  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
    // this.setAttribute('role', 'menu');

    this.clickOutsideClose = true;
    this.target = this.parentElement;
    this.animation = 'opacity';
    this.addClickOutsideCloseIgnore(this.parentElement);

    setTimeout(() => {
      this.style.minWidth = `${this.parentElement.offsetWidth}px`;
    })
  }
});
