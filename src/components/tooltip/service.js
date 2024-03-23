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
    window.addEventListener('mouseover', globalMouseOver);
    window.addEventListener('mousemove', mousemoveThrottled);
    window.removeEventListener('keydown', onEsc);
    startTooltipTimer();
  }

  if (event.target.hasAttribute('tooltip-selector')) {
    const tooltip = document.querySelector(event.target.getAttribute('tooltip-selector'));
    if (!tooltip) return;

    lastMouseX = event.clientX;
    currentElement = event.target;
    window.addEventListener('mouseover', globalMouseOver);
    window.addEventListener('mousemove', mousemoveThrottled);
    window.addEventListener('mousemove', mousemoveThrottled);
    window.removeEventListener('keydown', onEsc);
    startTooltipTimer(tooltip);
  }
}

function globalMouseOver(event) {
  if (currentTooltipElement.contains(event.target)) return;
  if (currentElement.contains(event.target)) return;
  removeTooltip();
}

function mousemove(event) {
  lastMouseX = event.clientX;
}

function actionClick(event) {
  console.log(event.target);
  if (['WFC-BUTTON', 'BUTTON', 'A'].includes(event.target.nodeName)) {
    setTimeout(() => {
      removeTooltip();
    }, 150)
  }
}

function onEsc(event) {
  if (event.code === 'Escape') removeTooltip();
}

function startTooltipTimer(customTooltipElement) {
  if (tooltipTimer) return;
  tooltipTimer = setTimeout(() => {
    if (customTooltipElement) {
      currentTooltipElement = customTooltipElement;
    } else {
      const text = currentElement.getAttribute('tooltip');
      currentTooltipElement = globalTooltipElement;
      currentTooltipElement.innerHTML = text;
      currentTooltipElement.ariaLabel = text;
    }
    
    currentTooltipElement.addEventListener('click', actionClick);
    currentTooltipElement.mouseX = lastMouseX + 6;
    let y = currentElement.getBoundingClientRect().bottom;
    currentTooltipElement.mouseY = y;
    currentTooltipElement.show();

    // make sure tooltip is not below bottom
    const bottomDiff = (y + currentTooltipElement.height) - (window.innerHeight - 12);
    if (bottomDiff > 0) y -= bottomDiff;
    currentTooltipElement.mouseY = y;
  }, 1000);
}

function removeTooltip() {
  if (!tooltipTimer) return;
  currentTooltipElement.close();
  clearTimeout(tooltipTimer);
  tooltipTimer = undefined;
  currentTooltipElement.ariaLabel = '';
  window.removeEventListener('mouseover', globalMouseOver);
  window.removeEventListener('mousemove', mousemoveThrottled);
  window.removeEventListener('keydown', onEsc);
  currentTooltipElement.removeEventListener('click', actionClick);
  currentElement = undefined;
}

if (document.readyState !== 'loading') initialize();
else document.addEventListener('DOMContentLoaded', initialize);
function initialize() {
  document.body.insertAdjacentHTML('beforeend', /*html*/`
    <wfc-tooltip class="global-tooltip"></wfc-tooltip>
  `);
  globalTooltipElement = document.querySelector('wfc-tooltip.global-tooltip');
  currentTooltipElement = globalTooltipElement;
  window.addEventListener('mouseover', mouseover, false);
}
