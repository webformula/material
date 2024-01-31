import MDWSurfaceElement from '../surface/component.js';
import styles from './date-range-picker.css' assert { type: 'css' };
import dateUtil from '../../core/dateUtil.js';
import { monthDaysTemplate } from './helper.js';
import device from '../../core/device.js';
import util from '../../core/util.js';
import {
  close_FILL1_wght400_GRAD0_opsz20,
  edit_FILL1_wght400_GRAD0_opsz24,
  calendar_today_FILL0_wght400_GRAD0_opsz24
} from '../../core/svgs.js';


class MDWDateRangePickerElement extends MDWSurfaceElement {
  static tag = 'mdw-date-range-picker';
  static styleSheets = styles;


  #abort;
  #startTextfield;
  #startTextfieldValue;
  #endTextfield;
  #endTextfieldValue;
  #monthElements;
  #scrollContainer;
  #monthScrollContainer;
  #displayDate;
  #monthScrollContainerHeightThird;
  #selectedDateStart;
  #selectedDateEnd;
  #initialStartTextFieldValue;
  #initialEndTextFieldValue
  #textfieldFocus_bound = this.#textfieldFocus.bind(this);
  #onScroll_bound = util.rafThrottle(this.#onScroll.bind(this));
  #dayClick_bound = this.#dayClick.bind(this);
  #cancelClick_bound = this.#cancelClick.bind(this);
  #ok_bound = this.#ok.bind(this);
  #startInput_bound = this.#startInput.bind(this);
  #endInput_bound = this.#endInput.bind(this);
  #toggleInputView_bound = this.#toggleInputView.bind(this);
  #onInputStartView_bound = this.#onInputStartView.bind(this);
  #onInputEndView_bound = this.#onInputEndView.bind(this);


  constructor() {
    super();

    // this.role = 'menu';
    this.animation = 'height-center-to-opacity';

    if (this.modal || device.state === 'compact') {
      this.modal = true;
      this.fixed = true;
      this.scrim = true;
      this.position = 'center';
    } else {
      this.allowClose = true;
      this.overlap = false;
      this.offsetBottom = 28;
    }

    this.#monthElements = [...this.shadowRoot.querySelectorAll('.month')];
    this.#scrollContainer = this.shadowRoot.querySelector('.month-days-container');
    this.#monthScrollContainer = this.shadowRoot.querySelector('.months-scroll-container');
  }

  template() {
    return /*html*/`
      <div class="scrim"></div>
      <div class="surface">
        <div class="surface-content">
          <div class="item-padding">

            <div class="header">
              <mdw-icon-button class="close">
                <mdw-icon>${close_FILL1_wght400_GRAD0_opsz20}</mdw-icon>
              </mdw-icon-button>

              <div class="header-center">
                <div class="select-date">Select dates</div>
                <div class="display-date"></div>
              </div>

              <div class="header-right">
                <mdw-button class="save">Save</mdw-button>

                <mdw-icon-button toggle class="input-view-toggle">
                  <mdw-icon>${edit_FILL1_wght400_GRAD0_opsz24}</mdw-icon>
                  <mdw-icon slot="selected">${calendar_today_FILL0_wght400_GRAD0_opsz24}</mdw-icon>
                </mdw-icon-button>
              </div>
            </div>

            <div class="week-header">
              ${dateUtil.getDayNames('narrow').map(n => `<span>${n}</span>`).join('\n')}
            </div>

            <div class="divider"></div>

            <div class="inputs">
              <mdw-textfield label="Start" type="date" class="start outlined hide-date-icon"></mdw-textfield>
              <mdw-textfield label="End" type="date" class="end outlined hide-date-icon"></mdw-textfield>
            </div>
            
            <div class="month-days-container">
              <div class="scroll-spacer"></div>
              <div class="months-scroll-container">
                ${[...new Array(36)].map((_, i) => `<div class="month" month="${(i % 12) + 1}"></div>`).join('')}
              </div>
            </div>

            <div class="divider bottom"></div>
            <div class="actions">
              <mdw-button class="cancel">Cancel</mdw-button>
              <mdw-button class="ok">OK</mdw-button>
            </div>

          </div>
        </div>
      </div>
    `;
  }


