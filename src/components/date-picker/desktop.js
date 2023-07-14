import MDWPanelElement from '../panel/component.js';
import dateUtil from '../../core/dateUtil.js';
import util from '../../core/util.js';
import { checkMinMax, monthDaysTemplate } from './helper.js';
import {
  check_FILL1_wght400_GRAD0_opsz24,
  arrow_drop_down_FILL1_wght400_GRAD0_opsz24,
  chevron_left_FILL1_wght400_GRAD0_opsz24,
  chevron_right_FILL1_wght400_GRAD0_opsz24
} from '../../core/svgs.js';

// TODO tooltips
// TODO keyboard
// TODO input
// TODO accessability

customElements.define('mdw-date-picker-desktop', class MDWDatePickerDesktopElement extends MDWPanelElement {
  useTemplate = false;

  #dayClick_bound = this.#dayClick.bind(this);
  #nextMonth_bound = this.#nextMonth.bind(this);
  #previousMonth_bound = this.#previousMonth.bind(this);
  #monthViewClick_bound = this.#monthViewClick.bind(this);
  #monthClick_bound = this.#monthClick.bind(this);
  #nextYear_bound = this.#nextYear.bind(this);
  #previousYear_bound = this.#previousYear.bind(this);
  #yearViewClick_bound = this.#yearViewClick.bind(this);
  #yearClick_bound = this.#yearClick.bind(this);
  #close_bound = this.#close.bind(this);
  #clear_bound = this.#clear.bind(this);
  #cancel_bound = this.#cancel.bind(this);
  #onShow_bound = this.#onShow.bind(this);
  #abort = new AbortController();

  constructor() {
    super();

    this.animation = 'scale';
    this.scrim = false;
    this.clickOutsideClose = true;
    this.target = this.parentElement.control;

    this.addClickOutsideCloseIgnore(this.parentElement.control);
  }

  afterRender() {
    this.querySelector('.mdw-month-days-container').addEventListener('click', this.#dayClick_bound, { signal: this.#abort.signal });
    this.querySelector('.mdw-month-next').addEventListener('click', this.#nextMonth_bound, { signal: this.#abort.signal });
    this.querySelector('.mdw-month-previous').addEventListener('click', this.#previousMonth_bound, { signal: this.#abort.signal });
    this.querySelector('.mdw-month-drop-down').addEventListener('click', this.#monthViewClick_bound, { signal: this.#abort.signal });
    this.querySelector('.mdw-months-container').addEventListener('click', this.#monthClick_bound, { signal: this.#abort.signal });
    this.querySelector('.mdw-year-next').addEventListener('click', this.#nextYear_bound, { signal: this.#abort.signal });
    this.querySelector('.mdw-year-previous').addEventListener('click', this.#previousYear_bound, { signal: this.#abort.signal });
    this.querySelector('.mdw-year-drop-down').addEventListener('click', this.#yearViewClick_bound, { signal: this.#abort.signal });
    this.querySelector('.mdw-years-container').addEventListener('click', this.#yearClick_bound, { signal: this.#abort.signal });
    this.querySelector('.mdw-cancel').addEventListener('click', this.#cancel_bound, { signal: this.#abort.signal });
    this.querySelector('.mdw-clear').addEventListener('click', this.#clear_bound, { signal: this.#abort.signal });
    this.querySelector('.mdw-ok').addEventListener('click', this.#close_bound, { signal: this.#abort.signal });
    this.addEventListener('open', this.#onShow_bound, { signal: this.#abort.signal });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
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
      <div class="mdw-control-container">
        <div class="mdw-month-previous mdw-icon-svg" ${previousMonthOutOfRange ? 'disabled' : ''}>${chevron_left_FILL1_wght400_GRAD0_opsz24}</div>
        <div class="mdw-month-drop-down" ${previousMonthOutOfRange && nextMonthOutOfRange ? 'disabled' : ''}>
          <div class="mdw-month-label">${dateUtil.format(this.#displayDate, 'MMMM')}</div>
          <div class="mdw-icon-svg">${arrow_drop_down_FILL1_wght400_GRAD0_opsz24}</div>
        </div>
        <div class="mdw-month-next mdw-icon-svg" ${nextMonthOutOfRange ? 'disabled' : ''}>${chevron_right_FILL1_wght400_GRAD0_opsz24}</div>
        <div class="mdw-year-previous mdw-icon-svg" ${previousYearOutOfRange ? 'disabled' : ''}>${chevron_left_FILL1_wght400_GRAD0_opsz24}</div>
        <div class="mdw-year-drop-down" ${previousYearOutOfRange && nextYearOutOfRange ? 'disabled' : ''}>
          <div class="mdw-year-label">${dateUtil.getYear(this.#displayDate)}</div>
          <div class="mdw-icon-svg">${arrow_drop_down_FILL1_wght400_GRAD0_opsz24}</div>
        </div>
        <div class="mdw-year-next mdw-icon-svg" ${nextYearOutOfRange ? 'disabled' : ''}>${chevron_right_FILL1_wght400_GRAD0_opsz24}</div>
      </div>

      <div class="mdw-month-days-container">
        <div class="mdw-days-header">
          ${dateUtil.getDayNames('narrow').map(n => `<span>${n}</span>`).join('\n')}
        </div>

        <div class="mdw-days-container mdw-active">${this.#monthDaysTemplate()}</div>
        <div class="mdw-days-container">${this.#monthDaysTemplate()}</div>
      </div>

      <div class="mdw-months-container">${this.#monthsTemplate()}</div>
      <div class="mdw-years-container">${this.#yearTemplate()}</div>

      <div class="mdw-actions">
        <mdw-button class="mdw-clear">Clear</mdw-button>
        <mdw-button class="mdw-cancel">Cancel</mdw-button>
        <mdw-button class="mdw-ok">OK</mdw-button>
      </div>
    `;
  }

  #monthDaysTemplate(date = this.#displayDate) {
    return monthDaysTemplate(date, this.#value, this.#minDate, this.#maxDate, true, true);
  }

  #yearTemplate() {
    return dateUtil.defaultYearRange().map(year => {
      const isPreviousMinYear = this.#minDate && this.#minDate.getFullYear() > year;
      const isNextMaxYear = this.#maxDate && this.#maxDate.getFullYear() < year;
      const outOfRange = isPreviousMinYear || isNextMaxYear;
      return /*html*/`
        <div class="mdw-year-item" ${outOfRange ? 'disabled' : ''} year="${year}">
          <div class="mdw-icon-svg">${check_FILL1_wght400_GRAD0_opsz24}</div>
          ${year}
        </div>
      `;
    }).join('\n');
  }

  #monthsTemplate() {
    const monthNames = dateUtil.getMonthNames();
    return monthNames.map((name, i) => {
      const isPreviousMinMonth = this.#minDate && this.#minDate.getMonth() > i;
      const isNextMaxMonth = this.#maxDate && this.#maxDate.getMonth() < i;
      const outOfRange = isPreviousMinMonth || isNextMaxMonth;
      return /*html*/`
        <div class="mdw-month-item" ${outOfRange ? 'disabled' : ''} month="${i + 1}">
          <div class="mdw-icon-svg">${check_FILL1_wght400_GRAD0_opsz24}</div>
          ${name}
        </div>
      `;
    }).join('\n');
  }


  #dayClick(event) {
    if (!event.target.classList.contains('mdw-day')) return;

    this.#displayDate = dateUtil.parse(event.target.getAttribute('mdw-date'));
    this.#valueDate = this.#displayDate;

    const selected = this.querySelector('.mdw-day.mdw-interactive[selected]');
    if (selected) selected.removeAttribute('selected');
    event.target.setAttribute('selected', '');

    // fixes clickOutsideClose bug
    event.stopPropagation();
  }

  #nextMonth() {
    this.#changeMonth(1);
  }

  #previousMonth() {
    this.#changeMonth(-1);
  }

  async #changeMonth(direction = 1) {
    const active = this.querySelector('.mdw-days-container.mdw-active');
    const alt = this.querySelector('.mdw-days-container:not(.mdw-active)');
    const nextDate = dateUtil.addToDateByParts(dateUtil.parse(active.querySelector('[mdw-date]:nth-child(10)').getAttribute('mdw-date')), { month: direction });
    alt.innerHTML = this.#monthDaysTemplate(nextDate);

    this.#updateDisplayDate(nextDate);

    if (direction === 1) {
      alt.classList.add('mdw-animation-next-to-active');
      active.classList.add('mdw-animation-next-from-active');
    } else {
      alt.classList.add('mdw-animation-previous-to-active');
      active.classList.add('mdw-animation-previous-from-active');
    }

    await util.animationendAsync(active);
    alt.classList.remove('mdw-animation-next-to-active');
    active.classList.remove('mdw-animation-next-from-active');
    alt.classList.remove('mdw-animation-previous-to-active');
    active.classList.remove('mdw-animation-previous-from-active');
  }

  #monthViewClick() {
    if (this.classList.contains('mdw-months-view')) {
      this.classList.remove('mdw-months-view');
    } else {
      this.classList.add('mdw-months-view');
      const selectedMonth = this.querySelector('.mdw-month-item[selected]');
      if (selectedMonth) selectedMonth.removeAttribute('selected');

      const currentMonth = this.querySelector(`.mdw-month-item[month="${dateUtil.getMonth(this.#displayDate)}"]`);
      if (currentMonth) {
        currentMonth.setAttribute('selected', '');
        currentMonth.scrollIntoView({ block: 'center' });
      }
    }
  }

  #monthClick(event) {
    if (!event.target.classList.contains('mdw-month-item')) return;

    this.#updateDisplayDate(dateUtil.setDateByParts(this.#displayDate, { month: parseInt(event.target.getAttribute('month')) }));

    this.classList.remove('mdw-months-view');

    // fixes clickOutsideClose bug
    event.stopPropagation();
  }

  #nextYear() {
    this.#updateDisplayDate(dateUtil.addToDateByParts(this.#displayDate, { year: 1 }));
  }

  #previousYear() {
    this.#updateDisplayDate(dateUtil.addToDateByParts(this.#displayDate, { year: -1 }));
  }

  #yearViewClick() {
    if (this.classList.contains('mdw-years-view')) {
      this.classList.remove('mdw-years-view');
    } else {
      this.classList.add('mdw-years-view');
      const selectedYear = this.querySelector('.mdw-year-item[selected]');
      if (selectedYear) selectedYear.removeAttribute('selected');

      const currentYear = this.querySelector(`.mdw-year-item[year="${dateUtil.getYear(this.#displayDate)}"]`);
      if (currentYear) {
        currentYear.setAttribute('selected', '');
        currentYear.scrollIntoView({ block: 'center' });
      }
    }
  }

  #yearClick(event) {
    if (!event.target.classList.contains('mdw-year-item')) return;

    this.#updateDisplayDate(dateUtil.setDateByParts(this.#displayDate, { year: parseInt(event.target.getAttribute('year')) }));

    this.classList.remove('mdw-years-view');

    // fixes clickOutsideClose bug
    event.stopPropagation();
  }

  #updateDisplayDate(date, render = true) {
    this.#displayDate = date;

    const parts = dateUtil.getParts(date);
    this.querySelector('.mdw-year-label').innerHTML = parts.year;
    this.querySelector('.mdw-control-container .mdw-month-label').innerHTML = dateUtil.format(date, 'MMMM');

    const selectedYear = this.querySelector('.mdw-year-item[selected]');
    if (selectedYear) selectedYear.removeAttribute('selected');
    const displayYear = this.querySelector(`.mdw-year-item[month="${parts.year}"]`);
    if (displayYear) displayYear.setAttribute('selected', '');

    const selectedMonth = this.querySelector('.mdw-month-item[selected]');
    if (selectedMonth) selectedMonth.removeAttribute('selected');
    const displayMonth = this.querySelector(`.mdw-month-item[month="${parts.year}"]`);
    if (displayMonth) displayMonth.setAttribute('selected', '');

    const {
      previousYearOutOfRange,
      nextYearOutOfRange,
      previousMonthOutOfRange,
      nextMonthOutOfRange
    } = checkMinMax(this.#minDate, this.#maxDate, this.#displayDate);
    if (previousYearOutOfRange) this.querySelector('.mdw-year-previous').setAttribute('disabled', '');
    else this.querySelector('.mdw-year-previous').removeAttribute('disabled');
    if (nextYearOutOfRange) this.querySelector('.mdw-year-next').setAttribute('disabled', '');
    else this.querySelector('.mdw-year-next').removeAttribute('disabled');
    if (previousYearOutOfRange && nextYearOutOfRange) this.querySelector('.mdw-year-drop-down').setAttribute('disabled', '');
    else this.querySelector('.mdw-year-drop-down').removeAttribute('disabled');
    if (previousMonthOutOfRange) this.querySelector('.mdw-month-previous').setAttribute('disabled', '');
    else this.querySelector('.mdw-month-previous').removeAttribute('disabled');
    if (nextMonthOutOfRange) this.querySelector('.mdw-month-next').setAttribute('disabled', '');
    else this.querySelector('.mdw-month-next').removeAttribute('disabled');
    if (previousMonthOutOfRange && nextMonthOutOfRange) this.querySelector('.mdw-month-drop-down').setAttribute('disabled', '');
    else this.querySelector('.mdw-month-drop-down').removeAttribute('disabled');

    if (render) {
      this.querySelector('.mdw-days-container.mdw-active').innerHTML = this.#monthDaysTemplate();
      this.querySelector('.mdw-years-container').innerHTML = this.#yearTemplate();
      this.querySelector('.mdw-months-container').innerHTML = this.#monthsTemplate();
    }
  }

  #close() {
    this.close();
  }

  #cancel() {
    this.#value = this.#initialValue;
    this.close();
  }

  #clear() {
    this.#value = '';
    this.#updateDisplayDate(dateUtil.today());
  }

  #onShow() {
    this.#updateDisplayDate(this.#displayDate, true);
  }
});
