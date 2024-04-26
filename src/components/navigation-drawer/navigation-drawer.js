import WFCSurfaceElement from '../surface/component.js';
import styles from './navigation-drawer.css' assert { type: 'css' };
import device from '../../core/device.js';
import {
  arrow_back_ios_FILL1_wght300_GRAD0_opsz24
} from '../../core/svgs.js';


class WFCNavigationDrawerElement extends WFCSurfaceElement {
  static tag = 'wfc-navigation-drawer';
  static styleSheets = styles;

  #locationchange_bound = this.#locationchange.bind(this);
  #windowStateChange_bound = this.#windowStateChange.bind(this);

  constructor() {
    super();
    this.role = 'navigation';
    this.fixed = true;
    this.alwaysVisible = true;
    this.allowClose = false;
    this.viewportBound = false;
    this.animation = 'translate-left';
    this.initialOpen = true;
    this.swipeClose = true;
    document.body.classList.add('has-navigation-drawer');
    document.body.classList.add('navigation-drawer-state-show');
    this.#locationchange();
    this.#windowStateChange({ detail: device });
  }

  template() {
    return /*html*/`
      <div class="scrim"></div>
      <div class="placeholder"></div>
      <div class="surface">
        <div class="surface-content">
          <div class="item-padding">
            <slot name="header"></slot>
            <slot class="default-slot"></slot>
          </div>
        </div>
        <wfc-icon class="predictive-back-icon hide">${arrow_back_ios_FILL1_wght300_GRAD0_opsz24}</wfc-icon>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('locationchange', this.#locationchange_bound);
    window.addEventListener('wfcwindowstate', this.#windowStateChange_bound);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('locationchange', this.#locationchange_bound);
    window.removeEventListener('wfcwindowstate', this.#windowStateChange_bound);
  }

  onShow() {
    document.body.classList.remove('navigation-drawer-state-hide');
    document.body.classList.add('navigation-drawer-state-show');
  }

  onHide() {
    document.body.classList.add('navigation-drawer-state-hide');
    document.body.classList.remove('navigation-drawer-state-show');
  }


  #locationchange() {
    const path = `${location.pathname}${location.hash}${location.search}`;
    const current = this.querySelector('.current');
    if (current) {
      current.classList.remove('current');
      if (current.parentElement.nodeName === 'WFC-ANCHOR-GROUP') {
        current.parentElement.open = false;
        current.parentElement.classList.remove('has-current');
      }
    }
    const match = this.querySelector(`[href="${path}"]`) || this.querySelector(`[href="${path.split('#')[0]}"]`);
    if (match) {
      match.classList.add('current');
      if (match.parentElement.nodeName === 'WFC-ANCHOR-GROUP') {
        match.parentElement.open = true;
        match.parentElement.classList.add('has-current');
      }
      
      if (device.animationReady) {
        match.classList.add('animate');
        requestAnimationFrame(() => {
          match.classList.remove('animate');
        });
      }
    }

    if (this.open && device.state !== 'expanded') this.close();
  }

  #windowStateChange({ detail }) {
    const isExpanded = detail.state === 'expanded';
    this.open = isExpanded;
    this.classList.toggle('modal', !isExpanded);
    this.scrim = !isExpanded;
    this.allowClose = !isExpanded;
    this.alwaysVisible = isExpanded;
    if (!detail.lastState) this.#initialScrollTo();
  }

  #initialScrollTo() {
    requestAnimationFrame(() => {
      const current = this.querySelector('.current');
      if (!current) return;

      const surface = this.shadowRoot.querySelector('.surface');
      const height = device.windowHeight;
      let top = current.offsetTop + 56;
      if (current.parentElement.nodeName === 'WFC-ANCHOR-GROUP') top += current.parentElement.offsetTop;
      if (top > height) {
        surface.querySelector('.surface-content').scrollTop = (height / 2) + (top - height);
      }
    });
  }
}
customElements.define(WFCNavigationDrawerElement.tag, WFCNavigationDrawerElement);
