import MDWPanelElement from '../panel/component.js';
import dateUtil from '../../core/dateUtil.js';
import util from '../../core/util.js';
import { monthDaysRangeTemplate } from './helper.js';
import {
  close_FILL1_wght400_GRAD0_opsz24,
  edit_FILL1_wght400_GRAD0_opsz24
} from '../../core/svgs.js';

customElements.define('mdw-date-picker-range-mobile', class MDWDatePickerRangeMobileElement extends MDWPanelElement {
  useTemplate = false;

  #showInputView_bound = this.#showInputView.bind(this);
  #onInputStart_bound = util.debounce(this.#onInputStart, 100).bind(this);
  #onInputEnd_bound = util.debounce(this.#onInputEnd, 100).bind(this);
  #cancel_bound = this.#cancel.bind(this);
  #ok_bound = this.#ok.bind(this);
  #dayClick_bound = this.#dayClick.bind(this);
  #onShow_bound = this.#onShow.bind(this);
  #onClose_bound = this.#onClose.bind(this);
  #onScroll_throttle = util.rafThrottle(this.#onScroll.bind(this));
  #selectedDateA;
  #selectedDateB;
  #abort = new AbortController();

  constructor() {
    super();

    this.clickOutsideClose = false;
    this.scrim = false;
    this.animation = 'opacity';
    this.addClickOutsideCloseIgnore(this.parentElement.control);
  }

  afterRender() {
    this.querySelector('.mdw-edit').addEventListener('click', this.#showInputView_bound, { signal: this.#abort.signal });
    this.querySelector('.mdw-cancel').addEventListener('click', this.#cancel_bound, { signal: this.#abort.signal });
    this.querySelector('.mdw-close').addEventListener('click', this.#cancel_bound, { signal: this.#abort.signal });
    this.querySelector('.mdw-ok').addEventListener('click', this.#ok_bound, { signal: this.#abort.signal });
    this.querySelector('.mdw-months-container').addEventListener('click', this.#dayClick_bound, { signal: this.#abort.signal });
    this.addEventListener('open', this.#onShow_bound, { signal: this.#abort.signal });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#abort.abort();
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
    return /*html*/`
      <div class="mdw-header-controls">
        <div class="mdw-close mdw-icon-svg">${close_FILL1_wght400_GRAD0_opsz24}</div>
      </div>
      
      <div class="mdw-header">
        <div class="mdw-supporting-text">${this.parentElement.label}</div>
        <div class="mdw-display-date-container">
          <div class="mdw-display-date-text start">${dateUtil.format(this.#displayDateStart, 'MMM DD')}</div>
          <span class="mdw-date-range-dash"></span>
          <div class="mdw-display-date-text end">${dateUtil.format(this.#displayDateEnd, 'MMM DD')}</div>
          <div class="mdw-edit mdw-icon-svg">${edit_FILL1_wght400_GRAD0_opsz24}</div>
        </div>

        <div class="mdw-days-header">
          ${dateUtil.getDayNames('narrow').map(n => `<span>${n}</span>`).join('\n')}
        </div>
      </div>

      <div class="mdw-divider"></div>

      <div class="mdw-months-container">
        ${[...new Array(34)].map((_, i) => `<div class="mdw-month-placeholder"  mdw-date="${this.#handleMonthDate(this.#displayDateStart, (-3 - i))}"></div>`).reverse().join('\n')}
        <div class="mdw-month" mdw-date="${this.#handleMonthDate(this.#displayDateStart, -2)}">${this.#monthDaysTemplate(dateUtil.addToDateByParts(this.#displayDateStart, { month: -2 }))}</div>
        <div class="mdw-month" mdw-date="${this.#handleMonthDate(this.#displayDateStart, -1) }">${this.#monthDaysTemplate(dateUtil.addToDateByParts(this.#displayDateStart, { month: -1 }))}</div>
        <div class="mdw-month current" mdw-date="${this.#handleMonthDate(this.#displayDateStart) }">${this.#monthDaysTemplate(this.#displayDateStart)}</div>
        <div class="mdw-month" mdw-date="${this.#handleMonthDate(this.#displayDateStart, 1) }">${this.#monthDaysTemplate(dateUtil.addToDateByParts(this.#displayDateStart, { month: 1 }))}</div>
        <div class="mdw-month" mdw-date="${this.#handleMonthDate(this.#displayDateStart, 2) }">${this.#monthDaysTemplate(dateUtil.addToDateByParts(this.#displayDateStart, { month: 2 }))}</div>
        ${[...new Array(34)].map((_, i) => `<div class="mdw-month-placeholder"  mdw-date="${dateUtil.format(dateUtil.addToDateByParts(this.#displayDateStart, { month: i + 3 }), 'YYYY-MM-DD')}"></div>`).join('\n')}
      </div>

      <div class="mdw-input-container">
        <mdw-textfield>
          <input class="start" type="date" aria-label="start date">
          <label>Start date</label>
        </mdw-textfield>
        <mdw-textfield>
          <input class="end" type="date" aria-label="end date">
          <label>End date</label>
        </mdw-textfield>
      </div>

      <div class="mdw-actions-container">
        <mdw-button class="mdw-cancel">Cancel</mdw-button>
        <mdw-button class="mdw-ok">Ok</mdw-button>
      </div>
    `;
  }

  #handleMonthDate(date, add = 0) {
    return dateUtil.format(dateUtil.setDateByParts(dateUtil.addToDateByParts(date, { month: add }), { day: 1 }), 'YYYY-MM-DD');
  }

  #monthDaysTemplate(date = this.#displayDateStart) {
    return /*html*/`
      <div class="mdw-month-header">${dateUtil.format(date, 'MMMM YYYY')}</div>
      <div class="mdw-days-container">
        ${monthDaysRangeTemplate(date, this.#valueStart, this.#valueEnd, this.#minDate, this.#maxDate, false)}
      </div>
    `;
  }

  #showInputView() {
    if (this.classList.contains('mdw-input-view')) {
      this.querySelector('input.start').removeEventListener('input', this.#onInputStart_bound);
      this.querySelector('input.end').removeEventListener('input', this.#onInputEnd_bound);
      this.classList.remove('mdw-input-view');
    } else {
      this.classList.add('mdw-input-view');
      this.querySelector('input.start').addEventListener('click', e => e.preventDefault(), { signal: this.#abort.signal });
      this.querySelector('input.start').value = dateUtil.format(this.#displayDateStart, 'YYYY-MM-DD');
      this.querySelector('input.start').addEventListener('input', this.#onInputStart_bound, { signal: this.#abort.signal });
      this.querySelector('input.end').addEventListener('click', e => e.preventDefault(), { signal: this.#abort.signal });
      this.querySelector('input.end').value = dateUtil.format(this.#displayDateEnd, 'YYYY-MM-DD');
      this.querySelector('input.end').addEventListener('input', this.#onInputEnd_bound, { signal: this.#abort.signal });
    }
  }

  #onInputStart(event) {
    this.#valueStart = event.target.value;
  }

  #onInputEnd(event) {
    this.#valueEnd = event.target.value;
  }

  #updateDisplayDate(date) {
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
        this.#valueDateEnd = selectedADate;
      } else {
        selectedB.setAttribute('start', '');
        selectedA.setAttribute('end', '');
        this.#valueDateStart = selectedADate;
        this.#valueDateEnd = date;
      }
    }

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

      this.querySelector('.mdw-display-date-text.start').innerText = '';
      this.querySelector('.mdw-display-date-text.end').innerText = '';
    }

    [...this.querySelectorAll('[in-selection-range]')].forEach(d => d.removeAttribute('in-selection-range'));

    if (!dateUtil.isValid(this.#valueDateStart) || !dateUtil.isValid(this.#valueDateEnd)) return;

    const container = this.querySelector('.mdw-months-container');
    const template = document.createElement('template');
    const monthRange = dateUtil.getMonthRange(this.#valueDateStart, this.#valueDateEnd);
    
    monthRange.forEach(monthDate => {
      const month = this.querySelector(`.mdw-month[mdw-date="${dateUtil.format(monthDate, 'YYYY-MM-DD')}"]`);
      template.innerHTML = `
          <div class="mdw-month" mdw-date="${this.#handleMonthDate(monthDate)}">${this.#monthDaysTemplate(monthDate)}</div>
        `;
      container.replaceChild(template.content.cloneNode(true), month);
    });

    this.querySelector('.mdw-display-date-text.start').innerText = dateUtil.format(this.#valueDateStart, 'MMM DD');
    this.querySelector('.mdw-display-date-text.end').innerText = dateUtil.format(this.#valueDateEnd, 'MMM DD');
  }

  #cancel() {
    this.#valueStart = this.#initialValueStart;
    this.#valueEnd = this.#initialValueEnd;
    this.#render();
    this.close();
  }

  #ok() {
    this.close();
  }

  #dayClick(event) {
    if (!event.target.classList.contains('mdw-day')) return;
    this.#updateDisplayDate(dateUtil.parse(event.target.getAttribute('mdw-date')));
  }

  #onShow() {
    this.classList.remove('mdw-input-view');
    const current = this.querySelector('.mdw-month.current');
    if (current) {
      current.scrollIntoView({ block: 'center' });
      this.addEventListener('close', this.#onClose_bound, { signal: this.#abort.signal });
      this.querySelector('.mdw-months-container').addEventListener('scroll', this.#onScroll_throttle, { signal: this.#abort.signal });
    }

    const selectedStart = this.querySelector('.mdw-day.mdw-interactive[selected][start]');
    if (selectedStart) this.#selectedDateA = dateUtil.parse(selectedStart.getAttribute('mdw-date'));
    const selectedEnd = this.querySelector('.mdw-day.mdw-interactive[selected][start]');
    if (selectedEnd) this.#selectedDateB = dateUtil.parse(selectedEnd.getAttribute('mdw-date'));
  }

  #onClose() {
    this.removeEventListener('close', this.#onClose_bound);
    this.querySelector('.mdw-months-container').removeEventListener('scroll', this.#onScroll_throttle);
  }

  #onScroll() {
    const container = this.querySelector('.mdw-months-container');
    const elements = [...container.querySelectorAll('.mdw-month-placeholder')];
    if (elements.length === 0) return;

    const containerTriggerTop = container.scrollTop - 100;
    const containerTriggerBottom = container.offsetHeight + container.scrollTop + 100;
    const template = document.createElement('template');
    elements.forEach(element => {
      if (element.offsetBottom > containerTriggerTop || element.offsetTop < containerTriggerBottom) {
        const date = element.getAttribute('mdw-date');
        template.innerHTML = /*html*/`<div class="mdw-month" mdw-date="${date}">${this.#monthDaysTemplate(dateUtil.parse(date))}</div>`;
        container.replaceChild(template.content.cloneNode(true), element);
      }
    }); 
  }
});
