import MDWPanelElement from '../panel/component.js';
import dateUtil from '../../core/dateUtil.js';
import util from '../../core/util.js';
import Drag from '../../core/Drag.js';
import './mobile.css';
import { checkMinMax, monthDaysTemplate } from './helper.js';
import {
  chevron_left_FILL1_wght400_GRAD0_opsz24,
  chevron_right_FILL1_wght400_GRAD0_opsz24,
  arrow_drop_down_FILL1_wght400_GRAD0_opsz24,
  edit_FILL1_wght400_GRAD0_opsz24
} from '../../core/svgs.js';


customElements.define('mdw-date-picker-mobile', class MDWDatePickerMobileElement extends MDWPanelElement {
  useTemplate = false;

  #showInputView_bound = this.#showInputView.bind(this);
  #onInput_bound = util.debounce(this.#onInput, 100).bind(this);
  #cancel_bound = this.#cancel.bind(this);
  #ok_bound = this.#ok.bind(this);
  #dayClick_bound = this.#dayClick.bind(this);
  #onShow_bound = this.#onShow.bind(this);
  #previousMonthClick_bound = this.#previousMonthClick.bind(this);
  #nextMonthClick_bound = this.#nextMonthClick.bind(this);
  #yearDropDownClick_bound = this.#yearDropDownClick.bind(this);
  #yearClickHandler_bound = this.#yearClickHandler.bind(this);
  #drag = new Drag(this);
  #onDrag_bound = this.#onDrag.bind(this);
  #onDragStart_bound = this.#onDragStart.bind(this);
  #onDragEnd_bound = this.#onDragEnd.bind(this);
  #onClose_bound = this.#onClose.bind(this);
  #abort = new AbortController();

  constructor() {
    super();

    this.backdrop = true;
    this.clickOutsideClose = false;

    this.addClickOutsideCloseIgnore(this.parentElement.control);
    this.#drag.onDrag(this.#onDrag_bound);
    this.#drag.onStart(this.#onDragStart_bound);
    this.#drag.onEnd(this.#onDragEnd_bound);
  }

  afterRender() {
    this.querySelector('.mdw-edit').addEventListener('click', this.#showInputView_bound, { signal: this.#abort.signal });
    this.querySelector('.mdw-cancel').addEventListener('click', this.#cancel_bound, { signal: this.#abort.signal });
    this.querySelector('.mdw-ok').addEventListener('click', this.#ok_bound, { signal: this.#abort.signal });
    this.querySelector('.mdw-months-container').addEventListener('click', this.#dayClick_bound, { signal: this.#abort.signal });
    this.querySelector('.mdw-month-previous').addEventListener('click', this.#previousMonthClick_bound, { signal: this.#abort.signal });
    this.querySelector('.mdw-month-next').addEventListener('click', this.#nextMonthClick_bound, { signal: this.#abort.signal });
    this.querySelector('.mdw-year-drop-down').addEventListener('click', this.#yearDropDownClick_bound, { signal: this.#abort.signal });
    this.querySelector('.mdw-years-container').addEventListener('click', this.#yearClickHandler_bound, { signal: this.#abort.signal });
    this.addEventListener('open', this.#onShow_bound, { signal: this.#abort.signal });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#drag.destroy();
    this.#drag = undefined;
    this.#abort.abort();
  }

  get #value() {
    return this.parentElement.value;
  }
  set #value(value) {
    this.parentElement.value = value;
  }

  get #displayDate() {
    return this.parentElement.displayDate;
  }
  set #displayDate(value) {
    this.parentElement.displayDate = value;
  }

  get #initialValue() {
    return this.parentElement.initialValue;
  }

  get #valueDate() {
    return this.parentElement.valueDate;
  }
  set #valueDate(value) {
    this.parentElement.valueDate = value;
  }

  get #minDate() {
    return this.parentElement.minDate;
  }

  get #maxDate() {
    return this.parentElement.maxDate;
  }


  template() {
    const {
      previousYearOutOfRange,
      nextYearOutOfRange,
      previousMonthOutOfRange,
      nextMonthOutOfRange
    } = checkMinMax(this.#minDate, this.#maxDate, this.#displayDate);

    return /*html*/`
      <div class="mdw-header">
        <div class="mdw-select-date-text">Select date</div>
        <div class="mdw-display-date-container">
          <div class="mdw-display-date-text">${dateUtil.format(this.#displayDate, 'ddd, MMM DD')}</div>
          <div class="mdw-edit mdw-icon-svg">${edit_FILL1_wght400_GRAD0_opsz24}</div>
        </div>
      </div>

      <div class="mdw-divider"></div>

      <div class="mdw-controls-container">
        <div class="mdw-year-drop-down" ${previousYearOutOfRange && nextYearOutOfRange ? 'disabled' : ''}>
          <div class="mdw-year-label">${dateUtil.format(this.#displayDate, 'MMMM YYYY')}</div>
          <div class="mdw-icon-svg">${arrow_drop_down_FILL1_wght400_GRAD0_opsz24}</div>
        </div>
        <div class="mdw-month-previous mdw-icon-svg" ${previousMonthOutOfRange ? 'disabled' : ''}>${chevron_left_FILL1_wght400_GRAD0_opsz24}</div>
        <div class="mdw-month-next mdw-icon-svg" ${nextMonthOutOfRange ? 'disabled' : ''}>${chevron_right_FILL1_wght400_GRAD0_opsz24}</div>
      </div>

      <div class="mdw-views-container">
        <div class="mdw-months-container">
          <div class="mdw-month mdw-previous">${this.#monthDaysTemplate(dateUtil.addToDateByParts(this.#displayDate, { month: -1 }))}</div>
          <div class="mdw-month mdw-active">${this.#monthDaysTemplate()}</div>
          <div class="mdw-month mdw-next">${this.#monthDaysTemplate(dateUtil.addToDateByParts(this.#displayDate, { month: 1 }))}</div>
        </div>

        <div class="mdw-years-container">
          ${this.#yearTemplate()}
        </div>
        
        <div class="mdw-input-container">
          <mdw-textfield>
            <input type="date">
            <label>Enter date</label>
          </mdw-textfield>
        </div>
      </div>

      <div class="mdw-actions-container">
        <mdw-button class="mdw-cancel">Cancel</mdw-button>
        <mdw-button class="mdw-ok">Ok</mdw-button>
      </div>
    `;
  }

  #monthDaysTemplate(date = this.#displayDate) {
    return /*html*/`
      <div class="mdw-days-header">
        ${dateUtil.getDayNames('narrow').map(n => `<span>${n}</span>`).join('\n')}
      </div>

      <div class="mdw-days-container">
        ${monthDaysTemplate(date, this.#value, this.#minDate, this.#maxDate, false, false)}
      </div>
    `;
  }

  #yearTemplate() {
    return dateUtil.defaultYearRange().map(year => {
      const isPreviousMinYear = this.#minDate && this.#minDate.getFullYear() > year;
      const isNextMaxYear = this.#maxDate && this.#maxDate.getFullYear() < year;
      const outOfRange = isPreviousMinYear || isNextMaxYear;
      return `<div class="mdw-year${outOfRange ? ' mdw-out-of-range' : ''}" mdw-year="${year}">${year}</div>`;
    }).join('\n');
  }


  #showInputView() {
    this.classList.remove('mdw-year-view');

    if (this.classList.contains('mdw-input-view')) {
      this.querySelector('input').removeEventListener('input', this.#onInput_bound);
      this.classList.remove('mdw-input-view');
    } else {
      this.classList.add('mdw-input-view');
      this.classList.remove('mdw-years-view');
      this.querySelector('input').addEventListener('click', e => e.preventDefault(), { signal: this.#abort.signal });
      this.querySelector('input').value = dateUtil.format(this.#displayDate, 'YYYY-MM-DD');
      this.querySelector('input').addEventListener('input', this.#onInput_bound, { signal: this.#abort.signal });
    }
  }

  #onInput(event) {
    this.#value = event.target.value;
    this.#updateDisplayDate(dateUtil.parse(event.target.value), true);
  }


  #updateDisplayDate(date, render = true, updateDaySelection = false) {
    this.#displayDate = date;

    this.querySelector('.mdw-year-label').innerHTML = dateUtil.format(date, 'MMMM YYYY');
    const parts = dateUtil.getParts(date);
    // const selectedYear = this.querySelector('.mdw-year[selected]');
    // if (selectedYear) selectedYear.removeAttribute('selected');
    const displayYear = this.querySelector(`.mdw-year[year="${parts.year}"]`);
    if (displayYear) displayYear.setAttribute('selected', '');

    if (render) {
      const active = this.querySelector('.mdw-month.mdw-active');
      active.innerHTML = this.#monthDaysTemplate();
      const previous = this.querySelector('.mdw-month.mdw-previous');
      previous.innerHTML = this.#monthDaysTemplate(dateUtil.addToDateByParts(date, { month: -1 }));
      const next = this.querySelector('.mdw-month.mdw-next');
      next.innerHTML = this.#monthDaysTemplate(dateUtil.addToDateByParts(date, { month: 1 }));

      this.querySelector('.mdw-years-container').innerHTML = this.#yearTemplate();
    }

    if (updateDaySelection) {
      this.#valueDate = date; //dateUtil.format(date, 'YYYY-MM-DD');
      this.querySelector('.mdw-display-date-text').innerHTML = dateUtil.format(date, 'ddd, MMM DD');
      const selected = this.querySelector('.mdw-day.mdw-interactive[selected]');
      if (selected) selected.removeAttribute('selected');
      const next = this.querySelector(`.mdw-day:not(.mdw-not-current-month)[mdw-date="${this.#value}"]`);
      if (next) next.setAttribute('selected', '');
    }

    // this.#drag.emptyIgnoreElements();
    // [...this.querySelectorAll('.mdw-control-container')].forEach(e => this.#drag.addIgnoreElement(e));
  }

  #cancel() {
    this.#value = this.#initialValue;
    this.close();
  }

  #ok() {
    this.close();
  }

  #dayClick(event) {
    if (!event.target.classList.contains('mdw-day')) return;

    this.#updateDisplayDate(dateUtil.parse(event.target.getAttribute('mdw-date')), false, true);

    const selected = this.querySelector('.mdw-day.mdw-interactive[selected]');
    if (selected) selected.removeAttribute('selected');
    event.target.setAttribute('selected', '');
  }

  #onShow() {
    this.#updateDisplayDate(this.#displayDate, true);
    this.addEventListener('close', this.#onClose_bound, { signal: this.#abort.signal });
    this.#drag.enable();
  }

  #onClose() {
    this.removeEventListener('close', this.#onClose_bound);
    this.#drag.disable();
  }

  #previousMonthClick() {
    this.#changeMonth(-1);
  }

  #nextMonthClick() {
    this.#changeMonth(1);
  }

  async #changeMonth(direction = 1) {
    const active = this.querySelector('.mdw-month.mdw-active');
    const previous = this.querySelector('.mdw-month.mdw-previous');
    const next = this.querySelector('.mdw-month.mdw-next');

    active.classList.remove('mdw-active');
    if (direction === -1) {
      active.classList.add('mdw-animation-active-next');
      previous.classList.add('mdw-animation-previous-active');
      previous.classList.remove('mdw-previous');
    } else {
      active.classList.add('mdw-animation-active-previous');
      next.classList.add('mdw-animation-next-active');
      next.classList.remove('mdw-next');
    }

    const nextDate = dateUtil.addToDateByParts(dateUtil.parse(active.querySelector('[mdw-date]:nth-child(10)').getAttribute('mdw-date')), { month: direction });
    this.#updateDisplayDate(nextDate, false);

    await util.nextAnimationFrameAsync();

    if (direction === -1) {
      active.classList.add('mdw-next');
      previous.classList.add('mdw-active');
      next.classList.add('mdw-previous');
      next.classList.remove('mdw-next');
    } else {
      active.classList.add('mdw-previous');
      next.classList.add('mdw-active');
      previous.classList.add('mdw-next');
      previous.classList.remove('mdw-previous');
    }

    await util.transitionendAsync(active);

    active.classList.remove('mdw-animation-active-next');
    active.classList.remove('mdw-animation-active-previous');
    previous.classList.remove('mdw-animation-previous-active');
    next.classList.remove('mdw-animation-next-active');

    this.#updateDisplayDate(nextDate, true);
  }

  #yearDropDownClick() {
    if (this.classList.contains('mdw-year-view')) {
      this.classList.remove('mdw-year-view');
      // this.#drag.enable();
    } else {
      // this.#drag.disable();
      this.classList.add('mdw-year-view');
      const selectedYear = this.querySelector('.mdw-year[selected]');
      if (selectedYear) selectedYear.removeAttribute('selected');

      const currentYear = this.querySelector(`.mdw-year[mdw-year="${dateUtil.getYear(this.#displayDate)}"]`);
      if (currentYear) {
        currentYear.setAttribute('selected', '');
        currentYear.scrollIntoView({ block: 'center' });
      }
    }
  }

  #yearClickHandler(event) {
    if (!event.target.classList.contains('mdw-year')) return;

    this.#updateDisplayDate(dateUtil.setDateByParts(this.#displayDate, { year: parseInt(event.target.getAttribute('mdw-year')) }));

    this.classList.remove('mdw-year-view');
  }

  #onDragStart() {
    this.classList.add('mdw-dragging');
  }

  #onDrag({ distance }) {
    this.style.setProperty('--mdw-months-container-drag-left', `${distance.x}px`);
  }

  async #onDragEnd({ distance }) {
    if (distance.x > 100) {
      this.classList.add('mdw-drag-animation');
      this.style.setProperty('--mdw-months-container-drag-left', '320px');
    } else if (distance.x < -100) {
      this.classList.add('mdw-drag-animation');
      this.style.setProperty('--mdw-months-container-drag-left', '-320px');
    }

    await util.transitionendAsync(this);

    this.classList.remove('mdw-drag-animation');

    if (distance.x > 100) {
      this.#updateDisplayDate(dateUtil.addToDateByParts(this.#displayDate, { month: -1 }), true);
      this.style.setProperty('--mdw-months-container-drag-left', '0');
    } else if (distance.x < -100) {
      this.#updateDisplayDate(dateUtil.addToDateByParts(this.#displayDate, { month: 1 }), true);
      this.style.setProperty('--mdw-months-container-drag-left', '0');
    }

    this.classList.remove('mdw-dragging');
  }
});
