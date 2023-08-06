import util from './util.js';


const mdwDevice = new class MDWDevice {
  #compactBreakpoint = 600;
  #mediumBreakpoint = 840;
  #lastState;
  #windowWidth;
  #windowHeight;
  #setWindow_raf = util.rafThrottle(this.#setWindow.bind(this));

  constructor() {
    this.#setWindow();
    screen.orientation.addEventListener("change", this.#setWindow_raf);
    window.addEventListener('resize', this.#setWindow_raf);
  }

  get orientation() {
    if (screen.orientation.type.startsWith('portrait')) return 'portrait';
    return 'landscape';
  }

  // window.visualViewport.height and window.visualViewport.width show pixels converted based on density. This will give actual screen pixel count
  // get windowSizeActualPixels() {
  //   const pixelRatio = window.devicePixelRatio;
  //   return {
  //     width: window.visualViewport.width * pixelRatio,
  //     height: window.visualViewport.height * pixelRatio
  //   }
  // }

  get state() {
    if (this.windowWidth < this.#compactBreakpoint) return 'compact';
    if (this.windowWidth < this.#mediumBreakpoint) return 'medium';
    return 'expanded';
  }

  get windowWidth() {
    return this.#windowWidth;
  }

  get windowHeight() {
    return this.#windowHeight;
  }

  get hasTouchScreen() {
    if ('maxTouchPoints' in navigator) return navigator.maxTouchPoints > 0;
    return false;
  }

  get isMobile() {
    if (!this.hasTouchScreen) return false;

    if (this.orientation === 'portrait') return this.windowWidth < this.#compactBreakpoint;
    return this.windowHeight < this.#compactBreakpoint;
  }

  async #setWindow() {
    if (!document.body) await new Promise(resolve => document.addEventListener('DOMContentLoaded', () => resolve()));

    this.#windowWidth = window.visualViewport.width;
    this.#windowHeight = window.visualViewport.height;
    const isMobile = this.isMobile;
    const state = this.state;
    document.body.classList.remove('mdw-window-compact');
    document.body.classList.remove('mdw-window-medium');
    document.body.classList.remove('mdw-window-expanded');

    document.body.classList.toggle('mdw-mobile', isMobile);
    switch(state) {
      case 'compact':
        document.body.classList.add('mdw-window-compact');
        break;
      case 'medium':
        document.body.classList.add('mdw-window-medium');
        break;
      case 'expanded':
        document.body.classList.add('mdw-window-expanded');
        break;
    }

    if (this.#lastState && (isMobile !== this.#lastState.isMobile || state !== this.#lastState.state)) {
      window.dispatchEvent(new CustomEvent('mdwwindowstate', { detail: {
        isMobile,
        state,
        lastIsMobile: this.#lastState.isMobile,
        lastState: this.#lastState.state
      }}));
    }

    this.#lastState = {
      isMobile: this.isMobile,
      state: this.state
    };
  }
}

window.mdwDevice = mdwDevice;
export default mdwDevice;
