const mdwDevice = new class MDWDevice {
  #compactBreakpoint = 600;
  #mediumBreakpoint = 840;
  #lastState = {
    isMobile: this.isMobile,
    breakpoint: this.breakpoint
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

  get breakpoint() {
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

  #setWindow() {
    const isMobile = this.isMobile;
    const breakpoint = this.breakpoint;
    document.body.classList.remove('mdw-window-compact');
    document.body.classList.remove('mdw-window-medium');
    document.body.classList.remove('mdw-window-expanded');

    document.body.classList.toggle('mdw-mobile', isMobile);
    switch(breakpoint) {
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

    if (isMobile !== this.#lastState.isMobile || breakpoint !== this.#lastState.breakpoint) {
      window.dispatchEvent(new CustomEvent('mdwwindowstate', { detail: { isMobile, breakpoint } }));
    }

    this.#lastState = {
      isMobile: this.isMobile,
      breakpoint: this.breakpoint
    };
  }
}

window.mdwDevice = mdwDevice;
export default mdwDevice;
