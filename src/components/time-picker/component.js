import MDWPanelElement from '../panel/component.js';
import device from '../../core/device.js';
import './component.css';
import {
  keyboard_FILL0_wght400_GRAD0_opsz24,
  schedule_FILL0_wght400_GRAD0_opsz24
} from '../../core/svgs.js';

// TODO accessability
// TODO min max

customElements.define('mdw-time-picker', class MDWTimePickerElement extends MDWPanelElement {
  useTemplate = false;

  #control;
  #input;
  #displayValue = '';
  #initialValue = '';
  #selectedHour;
  #lastSelectedHour;
  #selectedMinute;
  #lastSelectedMinute;
  #selectedMeridiem;
  #lastSelectedMeridiem;
  #hourData = [];
  #minuteData = [];
  #onControlFocus_bound = this.#onControlFocus.bind(this);
  #onControlClick_bound = this.#onControlClick.bind(this);
  #onShow_bound = this.#onShow.bind(this);
  #onClose_bound = this.#onClose.bind(this);
  #ok_bound = this.#ok.bind(this);
  #cancel_bound = this.#cancel.bind(this);
  #selectMouseDown_bound = this.#selectMouseDown.bind(this);
  #selectMouseUp_bound = this.#selectMouseUp.bind(this);
  #selectMouseMove_bound = this.#selectMouseMove.bind(this);
  #amClick_bound = this.#amClick.bind(this);
  #pmClick_bound = this.#pmClick.bind(this);
  #dialHourClick_bound = this.#dialHourClick.bind(this);
  #dialMinuteClick_bound = this.#dialMinuteClick.bind(this);
  #onInput_bound = this.#onInput.bind(this);
  #hourClick_bound = this.#hourClick.bind(this);
  #minuteClick_bound = this.#minuteClick.bind(this);
  #keyboardClick_bound = this.#keyboardClick.bind(this);
  #hourInput_bound = this.#hourInput.bind(this);
  #minuteInput_bound = this.#minuteInput.bind(this);
  #abort = new AbortController();
  #openAbort;


  constructor() {
    super();

    this.#control = this.parentNode;
    if (this.#control.nodeName !== 'MDW-TEXTFIELD') throw Error('mdw-date-picker must be a child of mdw-textfield');
    this.#input = this.#control.querySelector('input');
    this.#control.classList.add('mdw-has-time-picker');

    if (device.isMobile) {
      this.scrim = true;
      this.clickOutsideClose = false;
    } else {
      this.animation = 'scale';
      this.scrim = false;
      this.clickOutsideClose = true;
      this.target = this.#control;
    }

    this.addClickOutsideCloseIgnore(this.#control);
    this.#setInitialTime();
    this.#buildThetaData();
  }

  afterRender() {
    this.#input.addEventListener('focus', this.#onControlFocus_bound, { signal: this.#abort.signal });
    // on mobile to prevent the default browser control we disable click events on the input, so no focus
    if (device.isMobile) this.#control.addEventListener('click', this.#onControlClick_bound, { signal: this.#abort.signal });

    this.addEventListener('open', this.#onShow_bound, { signal: this.#abort.signal });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#abort.abort();
    if (this.#openAbort) this.#openAbort.abort();
  }

  get value() {
    return this.#input.value;
  }
  set value(value) {
    this.#input.value = value;
  }

  get min() {
    return this.#input.min;
  }
  get max() {
    return this.#input.max;
  }

  get step() {
    return this.#input.step;
  }

  get #hourStep() {
    return Math.max(1, Math.floor(parseInt(this.step || 1) / 3600))
  }

  get #minuteStep() {
    const step = Math.max(1, Math.floor(parseInt(this.step || 1) / 60));
    if (step > 30) return -1;
    return step;
  }

  get #view() {
    if (this.classList.contains('mdw-input-view')) return 'input';
    if (this.classList.contains('mdw-minute-view')) return 'minute';
    return 'hour';
  }

  get #selector() {
    return this.querySelector('.mdw-selector');
  }

  get #hour24() {
    return this.hasAttribute('hour-24');
  }

  template() {
    const parts = this.#convert24ToMeridiemParts(this.#displayValue);

    return /*html*/`
      <div class="mdw-headline">Select time</div>

      <div class="mdw-time-container">
        <input class="mdw-time-hour" readonly type="number" step="${this.#hourStep}" min="${this.#hour24 ? '0' : '1'}" max="${this.#hour24 ? '23' : '12'}" value="${parts.paddedHour}" selected>
        <div class="mdw-time-separator">:</div>
        <input class="mdw-time-minute" readonly type="number" step="${this.#minuteStep}" min="0" max="59" value="${parts.paddedMinute}" selected>

        ${!this.#hour24 ? /*html*/ `
          <div class="mdw-meridiem-container">
            <div class="mdw-am" ${parts.meridiem === 'AM' ? 'selected' : ''}>AM</div>
            <div class="mdw-pm" ${parts.meridiem === 'PM' ? 'selected' : ''}>PM</div>
          </div>
        ` : ''}
      </div>
    
      <div class="mdw-dial-container">
        <div class="mdw-dial-hour">${this.#hourTemplate()}</div>
        <div class="mdw-dial-minute">${this.#minuteTemplate()}</div>

        <div class="mdw-selector-container">
          <div class="mdw-selector-center"></div>
          <div class="mdw-selector-line"></div>
          <div class="mdw-selector"></div>
        </div>
      </div>

      <div class="mdw-actions">
        ${device.isMobile ? /*html*/`
          <mdw-button class="mdw-keyboard mdw-icon-toggle-button">
            <div class="mdw-svg-icon" value="off">${keyboard_FILL0_wght400_GRAD0_opsz24}</div>
            <div class="mdw-svg-icon" value="on">${schedule_FILL0_wght400_GRAD0_opsz24}</div>
          </mdw-button>
        ` : ''}
        <span style="flex: 1"></span>
        <mdw-button class="mdw-cancel">cancel</mdw-button>
        <mdw-button class="mdw-ok">ok</mdw-button>
      </div>
    `;
  }

  #hourTemplate() {
    const parts = this.#convert24ToMeridiemParts(this.#displayValue);
    return /* html */`
      <div class="mdw-dial-hour-meridiem">
        ${this.#hourData.filter(v => !v.is24).map(v => `<div class="mdw-dial-label" hour="${v.hour}" degree="${v.theta}" ${parts.hour === v.hour ? 'selected' : ''}>${v.paddedHour}</div>`).join('\n')}
      </div>
      
      ${this.#hour24 ? /*html*/ `
        <div class="mdw-dial-hour-24">
          ${this.#hourData.filter(v => v.is24).map(v => `<div class="mdw-dial-label" hour="${v.hour}" degree="${v.theta}" ${parts.hour === v.hour ? 'selected' : ''}>${v.paddedHour}</div>`).join('\n')}
        </div>
      ` : ''}
    `;
  }

  #minuteTemplate() {
    const parts = this.#convertTo24Parts(this.#displayValue);
    return this.#minuteData.map(v => `<div class="mdw-dial-label ${!v.display ? 'mdw-minute-hidden' : ''}" minute="${v.minute}" degree="${v.theta}" ${parts.minute === v.minute ? 'selected' : ''}>${v.display ? v.paddedMinute : ''}</div>`).join('\n');
  }


  #buildThetaData() {
    const hourStep = this.#hourStep;
    const hourCount = 12 / hourStep;

    this.#hourData = [...new Array(hourCount)].map((_, i) => {
      const hour = i === 0 ? 12 : i * hourStep;
      const paddedHour = hour < 10 ? `0${hour}` : hour;
      const theta = 30 * (i * hourStep);
      return {
        theta: `${theta}`,
        hour: `${hour}`,
        paddedHour: `${paddedHour}`
      };
    });

    if (this.#hour24) {
      this.#hourData = this.#hourData.concat([...new Array(hourCount)].map((_, i) => {
        const hour = i === 0 ? '0' : (i * hourStep) + 12;
        const paddedHour = hour < 10 ? `0${hour}` : hour;
        const theta = 30 * (i * hourStep);
        return {
          theta: `${theta}`,
          hour: `${hour}`,
          paddedHour: `${paddedHour}`,
          is24: true
        };
      }))
    }


    const minuteStep = this.#minuteStep;
    if (minuteStep === -1) return;

    const minuteCount = 60 / minuteStep;
    this.#minuteData = [...new Array(minuteCount)].map((_, i) => {
      const minute = i * minuteStep;
      const paddedMinute = minute < 10 ? `0${minute}` : minute;
      const theta = 6 * (i * minuteStep);
      return {
        theta: `${theta}`,
        minute: `${minute}`,
        paddedMinute: `${paddedMinute}`,
        display: minute % 5 === 0
      };
    });
  }

  #setInitialTime() {
    if (this.#input.value) {
      this.#displayValue = this.#input.value;
      this.#initialValue = this.#input.value;
    } else {
      const date = new Date();
      const hourStep = this.#hourStep;
      let hour = Math.round(date.getHours() / hourStep) * hourStep;
      if (hour < 10) hour = `0${hour}`;
      const minuteStep = this.#minuteStep;
      let minute = minuteStep === -1 ? 0 : Math.round(date.getMinutes() / minuteStep) * minuteStep;
      if (minute < 10) minute = `0${minute}`;
      this.#displayValue = `${hour}:${minute}`;
      this.#initialValue = '';
    }
  }

  #updateDisplayValueMeridiem({ hour, minute, meridiem }) {
    const split = this.#displayValue.split(':');
    const currentMeridiem = meridiem ? meridiem : parseInt(split[0]) > 12 ? 'PM' : 'AM';
    if (hour) {
      hour = parseInt(hour);
      if (currentMeridiem === 'PM') {
        if (hour !== 12) hour += 12;
      } else if (hour === 12) hour = 0;
      split[0] = `${hour}`;
    }
    if (parseInt(split[0]) < 10) split[0] = `0${split[0]}`
    if (minute) split[1] = minute;

    this.#displayValue = `${split[0]}:${split[1]}`;
  }

  #updateDisplayValue24({ hour, minute }) {
    const split = this.#displayValue.split(':');
    hour = hour || parseInt(split[0]);
    if (hour < 10) hour = `0${hour}`;
    minute = minute || parseInt(split[1]);
    if (minute < 10) minute = `0${minute}`;
    this.#displayValue = `${hour}:${minute}`;
  }

  #convert24ToMeridiemParts(time) {
    const split = time.split(':');
    let hour = parseInt(split[0]);
    let meridiem = 'AM';
    if (hour > 12) {
      meridiem = 'PM';
      hour = hour - 12;
    }
    if (hour === 0) hour = 12;
    const paddedHour = hour < 10 ? `0${hour}` : `${hour}`;
    const minute = parseInt(split[1]);
    const paddedMinute = minute < 10 ? `0${minute}` : `${minute}`;

    return {
      hour: `${hour}`,
      paddedHour,
      minute,
      paddedMinute,
      meridiem,
      formatted: `${paddedHour}:${paddedMinute} ${meridiem}`
    };
  }

  #convertTo24Parts(time) {
    const split = time.split(':');
    let hour = parseInt(split[0]);
    const paddedHour = hour < 10 ? `0${hour}` : `${hour}`;
    const minute = parseInt(split[1]);
    const paddedMinute = minute < 10 ? `0${minute}` : `${minute}`;

    return {
      hour: `${hour}`,
      paddedHour,
      minute: `${minute}`,
      paddedMinute,
      formatted: `${paddedHour}:${paddedMinute}`
    };
  }

  #onControlFocus() {
    this.show();
  }

  #onControlClick() {
    this.show();
  }

  #onShow() {
    this.#openAbort = new AbortController();
    this.#setInitialTime();

    const parts = this.#convert24ToMeridiemParts(this.#displayValue);
    this.#selectedHour = parts.hour;
    this.#selectedMinute = parts.minute;
    this.#selectedMeridiem = parts.meridiem;
    this.#updateSelection(true);
    this.#switchView('hour');

    this.addEventListener('close', this.#onClose_bound, { signal: this.#openAbort.signal });
    if (device.isMobile) {
      this.#control.removeEventListener('click', this.#onControlClick_bound);
      this.querySelector('.mdw-keyboard').addEventListener('click', this.#keyboardClick_bound, { signal: this.#openAbort.signal });
    }
    this.#input.removeEventListener('focus', this.#onControlFocus_bound);
    this.querySelector('.mdw-dial-container').addEventListener('mousedown', this.#selectMouseDown_bound, { signal: this.#openAbort.signal });
    this.querySelector('.mdw-dial-container').addEventListener('touchstart', this.#selectMouseDown_bound, { signal: this.#openAbort.signal });
    this.#input.addEventListener('input', this.#onInput_bound, { signal: this.#openAbort.signal });
    this.querySelector('.mdw-dial-hour').addEventListener('click', this.#dialHourClick_bound, { signal: this.#openAbort.signal });
    this.querySelector('.mdw-dial-container').addEventListener('click', this.#dialMinuteClick_bound, { signal: this.#openAbort.signal });
    this.querySelector('.mdw-time-hour').addEventListener('click', this.#hourClick_bound, { signal: this.#openAbort.signal });
    this.querySelector('.mdw-time-minute').addEventListener('click', this.#minuteClick_bound, { signal: this.#openAbort.signal });
    this.querySelector('.mdw-ok').addEventListener('click', this.#ok_bound, { signal: this.#openAbort.signal });
    this.querySelector('.mdw-cancel').addEventListener('click', this.#cancel_bound, { signal: this.#openAbort.signal });
    if (!this.#hour24) {
      this.querySelector('.mdw-am').addEventListener('click', this.#amClick_bound, { signal: this.#openAbort.signal });
      this.querySelector('.mdw-pm').addEventListener('click', this.#pmClick_bound, { signal: this.#openAbort.signal });
    }
  }

  #onClose() {
    this.#openAbort.abort();

    setTimeout(() => {
      if (device.isMobile) {
        this.#control.addEventListener('click', this.#onControlClick_bound, { signal: this.#abort.signal });
      }
      this.#input.addEventListener('focus', this.#onControlFocus_bound, { signal: this.#abort.signal });
    });

    this.#input.reportValidity();
  }

  #ok() {
    this.value = this.#displayValue;
    this.close();
  }

  #cancel() {
    this.value = this.#initialValue;
    this.close();
  }

  #selectMouseDown(event) {
    const selectorBounds = this.#selector.getBoundingClientRect();
    const { x, y } = this.#getMousePosition(event);
    if (
      x < selectorBounds.x
      && x > selectorBounds.right
      && y < selectorBounds.y
      && y > selectorBounds.bottom
    ) return;

    window.addEventListener('mouseup', this.#selectMouseUp_bound, { signal: this.#abort.signal });
    window.addEventListener('mousemove', this.#selectMouseMove_bound, { signal: this.#abort.signal });
    window.addEventListener('touchend', this.#selectMouseUp_bound, { signal: this.#abort.signal });
    window.addEventListener('touchmove', this.#selectMouseMove_bound, { signal: this.#abort.signal });
    event.preventDefault();
  }

  #selectMouseUp(event) {
    window.removeEventListener('mouseup', this.#selectMouseUp_bound);
    window.removeEventListener('mousemove', this.#selectMouseMove_bound);
    window.removeEventListener('touchend', this.#selectMouseUp_bound);
    window.removeEventListener('touchmove', this.#selectMouseMove_bound);
    event.preventDefault();
    setTimeout(() => this.#switchView('minute'));
  }

  #hourClick() {
    this.#switchView('hour');
  }

  #minuteClick() {
    this.#switchView('minute');
  }

  #switchView(view = 'hour') {
    if (view === 'hour') {
      this.classList.remove('mdw-minute-view');
      this.classList.remove('mdw-input-view');
      this.querySelector('.mdw-time-hour').setAttribute('selected', '');
      this.querySelector('.mdw-time-minute').removeAttribute('selected');
      this.querySelector('.mdw-time-hour').setAttribute('readonly', '');
      this.querySelector('.mdw-time-minute').setAttribute('readonly', '');
      this.querySelector('.mdw-time-hour').removeEventListener('input', this.#hourInput_bound);
      this.querySelector('.mdw-time-minute').removeEventListener('input', this.#minuteInput_bound);
      this.querySelector('.mdw-time-hour').addEventListener('click', this.#hourClick_bound, { signal: this.#abort.signal });
      this.querySelector('.mdw-time-minute').addEventListener('click', this.#minuteClick_bound, { signal: this.#abort.signal });
    } else if (view === 'minute') {
      if (this.#minuteStep === -1) return;

      this.#selector.classList.remove('mdw-hour-24');
      this.classList.add('mdw-minute-view');
      this.classList.remove('mdw-input-view');
      this.querySelector('.mdw-time-minute').setAttribute('selected', '');
      this.querySelector('.mdw-time-hour').removeAttribute('selected');
      this.querySelector('.mdw-time-hour').setAttribute('readonly', '');
      this.querySelector('.mdw-time-minute').setAttribute('readonly', '');
      this.querySelector('.mdw-time-hour').removeEventListener('input', this.#hourInput_bound);
      this.querySelector('.mdw-time-minute').removeEventListener('input', this.#minuteInput_bound);
      this.querySelector('.mdw-time-hour').addEventListener('click', this.#hourClick_bound, { signal: this.#abort.signal });
      this.querySelector('.mdw-time-minute').addEventListener('click', this.#minuteClick_bound, { signal: this.#abort.signal });
    } else if (view === 'input') {
      this.#selector.classList.remove('mdw-hour-24');
      this.classList.add('mdw-input-view');
      this.classList.remove('mdw-minute-view');
      this.querySelector('.mdw-time-hour').setAttribute('selected', '');
      this.querySelector('.mdw-time-minute').removeAttribute('selected');
      this.querySelector('.mdw-time-hour').removeAttribute('readonly');
      this.querySelector('.mdw-time-minute').removeAttribute('readonly');
      this.querySelector('.mdw-time-hour').addEventListener('input', this.#hourInput_bound, { signal: this.#abort.signal });
      this.querySelector('.mdw-time-minute').addEventListener('input', this.#minuteInput_bound, { signal: this.#abort.signal });
      this.querySelector('.mdw-time-hour').removeEventListener('click', this.#hourClick_bound);
      this.querySelector('.mdw-time-minute').removeEventListener('click', this.#minuteClick_bound);
    }

    this.#updateSelection(true);
  }

  #selectMouseMove(event) {
    const center = this.querySelector('.mdw-selector-center');
    const centerBounds = center.getBoundingClientRect();
    const mousePosition = this.#getMousePosition(event);
    const x = centerBounds.x - mousePosition.x;
    const y = centerBounds.y - mousePosition.y;
    const theta = Math.atan2(y, x) * (180 / Math.PI);

    const view = this.#view;
    if (view === 'hour') {
      const step = this.#hourStep * 30;
      let positionTheta = theta - 90;
      if (positionTheta < 0) positionTheta = 360 + positionTheta; // normalize to all positive
      positionTheta = Math.round(positionTheta / step) * step;
      if (positionTheta === 360) positionTheta = 0;

      // in inner radius
      const isHour24 = this.#hour24 && x > -80 && x < 80 && y > -80 && y < 80;
      this.#selectedHour = this.#hourData.find(v => v.theta === `${positionTheta}` && (isHour24 ? v.is24 === true : v.is24 !== true)).hour;
      this.style.setProperty('--mdw-time-selector-selector-degrees', `${positionTheta}deg`);

    } else if (view === 'minute') {
      const step = this.#minuteStep * 6;
      let positionTheta = theta - 90;
      if (positionTheta < 0) positionTheta = 360 + positionTheta; // normalize to all positive
      const distanceFromMain = (Math.round(positionTheta / 30) * 30) - positionTheta;
      if (Math.abs(distanceFromMain) < 6) positionTheta += distanceFromMain; // favor main minutes
      positionTheta = Math.round(positionTheta / step) * step;
      if (positionTheta === 360) positionTheta = 0;

      this.#selectedMinute = this.#minuteData.find(v => v.theta === `${positionTheta}`).minute;
      this.style.setProperty('--mdw-time-selector-selector-degrees', `${positionTheta}deg`);
    }

    this.#updateSelection();
    event.stopPropagation();
    // event.preventDefault();
  }

  #updateSelection(change = false) {
    const selector = this.#selector;
    if (this.#selectedHour !== undefined && this.#lastSelectedHour !== this.#selectedHour) {
      const isHourAnd24 = this.#hour24 && !!this.#hourData.find(v => v.hour === this.#selectedHour).is24; // TODO hour view
      selector.classList.toggle('mdw-hour-24', isHourAnd24);
      const currentHour = this.querySelector(`.mdw-dial-label[hour][selected]`);
      if (currentHour) currentHour.removeAttribute('selected');
      const nextHour = this.querySelector(`.mdw-dial-label[hour="${this.#selectedHour}"]`);
      if (nextHour) nextHour.setAttribute('selected', '');
      this.#lastSelectedHour = this.#selectedHour;
      change = true;
    }

    if (this.#selectedMinute !== undefined && this.#lastSelectedMinute !== this.#selectedMinute) {
      selector.classList.remove('mdw-hour-24');
      const currentMinute = this.querySelector(`.mdw-dial-label[minute][selected]`);
      if (currentMinute) currentMinute.removeAttribute('selected');
      const nextMinute = this.querySelector(`.mdw-dial-label[minute="${this.#selectedMinute}"]`);
      if (nextMinute) nextMinute.setAttribute('selected', '');
      this.#lastSelectedMinute = this.#selectedMinute;
      change = true;
    }

    if (!this.#hour24 && this.#selectedMeridiem !== undefined && this.#lastSelectedMeridiem !== this.#selectedMeridiem) {
      this.querySelector('.mdw-am').toggleAttribute('selected', this.#selectedMeridiem === 'AM');
      this.querySelector('.mdw-pm').toggleAttribute('selected', this.#selectedMeridiem === 'PM');
      this.#lastSelectedMeridiem = this.#selectedMeridiem;
      change = true;
    }

    if (change) {
      const view = this.#view;

      if (this.#hour24) {
        this.#updateDisplayValue24({ hour: this.#selectedHour });
        this.querySelector('.mdw-time-hour').value = this.#displayValue.split(':')[0];
        if (view === 'hour') selector.classList.toggle('mdw-hour-24', this.#selectedHour === '0' || this.#selectedHour > 12);
      } else {
        this.#updateDisplayValueMeridiem({ hour: this.#selectedHour, meridiem: this.#selectedMeridiem });
        const meridiemParts = this.#convert24ToMeridiemParts(this.#displayValue);
        this.querySelector('.mdw-time-hour').value = meridiemParts.paddedHour;
      }

      this.#updateDisplayValue24({ minute: this.#selectedMinute });
      this.querySelector('.mdw-time-minute').value = this.#displayValue.split(':')[1];

      selector.classList.remove('mdw-minute-secondary');
      let selectedTheta;
      if (view === 'hour') selectedTheta = this.#hourData.find(v => v.hour === `${this.#selectedHour}`).theta;
      else if (view === 'minute') {
        const selectedData = this.#minuteData.find(v => v.minute === `${this.#selectedMinute}`);
        selectedTheta = selectedData.theta;
        if (selectedData.display !== true) selector.classList.add('mdw-minute-secondary');
      }
      this.style.setProperty('--mdw-time-selector-selector-degrees', `${selectedTheta}deg`);
    }
  }

  #amClick() {
    this.querySelector('.mdw-am').setAttribute('selected', '');
    this.querySelector('.mdw-pm').removeAttribute('selected');
    this.#selectedMeridiem = 'AM';
    this.#updateDisplayValueMeridiem({ hour: this.#selectedHour, meridiem: 'AM' });
    this.value = this.#displayValue;
  }

  #pmClick() {
    this.querySelector('.mdw-pm').setAttribute('selected', '');
    this.querySelector('.mdw-am').removeAttribute('selected');
    this.#selectedMeridiem = 'PM';
    this.#updateDisplayValueMeridiem({ hour: this.#selectedHour, meridiem: 'PM' });
    this.value = this.#displayValue;
  }

  #onInput(event) {
    const parts = this.#hour24 ? this.#convertTo24Parts(event.target.value) : this.#convert24ToMeridiemParts(event.target.value);
    this.#selectedHour = parts.hour;
    this.#selectedMinute = parts.minute;
    if (!this.#hour24) this.#selectedMeridiem = parts.meridiem;
    this.#updateSelection();
  }

  #dialHourClick(event) {
    this.#selectedHour = event.target.getAttribute('hour');
    setTimeout(() => this.#switchView('minute'));
  }

  #dialMinuteClick(event) {
    if (this.#view !== 'minute') return;
    this.#selectMouseMove(event);
  }

  #keyboardClick() {
    if (this.#view !== 'input') this.#switchView('input');
    else this.#switchView('hour');
  }

  #hourInput(event) {
    this.#selectedHour = event.target.value;
    if (this.#hour24) {
      this.#updateDisplayValue24({ hour: this.#selectedHour });
    } else {
      this.#updateDisplayValueMeridiem({ hour: this.#selectedHour, meridiem: this.#selectedMeridiem });
    }
  }

  #minuteInput(event) {
    this.#selectedMinute = event.target.value;
    this.#updateDisplayValue24({ minute: this.#selectedMinute });
  }

  #getMousePosition(event) {
    return {
      x: event.changedTouches ? event.changedTouches[0].clientX : event.clientX,
      y: event.changedTouches ? event.changedTouches[0].clientY : event.clientY,
    }
  }
});