  static get observedAttributesExtended() {
    return [
      ['start-textfield', 'string'],
      ['end-textfield', 'string']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get modal() { return this.hasAttribute('modal'); }
  set modal(value) {
    this.toggleAttribute('modal', !!value);
  }

  get startDate() { return this.#selectedDateStart; }
  get endDate() { return this.#selectedDateEnd; }

  get startTextfield() { return this.#startTextfieldValue; }
  set startTextfield(value) {
    this.#startTextfieldValue = value;
    this.#startTextfield = document.querySelector(value);
  }

  get endTextfield() { return this.#endTextfieldValue; }
  set endTextfield(value) {
    this.#endTextfieldValue = value;
    this.#endTextfield = document.querySelector(value);
  }

  get minDate() {
    if (!this.#startTextfield && !this.#endTextfield) return;
    return dateUtil.parse(typeof this.#startTextfield.min === 'string' ? this.#endTextfield.min : this.#startTextfield.min);
  }
  get maxDate() {
    if (!this.#startTextfield && !this.#endTextfield) return;
    return dateUtil.parse(typeof this.#endTextfield.max === 'string' ? this.#startTextfield.max : this.#endTextfield.max);
  }


  connectedCallback() {
    super.connectedCallback();

    if (this.#startTextfield) {
      if (!this.modal) this.anchorElement = this.#startTextfield;
      this.#startTextfield.addEventListener('focus', this.#textfieldFocus_bound);
    }

    if (this.#endTextfield) {
      if (!this.modal && !this.anchorElement) this.anchorElement = this.#endTextfield;
      this.#endTextfield.addEventListener('focus', this.#textfieldFocus_bound);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.#startTextfield) this.#startTextfield.removeEventListener('focus', this.#textfieldFocus_bound);
    if (this.#endTextfield) this.#endTextfield.removeEventListener('focus', this.#textfieldFocus_bound);
    if (this.#abort) {
      this.#abort.abort();
      this.#abort = undefined;
    }
  }


  onShow() {
    if (this.#startTextfield) {
      this.#selectedDateStart = this.#startTextfield.value && dateUtil.parse(this.#startTextfield.value);
      this.#initialStartTextFieldValue = this.#startTextfield.value;
    }
    if (this.#endTextfield) {
      this.#selectedDateEnd = this.#endTextfield.value && dateUtil.parse(this.#endTextfield.value);
      this.#initialEndTextFieldValue = this.#endTextfield.value;
    }
    this.#displayDate = dateUtil.parse(this.#selectedDateStart || dateUtil.today());
    this.#updateMonths();

    // Center both scroll container and month container
    //  This will setup the months container to have the same scroll distance in both directions
    //  Month container is fixed and shifts its top position based on what years are rendered
    //  There are 3 years rendered that shift around as you scroll
    const initialScrollTop = this.#scrollContainer.scrollHeight / 2;
    const initialTop = initialScrollTop - (this.#monthScrollContainer.offsetHeight / 2);
    this.#scrollContainer.scrollTop = initialScrollTop;
    this.#monthScrollContainer.style.top = `${initialTop}px`
    this.#monthScrollContainerHeightThird = this.#monthScrollContainer.offsetHeight / 3;

    this.#scrollToFocused();

    this.#abort = new AbortController();
    this.#scrollContainer.addEventListener('scroll', this.#onScroll_bound, { signal: this.#abort.signal });
    this.shadowRoot.querySelector('.cancel').addEventListener('click', this.#cancelClick_bound, { signal: this.#abort.signal });
    this.shadowRoot.querySelector('.ok').addEventListener('click', this.#ok_bound, { signal: this.#abort.signal });
    this.#monthScrollContainer.addEventListener('click', this.#dayClick_bound, { signal: this.#abort.signal, capture: true });
    if (this.#startTextfield) this.#startTextfield.addEventListener('input', this.#startInput_bound, { signal: this.#abort.signal });
    if (this.#endTextfield) this.#endTextfield.addEventListener('input', this.#endInput_bound, { signal: this.#abort.signal });
    if (this.modal) {
      this.shadowRoot.querySelector('.input-view-toggle').addEventListener('click', this.#toggleInputView_bound, { signal: this.#abort.signal });
      this.shadowRoot.querySelector('.close').addEventListener('click', this.#cancelClick_bound, { signal: this.#abort.signal });
      this.shadowRoot.querySelector('.save').addEventListener('click', this.#ok_bound, { signal: this.#abort.signal });
    }
  }

  onHide() {
    if (this.#abort) {
      this.#abort.abort();
      this.#abort = undefined;
    }

    if (document.activeElement === this.#startTextfield) this.#startTextfield.blur();
    if (document.activeElement === this.#endTextfield) this.#endTextfield.blur();
  }

  onHideEnd() {
    this.classList.remove('input-view');
  }


  #textfieldFocus() {
    this.show();
  }

  #cancelClick() {
    if (this.#startTextfield) this.#startTextfield.value = this.#initialStartTextFieldValue;
    if (this.#endTextfield) this.#endTextfield.value = this.#initialEndTextFieldValue;
    this.close();
  }

  #ok() {
    this.close();
  }

  #dayClick(event) {
    const target = event.composedPath()[0];
    if (!target.classList.contains('day')) return;
    this.#updateSelected(dateUtil.parse(target.getAttribute('date')));
  }

  #startInput() {
    const date = dateUtil.parse(this.#startTextfield.value);
    const oldYear = this.#selectedDateStart?.getFullYear();
    this.#selectedDateStart = date;
    if (oldYear !== date.getFullYear()) this.#updateMonths();
    else this.#renderSelectedDisplay();

    this.#scrollToFocused(true, true)
  }

  #endInput() {
    const date = dateUtil.parse(this.#endTextfield.value);
    const oldYear = this.#selectedDateEnd?.getFullYear();
    this.#selectedDateEnd = date;
    if (oldYear !== date.getFullYear()) this.#updateMonths();
    else this.#renderSelectedDisplay();

    this.#scrollToFocused(true, true, true);
  }

  async #toggleInputView() {
    const isInputView = this.classList.contains('input-view');
    this.classList.add('animate-view');
    this.classList.toggle('input-view');
    const startInput = this.shadowRoot.querySelector('.inputs mdw-textfield.start');
    const endInput = this.shadowRoot.querySelector('.inputs mdw-textfield.end');
    if (!isInputView) {
      startInput.value = this.#selectedDateStart ? dateUtil.format(this.#selectedDateStart, 'YYYY-MM-dd') : '';
      startInput.focus();
      startInput.addEventListener('input', this.#onInputStartView_bound, { signal: this.#abort.signal });

      endInput.value = this.#selectedDateEnd ? dateUtil.format(this.#selectedDateEnd, 'YYYY-MM-dd') : '';
      endInput.addEventListener('input', this.#onInputEndView_bound, { signal: this.#abort.signal });
    } else {
      startInput.removeEventListener('input', this.#onInputStartView_bound);
      endInput.removeEventListener('input', this.#onInputEndView_bound);
    }

    await util.transitionendAsync(this);
    this.classList.remove('animate-view');
  }

  #onInputStartView(event) {
    const input = event.target;
    const date = input.value ? dateUtil.parse(input.value) : '';
    const oldYear = this.#selectedDateStart && this.#selectedDateStart.getFullYear();
    this.#selectedDateStart = date;

    if (this.#startTextfield) this.#startTextfield.value = this.#selectedDateStart ? dateUtil.format(this.#selectedDateStart, 'YYYY-MM-dd') : '';

    if (oldYear && !date || (date && oldYear !== date.getFullYear())) this.#updateMonths();
    else this.#renderSelectedDisplay();
  }

  #onInputEndView(event) {
    const input = event.target;
    const date = input.value ? dateUtil.parse(input.value) : '';
    const oldYear = this.#selectedDateEnd && this.#selectedDateEnd.getFullYear();
    this.#selectedDateEnd = date;

    if (this.#endTextfield) this.#endTextfield.value = this.#selectedDateEnd ? dateUtil.format(this.#selectedDateEnd, 'YYYY-MM-dd') : '';

    if (oldYear && !date || (date && oldYear !== date.getFullYear())) this.#updateMonths();
    else this.#renderSelectedDisplay();
  }

  #scrollToFocused(animate = false, offScreenOnly = false, focusEnd = false) {
    // scroll so that selected start or today is centered
    const focused = this.shadowRoot.querySelector(focusEnd ? '.day.selected.end' : '.day.selected.start') || this.shadowRoot.querySelector('.day.today');
    if (focused) {
      const focusedBounds = focused.getBoundingClientRect();
      const scrollContainerBounds = this.#scrollContainer.getBoundingClientRect();

      if (offScreenOnly && (focusedBounds.top < scrollContainerBounds.bottom && focusedBounds.top > scrollContainerBounds.top)) return;

      const newScrollTop = focusedBounds.top - (scrollContainerBounds.top + (scrollContainerBounds.height / 2)) + (focusedBounds.height / 2);
      this.#scrollContainer.scrollBy({ top: newScrollTop, behavior: animate ? 'smooth' : 'instant' });
    }
  }

  #updateSelected(date) {
    if (this.#selectedDateEnd || !this.#selectedDateStart) {
      this.#selectedDateEnd = undefined;
      this.#selectedDateStart = date;
    } else if (this.#selectedDateStart && date.getTime() < this.#selectedDateStart.getTime()) {
      this.#selectedDateEnd = this.#selectedDateStart;
      this.#selectedDateStart = date;
    } else {
      this.#selectedDateEnd = date;
    }

    if (this.#startTextfield) this.#startTextfield.value = this.#selectedDateStart ? dateUtil.format(this.#selectedDateStart, 'YYYY-MM-dd') : '';
    if (this.#endTextfield) this.#endTextfield.value = this.#selectedDateEnd ? dateUtil.format(this.#selectedDateEnd, 'YYYY-MM-dd') : '';

    this.#renderSelectedDisplay();
  }

  #renderSelectedDisplay() {
    [...this.shadowRoot.querySelectorAll('.day.selected')].map(e => {
      e.classList.remove('start');
      e.classList.remove('end');
      e.classList.remove('selected');
    });
    [...this.shadowRoot.querySelectorAll('.day.selected-range')].map(e => e.classList.remove('selected-range'));

    const startParts = this.#selectedDateStart && dateUtil.getParts(this.#selectedDateStart);
    const endParts = this.#selectedDateEnd && dateUtil.getParts(this.#selectedDateEnd);

    if (this.#selectedDateStart) {
      const selected = this.shadowRoot.querySelector(`.month[year="${startParts.year}"][month="${startParts.month}"] .day[day="${startParts.day}"]`);
      if (selected) {
        selected.classList.add('start');
        selected.classList.add('selected');
      }
    }
    if (this.#selectedDateEnd) {
      const selected = this.shadowRoot.querySelector(`.month[year="${endParts.year}"][month="${endParts.month}"] .day[day="${endParts.day}"]`);
      if (selected) {
        selected.classList.add('end');
        selected.classList.add('selected');
      }
    }
    
    if (this.#selectedDateStart && this.#selectedDateEnd) {
      this.shadowRoot.querySelector('.display-date').innerText = `${dateUtil.format(this.#selectedDateStart, 'MMM DD')} - ${dateUtil.format(this.#selectedDateEnd, 'MMM DD')}`;

      const startMonthTime = dateUtil.buildFromParts({
        year: startParts.year,
        month: startParts.month,
        day: 1
      }).getTime();
      const endMonthTime = dateUtil.buildFromParts({
        year: endParts.year,
        month: endParts.month + 1,
        day: -1
      }).getTime();
      const months = [...this.shadowRoot.querySelectorAll(`.month`)].filter(e => {
        const dateTime = dateUtil.buildFromParts({
          year: parseInt(e.getAttribute('year')),
          month: parseInt(e.getAttribute('month')),
          day: 1
        }).getTime();
        return dateTime >= startMonthTime && dateTime <= endMonthTime;
      });

      const startTime = this.#selectedDateStart.getTime();
      const endTime = this.#selectedDateEnd.getTime();
      const lastMonthIndex = months.length - 1;
      months.forEach((month, i) => {
        let days = [...month.querySelectorAll('.day')];
        if (i === 0 && lastMonthIndex === 0) {
          days = days.filter(e => {
            const dateTime = dateUtil.parse(e.getAttribute('date')).getTime();
            return dateTime > startTime && dateTime < endTime;
          });
        } else if (i === 0) {
          days = days.filter(e => {
            const dateTime = dateUtil.parse(e.getAttribute('date')).getTime();
            return dateTime > startTime;
          });
        } else if (i === lastMonthIndex) {
          days = days.filter(e => {
            const dateTime = dateUtil.parse(e.getAttribute('date')).getTime();
            return dateTime < endTime;
          });
        }

        days.forEach(e => e.classList.add('selected-range'));
      });
    }
  }

  #updateMonths() {
    const startParts = this.#selectedDateStart && dateUtil.getParts(this.#selectedDateStart);
    const endParts = this.#selectedDateEnd && dateUtil.getParts(this.#selectedDateEnd);
    const startMonthTime = this.#selectedDateStart && dateUtil.buildFromParts({
      year: startParts.year,
      month: startParts.month,
      day: 1
    }).getTime();
    const endMonthTime = this.#selectedDateEnd && dateUtil.buildFromParts({
      year: endParts.year,
      month: endParts.month + 1,
      day: -1
    }).getTime();
    const yearOne = this.#displayDate.getFullYear() - 1;
    const matchesSelected = this.#monthElements.filter((element, i) => {
      const year = yearOne + Math.floor(i / 12);
      const month = parseInt(element.getAttribute('month'));
      const date = dateUtil.buildFromParts({
        year,
        month,
        day: 1
      });
      
      element.setAttribute('year', year);
      element.innerHTML = `
        <div class="days-container">
          <div class="days-header">
            <div class="month-label">${dateUtil.format(date, 'MMMM')}</div>
            <div class="year-label">${year}</div>
          </div>
          <div class="days-inner">${monthDaysTemplate(date, this.minDate, this.maxDate)}</div>
        </div>
      `;

      const dateTime = date.getTime();
      return startMonthTime && endMonthTime && dateTime >= startMonthTime && dateTime <= endMonthTime;
    });

    if (matchesSelected.length > 0) this.#renderSelectedDisplay();
  }

  #onScroll() {
    const bounds = this.#scrollContainer.getBoundingClientRect();
    const monthBounds = this.#monthScrollContainer.getBoundingClientRect();
    const top = monthBounds.top - bounds.top;
    const bottom = monthBounds.bottom - bounds.bottom;

    // shift date range and rerender
    // There are 36 months and we shift by a year so the scroll needs to be offset by 1 / 3
    if (top > -2800) {
      this.#displayDate = dateUtil.addToDateByParts(this.#displayDate, { year: -1 });
      this.#updateMonths();
      this.#scrollContainer.scrollTop += this.#monthScrollContainerHeightThird;
    } else if (bottom < 2800) {
      this.#displayDate = dateUtil.addToDateByParts(this.#displayDate, { year: 1 });
      this.#updateMonths();
      this.#scrollContainer.scrollTop -= this.#monthScrollContainerHeightThird;
    }
  }
}
customElements.define(MDWDateRangePickerElement.tag, MDWDateRangePickerElement);
