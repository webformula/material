import util from '../../core/util.js';

let globalTooltipElement;
let currentTooltipElement;
let currentElement;
let lastMouseX;
let tooltipTimer;
const mousemoveThrottled = util.rafThrottle(mousemove);

function mouseover(event) {
  if (event.target.hasAttribute('tooltip')) {
    lastMouseX = event.clientX;
    currentElement = event.target;
    currentElement.addEventListener('mouseout', mouseout);
    currentElement.addEventListener('mousemove', mousemoveThrottled);
    document.body.removeEventListener('click', onClickOutside);
    window.removeEventListener('keydown', onEsc);
    startTooltipTimer();
  }
}

function mousemove(event) {
  lastMouseX = event.clientX;
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
    currentTooltipElement = globalTooltipElement;
    currentTooltipElement.innerHTML = text;
    // currentTooltipElement.setAttribute('aria-label', text);
    currentTooltipElement.mouseX = lastMouseX;
    currentTooltipElement.mouseY = currentElement.getBoundingClientRect().bottom - document.documentElement.scrollTop;
    currentTooltipElement.show();
  }, 1000);
}

function removeTooltip() {
  if (!tooltipTimer) return;
  currentTooltipElement.close();
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
  document.body.insertAdjacentHTML('beforeend', /*html*/`
    <mdw-tooltip class="global-tooltip"></mdw-tooltip>
  `);
  globalTooltipElement = document.querySelector('mdw-tooltip.global-tooltip');
  currentTooltipElement = globalTooltipElement;
  window.addEventListener('mouseover', mouseover, false);
}
