import HTMLElementExtended from '../HTMLElementExtended.js';
import styleAsString from '!!raw-loader!./anchor.css';
import Ripple from '../../core/Ripple.js';
import './anchor-global.css';
import util from '../../core/util.js';
import arrowDropDownSVG from '../../svg-icons/expand_more_FILL0_wght400_GRAD0_opsz24.svg';



customElements.define('mdw-anchor', class MDWAnchorElement extends HTMLElementExtended {
  useShadowRoot = true;
  useTemplate = false;

  #ripple;
  #active = false;
  #onClick_bound = this.#onClick.bind(this);


  constructor() {
    super();
    this.#setupClasses();
    
    if (this.hasAttribute('group')) this.insertAdjacentHTML('beforeend', `<div class="mdw-group-arrow">${arrowDropDownSVG}</div>`);
  }

  #setupClasses() {
    const hasIcon = this.querySelector(':scope > mdw-icon');
    const rail = this.querySelector('[slot=rail]');
    const hasRailContent = rail !== null;
    const railHasIcon = hasRailContent ? this.querySelector('[slot=rail] mdw-icon') : false;
    const railHasText = hasRailContent && util.getTextFromNode(rail) !== '';

    if (hasIcon) this.classList.add('mdw-has-icon');
    if (hasRailContent) this.classList.add('mdw-has-rail');
    if (railHasIcon) this.classList.add('mdw-has-rail-icon');
    if (railHasText) this.classList.add('mdw-has-rail-text');
  }

  connectedCallback() {
    this.setAttribute('role', 'link');
  }

  afterRender() {
    this.#ripple = new Ripple({
      element: this.shadowRoot.querySelector('.ripple'),
      triggerElement: this
    });

    // allow pax core to handle location changes
    if (!window.paxCoreSPA) this.addEventListener('click', this.#onClick_bound);
  }

  disconnectedCallback() {
    if (this.#ripple) this.#ripple.destroy();
    if (!window.paxCoreSPA) this.removeEventListener('click', this.#onClick_bound);
  }

  template() {
    return /*html*/`
      <div class="background"></div>
      <slot class="main"></slot>
      <slot class="rail" name="rail"></slot>
      <div class="ripple"></div>
      <style>${styleAsString}</style>
    `;
  }

  get href() {
    return `${location.origin}${this.getAttribute('href')}`;
  }

  get active() {
    return this.#active;
  }
  set active(value) {
    this.#active = !!value;
    this.classList.toggle('mdw-active', this.#active);

    if (this.parentElement.nodeName === 'MDW-NAVIGATION-GROUP') {
      util.nextAnimationFrameAsync().then(() => {
        this.parentElement.updateActive();
      });
    }
  }

  #onClick() {
    location.href = this.href;
  }
});
