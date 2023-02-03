/** Tooltip observer
 *    Watch everything for the attribute "tooltip"
 *    and Hook up mdw-tooltip
 */

let tooltipElement;
let lastMousePosition;
let tooltipTimer;
let activeElements = [];

const observer = new MutationObserver((mutationList) => {
  if (mutationList.length === 1 && mutationList[0].target.nodeName === 'MDW-TOOLTIP') return;
  prepareTooltip();
});
document.addEventListener('DOMContentLoaded', initialize);



function initialize() {
  if (document.body.classList.contains('mdw-no-tooltip')) return;

  tooltipElement = document.createElement('mdw-tooltip');
  tooltipElement.classList.add('mdw-main-tooltip');
  tooltipElement.setAttribute('aria-label', 'blank');
  document.body.insertAdjacentElement('beforeend', tooltipElement);

  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributeFilter: ['tooltip']
  });
  prepareTooltip();
}

function prepareTooltip() {
  const tooltipElements = [...document.body.querySelectorAll('[tooltip]')];
  activeElements = activeElements.filter(e => {
    if (tooltipElements.includes(e)) return true;
    
    e.removeEventListener('mouseover', onMouseover);
    e.removeEventListener('mouseout', onMouseout);
    e.removeEventListener('mousemove', onMousemove);
    return false;
  })

  tooltipElements.forEach(e => {
    if (!activeElements.includes(e)) {
      e.addEventListener('mouseover', onMouseover);
      activeElements.push(e);
    }
  });
}

function onMouseover(event) {
  lastMousePosition = event.clientX;
  // this = the element with this event
  this.addEventListener('mouseout', onMouseout);
  startTooltipTimer(this);
}

function onMouseout(event) {
  // if a target has multiple sub elements we do not want to remove the tooltip
  // this = the element with this event
  // relatedTarget = this element the mouse was moved to
  const isLeavingTarget = event.relatedTarget !== this && !this.contains(event.relatedTarget);
  if (isLeavingTarget) removeTooltip(this);
}

function onMousemove(event) {
  lastMousePosition = event.clientX;
}

function startTooltipTimer(target) {
  if (tooltipTimer) return;
  tooltipTimer = setTimeout(() => {
    const text = target.getAttribute('tooltip');
    tooltipElement.innerHTML = text;
    tooltipElement.setAttribute('aria-label', text);
    tooltipElement.show(target, lastMousePosition);
  }, 1000);
  target.addEventListener('mousemove', onMousemove);
}


function removeTooltip(target) {
  if (!tooltipTimer) return;
  target.removeEventListener('mousemove', onMousemove);
  tooltipElement.hide();
  clearTimeout(tooltipTimer);
  tooltipTimer = undefined;
}
