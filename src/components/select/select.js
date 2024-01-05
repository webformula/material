import MDWMenuElement from '../menu/menu.js';
import styles from './select.css' assert { type: 'css' };
import util from '../../core/util.js';

// TODO bottom sheet

customElements.define('mdw-select', class MDWSelectElement extends MDWMenuElement {
  static styleSheets = styles;
  static formAssociated = true;

  #abort;
  #internals;
  #textfield;
  #dirty = false;
  #touched = false;
  #value = '';
  #label = '';
  #placeholder;
  #options = [];
  #isFilter = false;
  #isAsync = false;
  #lastOptionsOnSelect = '';
  #initialOptions = '';
  #onInputFocus_bound = this.#onInputFocus.bind(this);
  #slotChange_bound = this.#slotChange.bind(this);
  #optionClick_bound = this.#optionClick.bind(this);
  #filterInput_bound = this.#filterInput.bind(this);
  #rightClick_bound = this.#rightClick.bind(this);

  constructor() {
    super();

    this.role = 'select';
    this.#internals = this.attachInternals();
    this.#isFilter = this.hasAttribute('filter');
    this.#isAsync = this.hasAttribute('async');
    this.allowClose = true;
    this.offsetBottom = -35; // margin at bottom of textfield

    if (this.#isFilter) {
      // Prevent surface from covering the textfield for typing
      this.overlap = false;
      this.disableLetterFocus = true;
    }

    // TODO rework textfield 
    //  this needs to be added like this because the getters are not available with the nested component till after render
    this.shadowRoot.querySelector('.select').insertAdjacentHTML('afterbegin', `
      <mdw-textfield
        class="${this.classList.contains('outlined') ? 'outlined' : ''}"
        label="${this.label}"
        ${this.hasAttribute('placeholder') ? ` placeholder="${this.getAttribute('placeholder')}"` : ''}
        ${this.hasAttribute('required') ? 'required' : ''}
        ${this.#isFilter ? `
          incremental
          type="search"
        ` : ''}
      >
        <slot slot="leading-icon" name="leading-icon"></slot>
        <slot slot="trailing-icon" name="trailing-icon"></slot>
      </mdw-textfield>
    `);
    this.#textfield = this.shadowRoot.querySelector('mdw-textfield');
  }

  // TODO update
  static get observedAttributesExtended() {
    return [
      ['disabled', 'boolean'],
      ['label', 'string'],
      ['placeholder', 'string'],
      ['readonly', 'boolean'],
      ['supporting-text', 'string'],
      ['value', 'string']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    if (name === 'value' && this.#dirty) return;
    this[name] = newValue;
  }

  template() {
    return /*html*/`
      <div class="select">
        <span class="focus-holder" tabIndex="0"></span>
        <div class="surface">
          <div class="surface-content">
            <div class="item-padding">
              <mdw-progress-linear class="mdw-indeterminate"></mdw-progress-linear>
              <div class="no-results">No items</div>
              <slot class="options-container"></slot>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    
    this.#abort = new AbortController();
    this.#options = [...this.querySelectorAll('mdw-option')];
    this.anchorElement = this.#textfield;
    this.#textfield.addEventListener('click', this.#onInputFocus_bound, { signal: this.#abort.signal });
    this.addEventListener('mousedown', this.#rightClick_bound, { signal: this.#abort.signal });
    this.#textfield.addEventListener('focus', this.#onInputFocus_bound, { signal: this.#abort.signal });
    this.shadowRoot.querySelector('.options-container').addEventListener('slotchange', this.#slotChange_bound, { signal: this.#abort.signal });

    requestAnimationFrame(() => {
      this.#setInitialValue();
      this.#internals.setValidity(this.#textfield.validity, this.#textfield.validationMessage, this.#textfield);
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.#abort) this.#abort.abort();
  }

  get value() { return this.#value; }
  set value(value) {
    this.#value = value;
    const selected = this.#options.filter(el => el.selected = el.value === value);
    if (selected.length > 0) this.#textfield.value = selected[0].displayValue;
    this.#internals.setFormValue(this.value);
  }

  get displayValue() { return this.#textfield.value || ''; }

  get label() { return this.#label || (this.getAttribute('label') || ''); }
  set label(value) {
    this.#label = value;
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', this.#label);
    this.#textfield.label = this.#label;
  }

  get placeholder() { return this.#placeholder }
  set placeholder(value) {
    this.#placeholder = value;
    if (value) this.#textfield.setAttribute('placeholder', value);
    else this.#textfield.removeAttribute('placeholder');
  }

  get required() { return this.hasAttribute('required'); }
  set required(value) {
    this.toggleAttribute('required', value);
    this.#textfield.toggleAttribute('required', value);
  }

  get validationMessage() { return this.#textfield.validationMessage; }
  get validity() { return this.#textfield.validity; }
  get willValidate() { return this.#textfield.willValidate; }


  clear() {
    this.#dirty = false;
    this.value = '';
  }

  reset() {
    this.#dirty = false;
    this.#touched = false;
    this.#textfield.reset();
    this.#setInitialValue();
    this.#updateValidity();
  }
  formResetCallback() { this.reset(); }

  checkValidity() { return this.#textfield.checkValidity(); }
  reportValidity() {
    return this.#textfield.reportValidity();
  }
  setCustomValidity(value = '') {
    this.#textfield.setCustomValidity(value);
  }


  onShow() {
    super.onShow();

    this.addEventListener('click', this.#optionClick_bound, { signal: this.#abort.signal });
    this.#textfield.classList.add('raise-label');

    // set initial scroll position
    const selected = this.querySelector('.selected');
    const surfaceElement = this.shadowRoot.querySelector('.surface .surface-content');
    if (selected) {
      const surfaceBounds = surfaceElement.getBoundingClientRect();
      const selectedBounds = selected.getBoundingClientRect();
      if (surfaceBounds.bottom >= selectedBounds.bottom) surfaceElement.scrollTop = 0;
      const center = surfaceBounds.top + (surfaceBounds.height / 2);
      const scrollAmount = (selectedBounds.top + (selectedBounds.height / 2)) - center;
      surfaceElement.scrollTop = scrollAmount;
    } else {
      surfaceElement.scrollTop = 0;
    }
  }

  onHide() {
    super.onHide();
    if (this.#touched) {
      this.#updateValidity();
      this.#updateValidityDisplay();
    }
    this.#dirty = false;
    this.removeEventListener('click', this.#optionClick_bound);
    this.#textfield.removeEventListener('input', this.#filterInput_bound);
    if (this.#isFilter) this.value = this.value;
    console.log(this.value);
    this.#textfield.classList.toggle('raise-label', !!this.value);
  }

  onHideEnd() {
    if (this.#isFilter) {
      this.#textfield.suggestion = '';
      this.shadowRoot.querySelector('.surface').classList.remove('filter-no-results');

      if (this.#isAsync) {
        [...this.querySelectorAll('mdw-option')].forEach(o => this.removeChild(o));
        // TODO should i track lastOptionsOnSelect
        this.insertAdjacentHTML('beforeend', this.#lastOptionsOnSelect || this.#initialOptions);
      } else {
        this.#options.reverse().forEach(el => {
          el.classList.remove('filtered');
          el.style.order = '';
        });
      }
    }
  }


  setOptions(options = [{ label: 'label_text', value: 'label_value' }]) {
    if (arguments.length === 0 || !Array.isArray(options)) options = [];

    [...this.querySelectorAll('mdw-option')].forEach(o => this.removeChild(o));
    this.insertAdjacentHTML('beforeend', options.map(option => `<mdw-option value="${option.value}">${option.label}</mdw-option>`).join(''));
  }

  initialOptions() {
    [...this.querySelectorAll('mdw-option')].forEach(o => this.removeChild(o));
    this.insertAdjacentHTML('beforeend', this.#initialOptions);
  }
  


  #setInitialValue() {
    // get value from mdw-option[selected] if no mdw-select[value] exists
    const selected = this.#options.filter(el => el.hasAttribute('selected'));
    if (selected.length !== 0) this.value = selected[0].value;
    else this.value = this.getAttribute('value') ?? '';
  }

  #updateValidity() {
    this.#touched = true;
    this.#internals.setFormValue(this.value);
    this.#textfield.updateValidity();
    this.#internals.setValidity(this.#textfield.validity, this.#textfield.validationMessage, this.#textfield);
  }

  #updateValidityDisplay() {
    this.#textfield.reportValidity();
  }

  // prevent focus on right click
  #rightClick(event) {
    if (event.which !== 3) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  #onInputFocus() {
    // divert focus from input if not filtering is enabled
    if (!this.#isFilter) this.shadowRoot.querySelector('.focus-holder').focus();
    else this.#textfield.addEventListener('input', this.#filterInput_bound, { signal: this.#abort.signal });
    this.show();
  }

  #slotChange() {
    if (this.#isAsync) this.classList.remove('filter-async-active');
    this.#options = [...this.querySelectorAll('mdw-option')];
    this.#options.filter(o => o.value === this.value).forEach(o => o.selected = true);
    if (!this.#initialOptions) this.#initialOptions = this.#options.map(o => o.outerHTML).join('');
  }

  #optionClick(event) {
    if (event.target.nodeName === 'MDW-OPTION') {
      this.#lastOptionsOnSelect = this.#options.map(o => o.outerHTML).join('');
      this.#dirty = true;
      this.value = event.target.value;
      this.#updateValidity();
      this.dispatchEvent(new Event('change', this));
      this.close();
    }
  }

  #filterInput() {
    if (!this.#isAsync) this.#filterInputSync();
    else this.#filterInputAsync();
  }

  #filterInputSync() {
    const terms = this.#textfield.value.trim();
    if (!terms) {
      this.#textfield.suggestion = '';
      this.#options.forEach(el => {
        el.classList.remove('filtered');
        el.style.order = '';
      });
      return;
    }
    
    const filtered = util.fuzzySearch(terms, this.#options.map(element => ({ element, label: element.displayValue.toLowerCase() })));
    this.#options.forEach(el => {
      el.classList.add('filtered');
      el.style.order = '';
    });
    filtered.forEach(({ element }, i) => {
      element.classList.remove('filtered');
      element.style.order = i;
    });

    const hasResults = filtered.length > 0;
    this.shadowRoot.querySelector('.surface').classList.toggle('filter-no-results', !hasResults);

    if (hasResults) {
      const regex = new RegExp(`^${terms}`, 'i');
      if (filtered[0].label.match(regex) === null) {
        this.#textfield.suggestion = '';
      } else {
        this.#textfield.suggestion = filtered[0].label;
      }
    } else {
      this.#textfield.suggestion = '';
    }
  }

  #filterInputAsync() {
    this.classList.add('filter-async-active');
  }
});
