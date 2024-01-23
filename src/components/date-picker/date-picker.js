import MDWSurfaceElement from '../surface/component.js';
import styles from './date-picker.css' assert { type: 'css' };
import dateUtil from '../../core/dateUtil.js';
import { monthDaysTemplate } from './helper.js';
import util from '../../core/util.js';
import device from '../../core/device.js';
import Drag from '../../core/Drag.js';
import {
  check_FILL1_wght400_GRAD0_opsz24,
  arrow_drop_down_FILL1_wght400_GRAD0_opsz24,
  chevron_left_FILL1_wght400_GRAD0_opsz24,
  edit_FILL1_wght400_GRAD0_opsz24,
  calendar_today_FILL0_wght400_GRAD0_opsz24
} from '../../core/svgs.js';


customElements.define('mdw-date-picker', class MDWDatePickerElement extends MDWSurfaceElement {
  static styleSheets = styles;

  #abort;
  #textfield;
  #displayDate;
  #selectedDate;
  #initialTextFieldValue;
  #view;
  #clear;
  #drag;
  #textfieldFocus_bound = this.#textfieldFocus.bind(this);
  #nextMonth_bound = this.#nextMonth.bind(this);
  #previousMonth_bound = this.#previousMonth.bind(this);
  #nextYear_bound = this.#nextYear.bind(this);
  #previousYear_bound = this.#previousYear.bind(this);
  #dayClick_bound = this.#dayClick.bind(this);
  #monthSelectClick_bound = this.#monthSelectClick.bind(this);
  #yearSelectClick_bound = this.#yearSelectClick.bind(this);
  #monthListClick_bound = this.#monthListClick.bind(this);
  #yearListClick_bound = this.#yearListClick.bind(this);
  #okClick_bound = this.#okClick.bind(this);
  #cancelClick_bound = this.#cancelClick.bind(this);
  #clearClick_bound = this.#clearClick.bind(this);
  #onInput_bound = this.#onInput.bind(this);
  #toggleInputView_bound = this.#toggleInputView.bind(this);
  #onInputView_bound = this.#onInputView.bind(this);
  #onDrag_bound = this.#onDrag.bind(this);
  #onDragStart_bound = this.#onDragStart.bind(this);
  #onDragEnd_bound = this.#onDragEnd.bind(this);


  constructor() {
    super();

    // this.role = 'menu';
    this.animation = 'height-center-to-opacity';
    this.#textfield = this.parentElement;

    if (this.modal || device.state === 'compact') {
      this.modal = true;
      this.fixed = true;
      this.scrim = true;
      this.position = 'center';
    } else {
      this.allowClose = true;
      this.overlap = false;
      this.offsetBottom = 28;
      this.anchorElement = this.#textfield;
    }
  }

  template() {
    return /*html*/`
      <div class="scrim"></div>
      <div class="surface">
        <div class="surface-content">
          <div class="item-padding">

            <div class="controls">
              <div class="control-group">
                <div class="month-previous">${chevron_left_FILL1_wght400_GRAD0_opsz24}</div>
                <div class="month-select">
                  <div class="month-select-label"></div>
                  <div class="drop-arrow">${arrow_drop_down_FILL1_wght400_GRAD0_opsz24}</div>
                </div>
                <div class="month-next">${chevron_left_FILL1_wght400_GRAD0_opsz24}</div>
              </div>
              
              <div class="control-group">
                <div class="year-previous">${chevron_left_FILL1_wght400_GRAD0_opsz24}</div>
                <div class="year-select">
                  <div class="year-select-label"></div>
                  <div class="drop-arrow">${arrow_drop_down_FILL1_wght400_GRAD0_opsz24}</div>
                </div>
                <div class="year-next">${chevron_left_FILL1_wght400_GRAD0_opsz24}</div>
              </div>
            </div>

            <div class="month-days-container">
              <div class="week-header">
                ${dateUtil.getDayNames('narrow').map(n => `<span>${n}</span>`).join('\n')}
              </div>

              <div class="days-container active"></div>
              <div class="days-container"></div>
            </div>

            <div class="modal-header">
              <div class="select-date">Select date</div>
              <div class="display-date-container">
                <div class="display-date"></div>
                <div class="display-date-input">Enter dates</div>

                <mdw-icon-button toggle>
                  <mdw-icon>${edit_FILL1_wght400_GRAD0_opsz24}</mdw-icon>
                  <mdw-icon slot="selected">${calendar_today_FILL0_wght400_GRAD0_opsz24}</mdw-icon>
                </mdw-icon-button>
              </div>

              <div class="divider"></div>
              
              <mdw-textfield label="Date" type="date" class="outlined hide-date-icon"></mdw-textfield>
            </div>

            <div class="month-days-container-modal">
              <div class="days-container-modal active">
                <div class="days-controls">
                  <div class="year-select">
                    <div class="month-select-label"></div>
                    <div class="year-select-label"></div>
                    <div class="drop-arrow">${arrow_drop_down_FILL1_wght400_GRAD0_opsz24}</div>
                  </div>

                  <div class="month-previous">${chevron_left_FILL1_wght400_GRAD0_opsz24}</div>
                  <div class="month-next">${chevron_left_FILL1_wght400_GRAD0_opsz24}</div>
                </div>
                <div class="week-header">
                  ${dateUtil.getDayNames('narrow').map(n => `<span>${n}</span>`).join('\n')}
                </div>
                <div class="days-inner"></div>
              </div>

              <div class="days-container-modal">
                <div class="days-controls">
                  <div class="year-select">
                    <div class="month-select-label"></div>
                    <div class="year-select-label"></div>
                    <div class="drop-arrow">${arrow_drop_down_FILL1_wght400_GRAD0_opsz24}</div>
                  </div>

                  <div class="month-previous">${chevron_left_FILL1_wght400_GRAD0_opsz24}</div>
                  <div class="month-next">${chevron_left_FILL1_wght400_GRAD0_opsz24}</div>
                </div>
                <div class="week-header">
                  ${dateUtil.getDayNames('narrow').map(n => `<span>${n}</span>`).join('\n')}
                </div>
                <div class="days-inner"></div>
              </div>
            </div>

            <div class="actions">
              <mdw-button class="clear">Clear</mdw-button>

              <mdw-button class="cancel">Cancel</mdw-button>
              <mdw-button class="ok">OK</mdw-button>
            </div>

            <div class="month-list">${dateUtil.getMonthNames().map((name, i) => `
              <div class="month-item" month="${i + 1}">
                <mdw-icon>${check_FILL1_wght400_GRAD0_opsz24}</mdw-icon>
                ${name}
              </div>
            `).join('')}</div>
            <div class="year-list">${dateUtil.defaultYearRange().map(year => `
              <div class="year-item" year="${year}">
                ${year}
              </div>
            `).join('')}</div>

          </div>
        </div>
      </div>
    `;
  }


  static get observedAttributesExtended() {
    return [
      ['clear', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }


  get clear() { return this.#clear; }
  set clear(value) {
    this.#clear = !!value;
  }

  get modal() { return this.hasAttribute('modal'); }
  set modal(value) {
    this.toggleAttribute('modal', !!value);
  }

  get displayDate() { return this.#displayDate; }
  set displayDate(value) {
    this.#displayDate = value;
  }

  get selectedDate() { return this.#selectedDate; }
  set selectedDate(value) {
    this.#selectedDate = value;
    this.#textfield.value = this.#selectedDate ? dateUtil.format(this.#selectedDate, 'YYYY-MM-dd') : '';
  }

  get minDate() {
    return dateUtil.parse(this.#textfield.min);
  }
  get maxDate() {
    return dateUtil.parse(this.#textfield.max);
  }

  get view() { return this.#view; }
  set view(value) {
    this.#view = value;
    this.classList.toggle('view-month', value === 'month');
    this.classList.toggle('view-year', value === 'year');
    if (value === 'month') {
      const month = this.shadowRoot.querySelector('.month-item.selected');
      if (month) {
        const list = this.shadowRoot.querySelector('.month-list');
        list.scrollTop = (list.offsetHeight / 2) + ((month.offsetTop + month.offsetHeight) - list.offsetHeight);
      }
    }
    if (value === 'year') {
      const year = this.shadowRoot.querySelector('.year-item.selected');
      if (year) {
        const list = this.shadowRoot.querySelector('.year-list');
        list.scrollTop = (list.offsetHeight / 2) + ((year.offsetTop + year.offsetHeight) - list.offsetHeight);
      }
    }
  }

  #getMonthDaysContainer() {
    if (this.modal) {
      return this.shadowRoot.querySelector('.month-days-container-modal');
    } else {
      return this.shadowRoot.querySelector('.month-days-container');
    }
  }

  #getDaysContainer(active = true) {
    if (this.modal) {
      if (active) return this.shadowRoot.querySelector('.days-container-modal.active .days-inner');
      return this.shadowRoot.querySelector('.days-container-modal:not(.active) .days-inner');
    } else {
      if (active) return this.shadowRoot.querySelector('.days-container.active');
      return this.shadowRoot.querySelector('.days-container:not(.active)');
    }
  }

  #getDaysAnimationContainer(active = true) {
    if (this.modal) {
      if (active) return this.shadowRoot.querySelector('.days-container-modal.active');
      return this.shadowRoot.querySelector('.days-container-modal:not(.active)');
    } else {
      if (active) return this.shadowRoot.querySelector('.days-container.active');
      return this.shadowRoot.querySelector('.days-container:not(.active)');
    }
  }

  #getYearsSelectLabel(active = true) {
    if (this.modal) {
      if (active) return this.shadowRoot.querySelector('.days-container-modal.active .year-select-label');
      return this.shadowRoot.querySelector('.days-container-modal:not(.active) .year-select-label');
    } else {
      return this.shadowRoot.querySelector('.year-select-label');
    }
  }

  #getMonthSelectLabel(active = true) {
    if (this.modal) {
      if (active) return this.shadowRoot.querySelector('.days-container-modal.active .month-select-label');
      return this.shadowRoot.querySelector('.days-container-modal:not(.active) .month-select-label');
    } else {
      return this.shadowRoot.querySelector('.month-select-label');
    }
  }

  #getMonthNext(active = true) {
    if (this.modal) {
      if (active) return this.shadowRoot.querySelector('.days-container-modal.active .month-next');
      return this.shadowRoot.querySelector('.days-container-modal:not(.active) .month-next');
    } else {
      return this.shadowRoot.querySelector('.month-next');
    }
  }

  #getMonthPrevious(active = true) {
    if (this.modal) {
      if (active) return this.shadowRoot.querySelector('.days-container-modal.active .month-previous');
      return this.shadowRoot.querySelector('.days-container-modal:not(.active) .month-previous');
    } else {
      return this.shadowRoot.querySelector('.month-previous');
    }
  }

  #getYearSelect(active = true) {
    if (this.modal) {
      if (active) return this.shadowRoot.querySelector('.days-container-modal.active .year-select');
      return this.shadowRoot.querySelector('.days-container-modal:not(.active) .year-select');
    } else {
      return this.shadowRoot.querySelector('.year-select');
    }
  }
  

  connectedCallback() {
    super.connectedCallback();
    this.#textfield.addEventListener('focus', this.#textfieldFocus_bound);

    if (this.modal) {
      this.#drag = new Drag(this.shadowRoot.querySelector('.month-days-container-modal'), {
        ignoreElements: [...this.shadowRoot.querySelectorAll('.days-controls')]
      });
      this.#drag.disableMouseEvents = true;
      this.#drag.on('mdwdragmove', this.#onDrag_bound);
      this.#drag.on('mdwdragstart', this.#onDragStart_bound);
      this.#drag.on('mdwdragend', this.#onDragEnd_bound);
    }

    requestAnimationFrame(() => {
      this.displayDate = dateUtil.parse(this.#textfield.value || dateUtil.today());
      this.#getDaysContainer().innerHTML = monthDaysTemplate(this.#displayDate, this.minDate, this.maxDate);
      this.#getYearsSelectLabel().innerHTML = this.displayDate.getFullYear();
      this.#getMonthSelectLabel().innerHTML = dateUtil.format(this.displayDate, 'MMMM');
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#textfield.removeEventListener('focus', this.#textfieldFocus_bound);
    if (this.#abort) {
      this.#abort.abort();
      this.#abort = undefined;
    }
    if (this.#drag) {
      this.#drag.destroy();
      this.#drag = undefined;
    }
  }


  onShow() {
    this.#initialTextFieldValue = this.#textfield.value;
    this.#onInput();

    this.#abort = new AbortController();
    this.#textfield.addEventListener('input', this.#onInput_bound, { signal: this.#abort.signal });
    this.#getMonthNext().addEventListener('click', this.#nextMonth_bound, { signal: this.#abort.signal });
    this.#getMonthPrevious().addEventListener('click', this.#previousMonth_bound, { signal: this.#abort.signal });
    
    this.#getMonthDaysContainer().addEventListener('click', this.#dayClick_bound, { signal: this.#abort.signal, capture: true });
    this.#getYearSelect().addEventListener('click', this.#yearSelectClick_bound, { signal: this.#abort.signal });
    this.shadowRoot.querySelector('.month-list').addEventListener('click', this.#monthListClick_bound, { signal: this.#abort.signal });
    this.shadowRoot.querySelector('.year-list').addEventListener('click', this.#yearListClick_bound, { signal: this.#abort.signal });
    this.shadowRoot.querySelector('.cancel').addEventListener('click', this.#cancelClick_bound, { signal: this.#abort.signal });
    this.shadowRoot.querySelector('.ok').addEventListener('click', this.#okClick_bound, { signal: this.#abort.signal });
    if (this.clear) this.shadowRoot.querySelector('.clear').addEventListener('click', this.#clearClick_bound, { signal: this.#abort.signal });

    if (!this.modal) {
      this.shadowRoot.querySelector('.year-next').addEventListener('click', this.#nextYear_bound, { signal: this.#abort.signal });
      this.shadowRoot.querySelector('.year-previous').addEventListener('click', this.#previousYear_bound, { signal: this.#abort.signal });
      this.shadowRoot.querySelector('.month-select').addEventListener('click', this.#monthSelectClick_bound, { signal: this.#abort.signal });
    } else {
      this.#getMonthNext(false).addEventListener('click', this.#nextMonth_bound, { signal: this.#abort.signal });
      this.#getMonthPrevious(false).addEventListener('click', this.#previousMonth_bound, { signal: this.#abort.signal });
      this.#getYearSelect(false).addEventListener('click', this.#yearSelectClick_bound, { signal: this.#abort.signal });
      this.shadowRoot.querySelector('.display-date-container').addEventListener('click', this.#toggleInputView_bound, { signal: this.#abort.signal });
    }

    if (this.#drag) this.#drag.enable();
  }

  onHide() {
    if (this.#abort) {
      this.#abort.abort();
      this.#abort = undefined;
    }
    if (this.#drag) this.#drag.disable();
    this.#textfield.blur();
  }

  onHideEnd() {
    this.classList.remove('input-view');
  }

  async #toggleInputView() {
    const isInputView = this.classList.contains('input-view');
    this.classList.add('animate-view');
    this.classList.toggle('input-view');
    const input = this.shadowRoot.querySelector('.modal-header mdw-textfield');
    if (!isInputView) {
      input.value = this.selectedDate ? dateUtil.format(this.selectedDate, 'YYYY-MM-dd') : '';
      input.focus();
      input.addEventListener('input', this.#onInputView_bound, { signal: this.#abort.signal });
    } else {
      input.removeEventListener('input', this.#onInputView_bound);
    }

    await util.transitionendAsync(this);
    this.classList.remove('animate-view');
  }

  #textfieldFocus() {
    this.show();
  }

  #nextMonth() {
    this.displayDate = dateUtil.addToDateByParts(
      this.#displayDate,
      { month: 1 }
    );
    this.#changeDate();
  }

  #previousMonth() {
    this.displayDate = dateUtil.addToDateByParts(
      this.#displayDate,
      { month: -1 }
    );
    this.#changeDate();
  }

  #nextYear() {
    this.displayDate = dateUtil.addToDateByParts(
      this.#displayDate,
      { year: 1 }
    );
    this.#changeDate();
  }

  #previousYear() {
    this.displayDate = dateUtil.addToDateByParts(
      this.#displayDate,
      { year: -1 }
    );
    this.#changeDate();
  }

  #dayClick(event) {
    const target = event.composedPath()[0];
    if (!target.classList.contains('day')) return;
    this.selectedDate = dateUtil.parse(target.getAttribute('date'));
    this.#changeDate();
  }

  #monthSelectClick() {
    if (this.view !== 'month') this.view = 'month';
    else this.view = 'day';
  }

  #yearSelectClick() {
    if (this.view !== 'year') this.view = 'year';
    else this.view = 'day';
  }

  #monthListClick(event) {
    this.displayDate = dateUtil.setDateByParts(
      this.#displayDate,
      { month: parseInt(event.target.getAttribute('month')) }
    );
    if (this.selectedDate) this.selectedDate = this.displayDate;
    this.#changeDate();
    setTimeout(() => {
      this.view = 'day';
    }, 50);
  }

  #yearListClick(event) {
    this.displayDate = dateUtil.setDateByParts(
      this.#displayDate,
      { year: parseInt(event.target.getAttribute('year')) }
    );
    if (this.selectedDate) this.selectedDate = this.displayDate;
    this.#changeDate();
    setTimeout(() => {
      this.view = 'day';
    }, 50);
  }

  #cancelClick() {
    this.#textfield.value = this.#initialTextFieldValue;
    this.close();
  }

  #okClick() {
    this.close();
  }

  #clearClick() {
    this.displayDate = dateUtil.parse(dateUtil.today());
    this.selectedDate = undefined;
    this.#changeDate();
  }

  #onInput() {
    this.displayDate = dateUtil.parse(this.#textfield.value || dateUtil.today());
    // update internal selected date to prevent loop
    if (this.#textfield.value) this.#selectedDate = dateUtil.parse(this.#textfield.value);
    else this.#selectedDate = undefined;
    this.#changeDate({ force: true, noAnimation: true });
  }

  #onInputView(event) {
    const input = event.target;
    this.displayDate = dateUtil.parse(input.value || dateUtil.today());
    if (input.value) {
      this.selectedDate = dateUtil.parse(input.value);
    } else {
      this.selectedDate = undefined;
    }
    this.#changeDate({ force: true, noAnimation: true });
  }

  async #changeDate(params = { force: false, noAnimation: false }) {
    const active = this.#getDaysAnimationContainer();
    let toBeActive = active;

    const currentDisplayParts = dateUtil.getParts(dateUtil.parse(active.querySelector('[date]:nth-child(10)').getAttribute('date')));
    const displayDateParts = dateUtil.getParts(this.displayDate);

    if (params.force || currentDisplayParts.year !== displayDateParts.year || currentDisplayParts.month !== displayDateParts.month) {
      const alt = this.#getDaysAnimationContainer(false);
      if (this.modal) {
        alt.querySelector('.days-inner').innerHTML = monthDaysTemplate(this.displayDate, this.minDate, this.maxDate);
      } else {
        alt.innerHTML = monthDaysTemplate(this.displayDate, this.minDate, this.maxDate);
      }
      toBeActive = alt;

      this.#getYearsSelectLabel(false).innerHTML = displayDateParts.year;
      this.#getMonthSelectLabel(false).innerHTML = dateUtil.format(this.displayDate, 'MMMM');

      if (params.noAnimation) {
        alt.classList.add('active');
        active.classList.remove('active');
      } else {
        const direction = displayDateParts.year < currentDisplayParts.year ? -1 : displayDateParts.year > currentDisplayParts.year ? 1 : currentDisplayParts.month < displayDateParts.month ? 1 : -1;
        if (direction === 1) {
          alt.classList.add('animate-next');
          active.classList.add('animate-next');
        } else {
          alt.classList.add('animate-previous');
          active.classList.add('animate-previous');
        }

        util.animationendAsync(active).finally(() => {
          alt.classList.remove('animate-next');
          active.classList.remove('animate-next');
          alt.classList.remove('animate-previous');
          active.classList.remove('animate-previous');
          alt.classList.add('active');
          active.classList.remove('active');
        });
      }
    }


    const selectedDay = this.#getDaysContainer().querySelector('.day.interactive.selected');
    if (selectedDay) selectedDay.classList.remove('selected');
    const selectedMonth = this.shadowRoot.querySelector('.month-item.selected');
    if (selectedMonth) selectedMonth.classList.remove('selected');
    const selectedYear = this.shadowRoot.querySelector('.year-item.selected');
    if (selectedYear) selectedYear.classList.remove('selected');
    if (this.modal) this.shadowRoot.querySelector('.modal-header .display-date').innerText = dateUtil.format(this.selectedDate || dateUtil.today(), 'ddd, MMM DD');

    if (this.selectedDate) {
      const selectedParts = dateUtil.getParts(this.selectedDate);

      if (selectedParts.year === displayDateParts.year && selectedParts.month === displayDateParts.month) {
        const next = toBeActive.querySelector(`.day.interactive[day="${selectedParts.day}"]`);
        if (next) next.classList.add('selected');
      }
      const newMonth = this.shadowRoot.querySelector(`.month-item[month="${selectedParts.month}"]`);
      if (newMonth) newMonth.classList.add('selected');
      const newYear = this.shadowRoot.querySelector(`.year-item[year="${selectedParts.year}"]`);
      if (newYear) newYear.classList.add('selected');
    } else {
      const newMonth = this.shadowRoot.querySelector(`.month-item[month="${displayDateParts.month}"]`);
      if (newMonth) newMonth.classList.add('selected');
      const newYear = this.shadowRoot.querySelector(`.year-item[year="${displayDateParts.year}"]`);
      if (newYear) newYear.classList.add('selected');
    }
  }


  #nextDragDate;
  #previousDragDate;
  #isNextDrag;
  #width;
  #isDragged;
  #onDragStart() {
    this.shadowRoot.querySelector('.month-days-container-modal').classList.remove('animate-dragend');
    this.#nextDragDate = dateUtil.addToDateByParts(
      this.#displayDate,
      { month: 1 }
    );
    this.#previousDragDate = dateUtil.addToDateByParts(
      this.#displayDate,
      { month: -1 }
    );
    this.#width = this.shadowRoot.querySelector('.surface-content').offsetWidth - 24;
    this.#isNextDrag = undefined;
    this.#isDragged = false;
  }

  #onDrag({ distanceX }) {
    if (!this.#isDragged) this.#isDragged = true;
    const active = this.#getDaysAnimationContainer(true);
    const alt = this.#getDaysAnimationContainer(false);

    distanceX = Math.min(Math.max(distanceX, -this.#width), this.#width);

    // left
    if (distanceX <= 0) {
      if (this.#isNextDrag !== true) {
        alt.querySelector('.days-inner').innerHTML = monthDaysTemplate(this.#nextDragDate, this.minDate, this.maxDate);
        this.#getYearsSelectLabel(false).innerHTML = this.#nextDragDate.getFullYear();
        this.#getMonthSelectLabel(false).innerHTML = dateUtil.format(this.#nextDragDate, 'MMMM');
        this.#isNextDrag = true;
      }
      active.style.left = `${distanceX}px`;
      alt.style.left = `calc(100% + ${distanceX}px)`;

    // right
    } else {
      if (this.#isNextDrag !== false) {
        alt.querySelector('.days-inner').innerHTML = monthDaysTemplate(this.#previousDragDate, this.minDate, this.maxDate);
        this.#getYearsSelectLabel(false).innerHTML = this.#previousDragDate.getFullYear();
        this.#getMonthSelectLabel(false).innerHTML = dateUtil.format(this.#previousDragDate, 'MMMM')
        this.#isNextDrag = false;
      }

      active.style.left = `${distanceX}px`;
      alt.style.left = `calc(-100% + ${distanceX}px)`;
    }
  }
  

  async #onDragEnd({ distanceX, swipeX }) {
    if (!this.#isDragged) return;
    
    const active = this.#getDaysAnimationContainer(true);
    const alt = this.#getDaysAnimationContainer(false);
    const container = this.shadowRoot.querySelector('.month-days-container-modal');
    container.classList.add('animate-dragend');

    const noChangeZone = this.#width / 3;
    if (distanceX < -noChangeZone || (distanceX <= 0 && swipeX)) {
      this.displayDate = this.#nextDragDate;
      this.#changeDate({ noAnimation: true });
      active.style.left = '-100%';
      alt.style.left = `0`;
    } else if (distanceX > noChangeZone || (distanceX > 0 && swipeX)) {
      this.displayDate = this.#previousDragDate;
      this.#changeDate({ noAnimation: true });
      active.style.left = '100%';
      alt.style.left = `0`;
    } else if (distanceX <= 0) {
      active.style.left = '0';
      alt.style.left = '100%';
    } else {
      active.style.left = '0';
      alt.style.left = '-100%';
    }

    await util.transitionendAsync(active);
    container.classList.remove('animate-dragend');
    active.style.left = '';
    alt.style.left = '';
  }
});
