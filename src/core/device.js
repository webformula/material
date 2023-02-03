// https://m3.material.io/foundations/adaptive-design/large-screens/overview
// https://material.io/blog/device-metrics
// https://henan-guanjie.gitee.io/ui-design/tools/devices/index.html

const mdwDevice = new class MDWDevice {
  #platform = (
    navigator?.userAgentData?.platform
    || navigator?.platform
    || navigator.userAgent
    || ''
  ).toLowerCase();
  #iosRegex = /ipad|iphone|ipod/;
  #androidRegex = /android/;
  #smallViewportMinWidth = 600;
  #smallViewportMaxWidth = 1239;
  // #fullscreenCutoff = 600;

  constructor() {
    window.addEventListener('resize', () => {
      this.#setViewport();
    });

    this.#setViewport(true);
  }

  get isMobile() {
    return this.isIOS || this.isAndroid;
  }

  get isIOS() {
    return this.#iosRegex.test(this.#platform);
  }

  get isAndroid() {
    return this.#androidRegex.test(this.#platform);
  }

  get isSmallViewport() {
    return window.innerWidth > this.#smallViewportMinWidth && window.innerWidth < this.#smallViewportMaxWidth;
  }

  get hasTouch() {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  }

  #setViewport(initial = false) {
    document.body.classList.remove('mdw-mobile');
    document.body.classList.remove('mdw-viewport-small');

    if (this.isMobile) {
      document.body.classList.add('mdw-mobile');
      if (!initial) window.dispatchEvent(new CustomEvent('mdw-viewport', { detail: { state: 'mobile' }}));
    } else if (this.isSmallViewport) {
      document.body.classList.add('mdw-viewport-small');
      if (!initial) window.dispatchEvent(new CustomEvent('mdw-viewport', { detail: { state: 'smallScreen' } }));
    } else {
      if (!initial) window.dispatchEvent(new CustomEvent('mdw-viewport', { detail: { state: 'none' } }));
    }
  }
}

window.mdwDevice = mdwDevice;
export default mdwDevice;
