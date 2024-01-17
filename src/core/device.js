const mdwDevice = new class MDWDevice {
  #compactBreakpoint = 600;
  #mediumBreakpoint = 840;
  #lastState;
  #windowWidth;
  #windowHeight;
  #animationReady = false;
  #locale = navigator.language;
  #languageChange_bound = this.#languageChange.bind(this);

  constructor() {
    const resizeObserver = new ResizeObserver(() => {
      this.#setWindow();
    });
    resizeObserver.observe(document.documentElement);
    this.#setWindow();
    document.documentElement.classList.add('mdw-initiated');
    window.addEventListener('languagechange', this.#languageChange_bound);
    window.addEventListener('wfclanguagechange', this.#languageChange_bound);
  }

  get orientation() {
    // screen.orientation does not work on chrome ios. window.orientation is deprecated but works on chrom ios for now
    if (screen?.orientation ? screen.orientation.type.startsWith('portrait') : Math.abs(window.orientation) !== 90) return 'portrait';
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
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  get isMobile() {
    if (!this.hasTouchScreen) return false;

    if (this.orientation === 'portrait') return this.windowWidth < this.#compactBreakpoint;
    return this.windowHeight < this.#compactBreakpoint;
  }

  get animationReady() {
    return this.#animationReady;
  }

  get hourCycle() {
    return Intl.DateTimeFormat(this.#locale, { hour: 'numeric' }).resolvedOptions().hourCycle;
  }

  async #setWindow() {
    // if (!document.body) await new Promise(resolve => document.addEventListener('DOMContentLoaded', () => resolve()));
    // TODO figure this out without style recalculation
    this.#windowWidth = window.visualViewport.width;
    this.#windowHeight = window.visualViewport.height;
    const isMobile = this.isMobile;
    const state = this.state;
    document.body.classList.remove('window-compact');
    document.body.classList.remove('window-medium');
    document.body.classList.remove('window-expanded');

    document.body.classList.toggle('mdw-mobile', isMobile);
    switch(state) {
      case 'compact':
        document.body.classList.add('window-compact');
        break;
      case 'medium':
        document.body.classList.add('window-medium');
        break;
      case 'expanded':
        document.body.classList.add('window-expanded');
        break;
    }

    if (!this.#lastState) {
      setTimeout(() => {
        document.querySelector('body').classList.add('mdw-animation');
        this.#animationReady = true;
      }, 150);
    }
    
    if (!this.#lastState || isMobile !== this.#lastState.isMobile || state !== this.#lastState.state) {
      window.dispatchEvent(new CustomEvent('mdwwindowstate', { detail: {
        isMobile,
        state,
        lastIsMobile: this.#lastState?.isMobile,
        lastState: this.#lastState?.state
      }}));
    }

    this.#lastState = {
      isMobile: this.isMobile,
      state: this.state
    };
  }

  #languageChange() {
    this.#locale = window.wfcLanguage || navigator.language;
  }
}

window.mdwDevice = mdwDevice;
export default mdwDevice;
