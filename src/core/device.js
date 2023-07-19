const mdwDevice = new class MDWDevice {
  #compactBreakpoint = 600;
  #mediumBreakpoint = 840;
  #lastState = {
    isMobile: this.isMobile,
    state: this.state
  };
  #setWindow_bound = this.#setWindow.bind(this);

  constructor() {
    this.#setWindow();
    screen.orientation.addEventListener("change", this.#setWindow_bound);
    window.addEventListener('resize', this.#setWindow_bound);
  }

  get orientation() {
    if (screen.orientation.type.startsWith('portrait')) return 'portrait';
    return 'landscape';
  }

  // window.innerHeight and window.innerWidth show pixels converted based on density. This will give actual screen pixel count
  get windowSizeActualPixels() {
    const pixelRatio = window.devicePixelRatio;
    return {
      width: window.innerWidth * pixelRatio,
      height: window.innerHeight * pixelRatio
    }
  }

  get state() {
    const windowWidth = window.innerWidth;
    if (windowWidth < this.#compactBreakpoint) return 'compact';
    if (windowWidth < this.#mediumBreakpoint) return 'medium';
    return 'expanded';
  }

  get hasTouchScreen() {
    if ('maxTouchPoints' in navigator) return navigator.maxTouchPoints > 0;
    return false;
  }

  get isMobile() {
    if (!this.hasTouchScreen) return false;
    // return this.breakpoint === 'compact';

    if (this.orientation === 'portrait') return window.innerWidth < this.#compactBreakpoint;
    return window.innerHeight < this.#compactBreakpoint;
  }

  async #setWindow() {
    if (!document.body) await new Promise(resolve => document.addEventListener('DOMContentLoaded', () => resolve()));
    
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

    if (isMobile !== this.#lastState.isMobile || state !== this.#lastState.state) {
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
