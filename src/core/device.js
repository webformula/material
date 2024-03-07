let skipInitialSetWindow = true;

const wfcDevice = new class WFCDevice {
  #compactBreakpoint = 600;
  #mediumBreakpoint = 840;
  #lastState;
  #windowWidth;
  #windowHeight;
  #animationReady = false;
  #locale = navigator.language;
  #languageChange_bound = this.#languageChange.bind(this);
  #resizeObserver = new ResizeObserver(() => {
    if (!skipInitialSetWindow) this.#setWindow();
    else skipInitialSetWindow = false;
  });

  constructor() {
    this.#setWindow();
    window.addEventListener('languagechange', this.#languageChange_bound);
    window.addEventListener('wfclanguagechange', this.#languageChange_bound);
    
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => {
        this.#init();
      });
    } else {
      requestAnimationFrame(() => {
        this.#init();
      });
    }
  }

  #init() {
    document.documentElement.classList.add('wfc-initiated');
    this.#resizeObserver.observe(document.documentElement);
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

  get animationReady() {
    return this.#animationReady;
  }

  get hourCycle() {
    return Intl.DateTimeFormat(this.#locale, { hour: 'numeric' }).resolvedOptions().hourCycle;
  }

  async #setWindow() {
    this.#windowWidth = window.visualViewport.width;
    this.#windowHeight = window.visualViewport.height;
    const state = this.state;
    document.body.classList.remove('window-compact');
    document.body.classList.remove('window-medium');
    document.body.classList.remove('window-expanded');

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
        document.querySelector('body').classList.add('wfc-animation');
        this.#animationReady = true;
      }, 150);
    }
    
    if (!this.#lastState || state !== this.#lastState.state) {
      window.dispatchEvent(new CustomEvent('wfcwindowstate', { detail: {
        state,
        lastState: this.#lastState?.state
      }}));
    }

    this.#lastState = {
      state: this.state
    };
  }

  #languageChange() {
    this.#locale = window.wfcLanguage || navigator.language;
  }
}

window.wfcDevice = wfcDevice;
export default wfcDevice;
