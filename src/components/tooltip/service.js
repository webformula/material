import util from '../../core/util.js';

let tooltipElement;
let currentElement;
let lastMousePosition;
let tooltipTimer;
const mousemoveThrottled = util.rafThrottle(mousemove);

function mouseover(event) {
  if (event.target.hasAttribute('tooltip')) {
    lastMousePosition = event.clientX;
    currentElement = event.target;
    currentElement.addEventListener('mouseout', mouseout);
    currentElement.addEventListener('mousemove', mousemoveThrottled);
    startTooltipTimer();
  }
}

function mousemove(event) {
  lastMousePosition = event.clientX;
}

function mouseout() {
  removeTooltip();
}

function startTooltipTimer() {
  if (tooltipTimer) return;
  tooltipTimer = setTimeout(() => {
    const text = currentElement.getAttribute('tooltip');
    tooltipElement.innerHTML = text;
    tooltipElement.setAttribute('aria-label', text);
    tooltipElement.show(currentElement, lastMousePosition);
  }, 1000);
}

function removeTooltip() {
  if (!tooltipTimer) return;
  tooltipElement.hide();
  clearTimeout(tooltipTimer);
  tooltipTimer = undefined;
  currentElement.removeEventListener('mouseout', mouseout);
  currentElement.removeEventListener('mousemove', mousemoveThrottled);
  currentElement = undefined;
}

if (document.readyState !== 'loading') initialize();
else document.addEventListener('DOMContentLoaded', initialize);
function initialize() {
  tooltipElement = document.createElement('mdw-tooltip');
  tooltipElement.classList.add('mdw-main-tooltip');
  tooltipElement.setAttribute('aria-label', 'blank');
  document.body.insertAdjacentElement('beforeend', tooltipElement);

  window.addEventListener('mouseover', mouseover, false);
}
