import MDWPanelElement from '../panel/component.js';
import dateUtil from '../../core/dateUtil.js';
import {
  chevron_left_FILL1_wght400_GRAD0_opsz24,
  chevron_right_FILL1_wght400_GRAD0_opsz24
} from '../../core/svgs.js';
import { checkMinMax, monthDaysRangeTemplate } from './helper.js';
import util from '../../core/util.js';


customElements.define('mdw-date-picker-range-desktop', class MDWDatePickerRangeDesktopElement extends MDWPanelElement {
  static useTemplate = false;

  #onInputStart_bound = util.debounce(this.#onInputStart, 100).bind(this);
  #onInputEnd_bound = util.debounce(this.#onInputEnd, 100).bind(this);
  #cancel_bound = this.#cancel.bind(this);
  #ok_bound = this.#ok.bind(this);
  #dayClick_bound = this.#dayClick.bind(this);
  #onShow_bound = this.#onShow.bind(this);
  #onClose_bound = this.#onClose.bind(this);
  #previousMonth_bound = this.#previousMonth.bind(this);
  #nextMonth_bound = this.#nextMonth.bind(this);
  #selectedDateA;
  #selectedDateB;
  #abort = new AbortController();

  constructor() {
    super();

    this.clickOutsideClose = false;
    this.scrim = false;
    this.animation = 'opacity';
    this.target = this.parentElement.parentElement;
    this.clickOutsideClose = true;
    this.addClickOutsideCloseIgnore(this.#inputStart);
    this.addClickOutsideCloseIgnore(this.#inputEnd);
  }

  afterRender() {
    this.querySelector('.mdw-ok').addEventListener('click', this.#ok_bound, { signal: this.#abort.signal });
    this.querySelector('.mdw-cancel').addEventListener('click', this.#cancel_bound, { signal: this.#abort.signal });
    this.addEventListener('open', this.#onShow_bound, { signal: this.#abort.signal });
    this.querySelector('.mdw-month-range-container').addEventListener('click', this.#dayClick_bound, { signal: this.#abort.signal });
    this.#inputStart.addEventListener('input', this.#onInputStart_bound, { signal: this.#abort.signal });
    this.#inputEnd.addEventListener('input', this.#onInputEnd_bound, { signal: this.#abort.signal });
    this.querySelector('.mdw-month-previous').addEventListener('click', this.#previousMonth_bound, { signal: this.#abort.signal });
    this.querySelector('.mdw-month-next').addEventListener('click', this.#nextMonth_bound, { signal: this.#abort.signal });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#abort.abort();
  }

  get #inputStart() {
    return this.parentElement.inputStart;
  }

  get #inputEnd() {
    return this.parentElement.inputEnd;
  }

  get #valueStart() {
    return this.parentElement.valueStart;
  }
  set #valueStart(value) {
    this.parentElement.valueStart = value;
  }

  get #valueEnd() {
    return this.parentElement.valueEnd;
  }
  set #valueEnd(value) {
    this.parentElement.valueEnd = value;
  }

  get #displayDateStart() {
    return this.parentElement.displayDateStart;
  }
  set #displayDateStart(value) {
    this.parentElement.displayDateStart = value;
  }

  get #displayDateEnd() {
    return this.parentElement.displayDateEnd;
  }
  set #displayDateEnd(value) {
    this.parentElement.displayDateEnd = value;
  }

  get #initialValueStart() {
    return this.parentElement.initialValueStart;
  }

  get #initialValueEnd() {
    return this.parentElement.initialValueEnd;
  }

  get #valueDateStart() {
    return this.parentElement.valueDateStart;
  }
  set #valueDateStart(value) {
    this.parentElement.valueDateStart = value;
  }

  get #valueDateEnd() {
    return this.parentElement.valueDateEnd;
  }
  set #valueDateEnd(value) {
    this.parentElement.valueDateEnd = value;
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
    } = checkMinMax(this.#minDate, this.#maxDate, this.#displayDateStart);

    return /*html*/`
      <div class="mdw-month-range-container">
        <div class="mdw-month-container-start">
          <div class="mdw-control-container">
            <div class="mdw-month-previous mdw-icon-svg" ${previousMonthOutOfRange ? 'disabled' : ''}>${chevron_left_FILL1_wght400_GRAD0_opsz24}</div>
            <div class="mdw-month-drop-down" ${previousMonthOutOfRange && nextMonthOutOfRange ? 'disabled' : ''}>
              <div class="mdw-month-label">${dateUtil.format(this.#displayDateStart, 'MMMM')}</div>
            </div>
            <div class="mdw-year-drop-down" ${previousYearOutOfRange && nextYearOutOfRange ? 'disabled' : ''}>
              <div class="mdw-year-label">${dateUtil.getYear(this.#displayDateStart)}</div>
            </div>
          </div>

          <div class="mdw-month">
            <div class="mdw-days-header">
              ${dateUtil.getDayNames('narrow').map(n => `<span>${n}</span>`).join('\n')}
            </div>

            <div class="mdw-days-container mdw-active">${this.#monthDaysTemplate(this.#displayDateStart)}</div>
            <div class="mdw-days-container">${this.#monthDaysTemplate(this.#displayDateStart)}</div>
          </div>
        </div>

        <div class="mdw-month-container-end">
          <div class="mdw-control-container">
            <div class="mdw-month-drop-down" ${previousMonthOutOfRange && nextMonthOutOfRange ? 'disabled' : ''}>
              <div class="mdw-month-label">${dateUtil.format(this.#displayDateEnd, 'MMMM')}</div>
            </div>
            <div class="mdw-year-drop-down" ${previousYearOutOfRange && nextYearOutOfRange ? 'disabled' : ''}>
              <div class="mdw-year-label">${dateUtil.getYear(this.#displayDateEnd)}</div>
            </div>
            <div class="mdw-month-next mdw-icon-svg" ${nextMonthOutOfRange ? 'disabled' : ''}>${chevron_right_FILL1_wght400_GRAD0_opsz24}</div>
          </div>
          <div class="mdw-month">
            <div class="mdw-days-header">
              ${dateUtil.getDayNames('narrow').map(n => `<span>${n}</span>`).join('\n')}
            </div>

            <div class="mdw-days-container mdw-active">${this.#monthDaysTemplate(this.#displayDateEnd)}</div>
            <div class="mdw-days-container">${this.#monthDaysTemplate(this.#displayDateEnd)}</div>
          </div>
        </div>
      </div>

      <div class="mdw-actions">
        <mdw-button class="mdw-cancel">Cancel</mdw-button>
        <mdw-button class="mdw-ok">OK</mdw-button>
      </div>
    `;
  }

  #monthDaysTemplate(date) {
    return monthDaysRangeTemplate(date, this.#valueStart, this.#valueEnd, this.#minDate, this.#maxDate, false);
  }

  #onShow() {
    this.addEventListener('close', this.#onClose_bound, { signal: this.#abort.signal });
    const selectedStart = this.querySelector('.mdw-day.mdw-interactive[selected][start]');
    if (selectedStart) this.#selectedDateA = dateUtil.parse(selectedStart.getAttribute('mdw-date'));
    const selectedEnd = this.querySelector('.mdw-day.mdw-interactive[selected][start]');
    if (selectedEnd) this.#selectedDateB = dateUtil.parse(selectedEnd.getAttribute('mdw-date'));
  }

  #onClose() {
    this.removeEventListener('close', this.#onClose_bound);
  }

  #ok() {
    this.close();
  }

  #cancel() {
    this.#valueStart = this.#initialValueStart;
    this.#valueEnd = this.#initialValueEnd;
    this.#render();
    this.close();
  }

  #dayClick(event) {
    if (!event.target.classList.contains('mdw-day')) return;
    this.#updateDisplayDate(dateUtil.parse(event.target.getAttribute('mdw-date')));
  }

  #onInputStart(event) {
    this.#valueStart = event.target.value;
    this.#render();
  }

  #onInputEnd(event) {
    this.#valueEnd = event.target.value;
    this.#render();
  }

  #nextMonth() {
    this.#changeMonth(1);
  }

  #previousMonth() {
    this.#changeMonth(-1);
  }

  async #changeMonth(direction = 1) {
    const activeStart = this.querySelector('.mdw-month-container-start .mdw-days-container.mdw-active');
    const activeEnd = this.querySelector('.mdw-month-container-end .mdw-days-container.mdw-active');
    const altStart = this.querySelector('.mdw-month-container-start .mdw-days-container:not(.mdw-active)');
    const altEnd = this.querySelector('.mdw-month-container-end .mdw-days-container:not(.mdw-active)');
    const dateStart = dateUtil.parse(activeStart.querySelector('[mdw-date]:nth-child(10)').getAttribute('mdw-date'));
    const dateEnd = dateUtil.parse(activeEnd.querySelector('[mdw-date]:nth-child(10)').getAttribute('mdw-date'));
    const nextDateStart = dateUtil.addToDateByParts(dateStart, { month: direction });
    const nextDateEnd = dateUtil.addToDateByParts(dateEnd, { month: direction });

    this.#displayDateStart = nextDateStart;
    this.#displayDateEnd = nextDateEnd;
    altStart.innerHTML = this.#monthDaysTemplate(nextDateStart);
    altEnd.innerHTML = this.#monthDaysTemplate(nextDateEnd);

    this.querySelector('.mdw-month-container-start .mdw-month-label').innerText = dateUtil.format(nextDateStart, 'MMMM');
    this.querySelector('.mdw-month-container-start .mdw-year-label').innerText = dateUtil.getYear(nextDateStart);
    this.querySelector('.mdw-month-container-end .mdw-month-label').innerText = dateUtil.format(nextDateEnd, 'MMMM');
    this.querySelector('.mdw-month-container-end .mdw-year-label').innerText = dateUtil.getYear(nextDateEnd);

    if (direction === 1) {
      altStart.classList.add('mdw-animation-next-to-active');
      activeStart.classList.add('mdw-animation-next-from-active');
      altEnd.classList.add('mdw-animation-next-to-active');
      activeEnd.classList.add('mdw-animation-next-from-active');
    } else {
      altStart.classList.add('mdw-animation-previous-to-active');
      activeStart.classList.add('mdw-animation-previous-from-active');
      altEnd.classList.add('mdw-animation-previous-to-active');
      activeEnd.classList.add('mdw-animation-previous-from-active');
    }

    await util.animationendAsync(activeStart);
    activeStart.innerHTML = this.#monthDaysTemplate(nextDateStart);
    activeEnd.innerHTML = this.#monthDaysTemplate(nextDateEnd);
    altStart.classList.remove('mdw-animation-next-to-active');
    activeStart.classList.remove('mdw-animation-next-from-active');
    altStart.classList.remove('mdw-animation-previous-to-active');
    activeStart.classList.remove('mdw-animation-previous-from-active');
    altEnd.classList.remove('mdw-animation-next-to-active');
    activeEnd.classList.remove('mdw-animation-next-from-active');
    altEnd.classList.remove('mdw-animation-previous-to-active');
    activeEnd.classList.remove('mdw-animation-previous-from-active');
  }

  async #updateDisplayDate(date) {
    if (this.#selectedDateB) {
      this.#selectedDateA = date;
      this.#selectedDateB = undefined;

      this.#valueDateStart = '';
      this.#valueDateEnd = '';

      const selectedA = this.querySelector(`.mdw-day[mdw-date="${dateUtil.format(date, 'YYYY-MM-DD')}"]`);
      if (selectedA) selectedA.setAttribute('selected', '');
    } else {
      this.#selectedDateB = date;
      const selectedA = this.querySelector('.mdw-day.mdw-interactive[selected]');
      const selectedADate = dateUtil.parse(selectedA.getAttribute('mdw-date'));
      const selectedB = this.querySelector(`.mdw-day[mdw-date="${dateUtil.format(date, 'YYYY-MM-DD')}"]`);
      selectedB.setAttribute('selected', '');
      if (selectedADate.getTime() > date.getTime()) {
        selectedA.setAttribute('start', '');
        selectedB.setAttribute('end', '');
        this.#valueDateStart = date;
        this.#displayDateStart = date;
        this.#valueDateEnd = selectedADate;
        this.#displayDateEnd = selectedADate;
      } else {
        selectedB.setAttribute('start', '');
        selectedA.setAttribute('end', '');
        this.#valueDateStart = selectedADate;
        this.#displayDateStart = selectedADate;
        this.#valueDateEnd = date;
        this.#displayDateEnd = date;
      }
    }

    await util.nextAnimationFrameAsync();
    this.#render();
  }

  #render(clearSelected = true) {
    if (clearSelected) {
      const selectedStart = this.querySelector('[selected][start]');
      if (selectedStart) {
        selectedStart.removeAttribute('selected');
        selectedStart.removeAttribute('start');
      }
      const selectedEnd = this.querySelector('[selected][end]');
      if (selectedEnd) {
        selectedEnd.removeAttribute('selected');
        selectedEnd.removeAttribute('end');
      }

      this.querySelector('.mdw-month-container-start .mdw-month-label').innerText = '';
      this.querySelector('.mdw-month-container-start .mdw-year-label').innerText = '';
      this.querySelector('.mdw-month-container-end .mdw-month-label').innerText = '';
      this.querySelector('.mdw-month-container-end .mdw-year-label').innerText = '';
    }

    [...this.querySelectorAll('[in-selection-range]')].forEach(d => d.removeAttribute('in-selection-range'));

    if (dateUtil.isValid(this.#displayDateStart)) {
      this.querySelector('.mdw-month-container-start .mdw-month-label').innerText = dateUtil.format(this.#displayDateStart, 'MMMM');
      this.querySelector('.mdw-month-container-start .mdw-year-label').innerText = dateUtil.getYear(this.#displayDateStart);
    }

    if (dateUtil.isValid(this.#displayDateEnd)) {
      this.querySelector('.mdw-month-container-end .mdw-month-label').innerText = dateUtil.format(this.#displayDateEnd, 'MMMM');
      this.querySelector('.mdw-month-container-end .mdw-year-label').innerText = dateUtil.getYear(this.#displayDateEnd);
    }

    if (!dateUtil.isValid(this.#valueDateStart) || !dateUtil.isValid(this.#valueDateEnd)) return;

    const dateMonthA = this.#valueDateStart;
    const dateMonthB = this.#valueDateStart.getMonth() === this.#valueDateEnd.getMonth() ? dateUtil.addToDateByParts(this.#valueDateStart, { month: 1 }) : this.#valueDateEnd;

    this.querySelector('.mdw-month-container-start .mdw-days-container.mdw-active').innerHTML = this.#monthDaysTemplate(dateMonthA);
    this.querySelector('.mdw-month-container-end .mdw-days-container.mdw-active').innerHTML = this.#monthDaysTemplate(dateMonthB);
  }
});
