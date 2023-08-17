import HTMLElementExtended from '../HTMLElementExtended.js';
import util from '../../core/util.js';
import Ripple from '../../core/Ripple.js';


export default class MDWBottomAppBarElement extends HTMLElementExtended {
  #rippleElements;
  #autoHide;
  #scrollTrack_bound = this.#scrollTrack.bind(this);
  #hashchange_bound = this.#hashchange.bind(this);

  constructor() {
    super();

    document.body.classList.add('mdw-has-bottom-app-bar');
    document.body.style.setProperty('--mdw-bottom-app-bar-position', '0px');
    if (this.classList.contains('mdw-always-show')) document.body.classList.add('mdw-bottom-app-bar-always-show');
  }

  async connectedCallback() {
    this.#rippleElements = [...this.querySelectorAll('nav > a > .mdw-ripple')].map(element => new Ripple({
      element: element,
      triggerElement: element.parentNode
    }));

    this.#autoHide = this.classList.contains('mdw-auto-hide');

    if (this.querySelector('mdw-bottom-app-bar-secondary[mdw-hash]')) {
      [...this.querySelectorAll('mdw-bottom-app-bar-secondary')].forEach(element => {
        const id = element.getAttribute('id');
        element.setAttribute('id', id || `bottom-app-bar-secondary-${util.uid()}`);
      })
      window.addEventListener('hashchange', this.#hashchange_bound);
      this.#hashchange();
    }

    // prevent layout calculation during script evaluation
    if (this.#autoHide) requestAnimationFrame(() => {
      util.trackPageScroll(this.#scrollTrack_bound);
    });
  }

  disconnectedCallback() {
    this.#rippleElements.forEach(r => r.destroy());
    if (this.#autoHide)  util.untrackPageScroll(this.#scrollTrack_bound);
  }

  async #show() {
    this.classList.add('mdw-show-animation-start');
    this.classList.remove('mdw-hide');
    await util.nextAnimationFrameAsync();
    this.classList.remove('mdw-show-animation-start');
  }

  async showPrimary() {
    const primary = this.querySelector('mdw-bottom-app-bar-primary');
    if (!primary) throw Error('Must contain primary element "mdw-bottom-app-bar-primary" to use secondary');
    if (!primary.classList.contains('mdw-hide')) return;

    const currentSecondary = this.querySelector('mdw-bottom-app-bar-secondary.mdw-show');
    if (currentSecondary) currentSecondary.classList.remove('mdw-show');

    primary.classList.remove('mdw-hide');
    primary.classList.add('mdw-show-animation-start');
    await util.nextAnimationFrameAsync();
    primary.classList.add('mdw-show');
    primary.classList.remove('mdw-show-animation-start');
  }

  async showSecondary(id) {
    if (!id) return this.showPrimary();

    const primary = this.querySelector('mdw-bottom-app-bar-primary');
    if (!primary) throw Error('Must contain primary element "mdw-bottom-app-bar-primary" to use secondary');

    const secondary = this.querySelector(`mdw-bottom-app-bar-secondary#${id}`);
    if (!secondary) throw Error('Could not find secondary: "mdw-bottom-app-bar-secondary#${id}"');
    if (secondary.classList.contains('mdw-show')) return;

    const currentSecondary = this.querySelector('mdw-bottom-app-bar-secondary.mdw-show');
    if (currentSecondary) currentSecondary.classList.remove('mdw-show');

    primary.classList.add('mdw-hide');
    primary.classList.remove('mdw-show');
    secondary.classList.add('mdw-show-animation-start');
    await util.nextAnimationFrameAsync();
    secondary.classList.add('mdw-show');
    secondary.classList.remove('mdw-show-animation-start');
  }

  #scrollTrack({ direction, distanceFromDirectionChange, scrollTop }) {
    if (scrollTop <= 0 || (document.documentElement.scrollHeight - document.documentElement.offsetHeight) < 160) {
      document.body.style.setProperty('--mdw-bottom-app-bar-position', '0px');
      return;
    }
    
    const position = parseInt(document.body.style.getPropertyValue('--mdw-bottom-app-bar-position').replace('px', '') || 0);
    let offset;
    if (direction === -1 && position > -80) {
      offset = Math.min(distanceFromDirectionChange, 80);
      document.body.style.setProperty('--mdw-bottom-app-bar-position', `-${offset}px`);
    } else if (direction === 1 && position < 0) {
      offset = Math.max(80 + distanceFromDirectionChange, 0);
      document.body.style.setProperty('--mdw-bottom-app-bar-position', `-${offset}px`);
    }

    // animate icons in
    if (direction === 1 && -position >= this.offsetHeight - 20 && offset < this.offsetHeight - 20) this.#show();
  }

  #hashchange() {
    const secondaryByHash = this.querySelector(`mdw-bottom-app-bar-secondary[mdw-hash="${location.hash}"]`);
    if (secondaryByHash) this.showSecondary(secondaryByHash.getAttribute('id'));
    else this.showPrimary();
  }
}

customElements.define('mdw-bottom-app-bar', MDWBottomAppBarElement);
