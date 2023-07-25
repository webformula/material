import util from '../../core/util.js';

let globalTooltipElement;
let currentTooltipElement;
let currentElement;
let lastMousePosition;
let tooltipTimer;
const mousemoveThrottled = util.rafThrottle(mousemove);

function mouseover(event) {
  if (event.target.hasAttribute('tooltip')) {
    lastMousePosition = event.clientX;
    currentElement = event.target;

    const text = currentElement.getAttribute('tooltip');
    if (text !== '__internal') {
      currentElement.addEventListener('mouseout', mouseout);
      currentElement.addEventListener('mousemove', mousemoveThrottled);
    } else {
      document.body.addEventListener('click', onClickOutside);
      window.addEventListener('keydown', onEsc);
    }
    startTooltipTimer();
  }
}

function mousemove(event) {
  lastMousePosition = event.clientX;
}

function mouseout() {
  removeTooltip();
}

function onClickOutside() {
  removeTooltip();
}

function onEsc(event) {
  if (event.code === 'Escape') removeTooltip();
}

function startTooltipTimer() {
  if (tooltipTimer) return;
  tooltipTimer = setTimeout(() => {
    const text = currentElement.getAttribute('tooltip');
    if (text === '__internal') {
      currentTooltipElement = currentElement.querySelector('mdw-tooltip');
      currentTooltipElement.show(currentElement, lastMousePosition);
    } else {
      currentTooltipElement = globalTooltipElement;
      currentTooltipElement.innerHTML = text;
      currentTooltipElement.setAttribute('aria-label', text);
    }
    currentTooltipElement.show(currentElement, lastMousePosition);
  }, 1000);
}

function removeTooltip() {
  if (!tooltipTimer) return;
  currentTooltipElement.hide();
  clearTimeout(tooltipTimer);
  tooltipTimer = undefined;
  currentElement.removeEventListener('mouseout', mouseout);
  currentElement.removeEventListener('mousemove', mousemoveThrottled);
  document.body.removeEventListener('click', onClickOutside);
  window.removeEventListener('keydown', onEsc);
  currentElement = undefined;
}

if (document.readyState !== 'loading') initialize();
else document.addEventListener('DOMContentLoaded', initialize);
function initialize() {
  globalTooltipElement = document.createElement('mdw-tooltip');
  globalTooltipElement.classList.add('mdw-main-tooltip');
  globalTooltipElement.setAttribute('aria-label', 'blank');
  document.body.insertAdjacentElement('beforeend', globalTooltipElement);
  currentTooltipElement = globalTooltipElement;

  window.addEventListener('mouseover', mouseover, false);
}
