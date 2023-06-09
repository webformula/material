import HTMLElementExtended from '../HTMLElementExtended.js';
import sheet from './select.css' assert { type: 'css' };
import sheetTextField from '../textfield/global.css' assert { type: 'css' };
import sheetPanel from '../panel/global.css' assert { type: 'css' };
import util from '../../core/util.js';

// TODO document required and supporting-text
//   <mdw-select name="select" label="Label" required supporting-text>
//   <mdw-select name="select" label="Label" required supporting-text="message">

customElements.define('mdw-select', class MDWSelectElement extends HTMLElementExtended {
  useShadowRoot = true;
  useTemplate = false;
  static styleSheets = [sheet, sheetTextField, sheetPanel];

  #value = '';
  #displayValue = '';
  #label = this.getAttribute('label');
  #disabled = this.hasAttribute('disabled');
  #required = this.hasAttribute('required');
  #supportingText = this.getAttribute('supporting-text');
  #panel;
  #textfield;
  #input;
  #arrowElement;
  #options = [];
  #isFilter = this.classList.contains('mdw-filter');
  #isFilterAsync = this.classList.contains('mdw-filter-async');
  #onOpen_bound = this.#onOpen.bind(this);
  #onClose_bound = this.#onClose.bind(this);
  #onInputFocus_bound = this.#onInputFocus.bind(this);
  #onInputBlur_bound = this.#onInputBlur.bind(this);
  #onClick_bound = this.#onClick.bind(this);
  #onKeydown_bound = this.#onKeydown.bind(this);
  #onInputFilter_debounce = util.debounce(this.#onInputFilter, 300).bind(this);
  #onInputFilterAsync_bound = this.#onInputFilterAsync.bind(this);
  #filterAsyncEvent_debounced = util.debounce(this.#filterAsyncEvent, 300).bind(this);
  #originalOptions;
  #abort = new AbortController();
  #textSearchOver_debounced = util.debounce(this.#textSearchOver, 240);
  #searchKeys = '';


  constructor() {
    super();

    this.clickOutsideToClose = true;
  }

  connectedCallback() {
    // it seems the shadow root is breaking this role
    // this.setAttribute('role', 'select');

    // grab initial options
    this.#options = [...this.querySelectorAll('mdw-option')].map(element => ({
      label: util.getTextFromNode(element),
      element
    }));
    this.#originalOptions = this.#options;
  }

  afterRender() {
    this.#arrowElement = this.shadowRoot.querySelector('.mdw-select-arrow');
    this.#textfield = this.shadowRoot.querySelector('mdw-textfield');
    this.#input = this.shadowRoot.querySelector('input');
    this.#panel = this.shadowRoot.querySelector('mdw-panel');
    this.#panel.target = this;
    this.#panel.animation = 'expand';
    this.#panel.addClickOutsideCloseIgnore(this);
    // this.#panel.addClickOutsideCloseIgnore(this.#textfield);
    this.#setWidth();

    // makes the input not usable, only clickable. Create normal select
    if (!this.#isFilter && !this.#isFilterAsync) {
      this.#textfield.classList.add('mdw-select-no-filter');
      // this.#input.setAttribute('readonly', '');
      this.#panel.positionOverlap = true;
    }

    if (this.#isFilterAsync) {
      this.insertAdjacentHTML('afterbegin', '<mdw-progress-linear class="mdw-indeterminate"></mdw-progress-linear>');
    }

    this.#textfield.addEventListener('click', this.#onInputFocus_bound, { signal: this.#abort.signal });
    this.#input.addEventListener('focus', this.#onInputFocus_bound, { signal: this.#abort.signal });
    this.#panel.addEventListener('open', this.#onOpen_bound, { signal: this.#abort.signal });
    this.#panel.addEventListener('close', this.#onClose_bound, { signal: this.#abort.signal });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#abort.abort();

    this.#originalOptions = undefined;
    this.#options = undefined;
  }

  template() {
    return /*html*/`
      <mdw-textfield ${!this.#disabled ? '' : 'disabled'} ${!this.classList.contains('mdw-outlined') ? '' : 'class="mdw-outlined"'}>
        <input value="${this.#displayValue}" ${!this.#required ? '' : 'required'}>
        ${!this.#label ? '' : `<label>${this.#label}</label>`}
        <div class="mdw-select-arrow"></div>
        ${this.hasAttribute('supporting-text') ? `<div class="mdw-supporting-text">${this.#supportingText}</div>` : ''}
        <mdw-panel class="mdw-option-group" role="listbox" aria-label="${this.#label}">
          <slot></slot>
        </mdw-panel>
      </mdw-textfield>
    `;
  }

  static get observedAttributes() {
    return ['value', 'disabled'];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === 'disabled') {
      this.#disabled = newValue !== null;
      if (this.#textfield) this.#textfield.toggleAttribute('disabled', this.#disabled);
    } else this[name] = newValue;
  }

  get value() {
    return this.#value;
  }
  set value(value) {
    this.#value = value;
    this.#displayValue = value;

    const element = this.querySelector(`mdw-option[value="${value}"]`);
    if (element) this.#displayValue = util.getTextFromNode(element);
    if (this.#input) {
      this.#input.value = this.#displayValue;
      if (this.#input.parentElement.classList.contains('mdw-outlined')) this.#input.parentElement.updateNotch();
    }
    if (this.#panel && this.#panel.open === true) this.#updateOptionDisplay();
  }

  get display() {
    return this.#input.value;
  }

  get disabled() {
    return this.#disabled;
  }
  set disabled(value) {
    this.toggleAttribute('disabled', !!value);
  }

  get options() {
    return this.querySelectorAll('mdw-option');
  }

  set optionValues(values) {
    if (!Array.isArray(values) || values.length === 0) {
      this.#options = [];
    } else {
      this.#options = values.map(v => {
        const element = document.createElement('mdw-option');
        element.setAttribute('value', v.value);
        element.innerText = v.label;

        return {
          label: v.label,
          element
        };
      });
    }
    this.#renderOptions();
  }

  // remove progress bar. This automatically called after optionValues are set
  resolveFilter() {
    this.classList.remove('mdw-filter-async-active');
  }

  reportValidity() {
    return this.#input.reportValidity();
  }

  checkValidity() {
    return this.#input.checkValidity();
  }


  #onInputFocus(event) {
    // prevent input rom being typed in and autocomplete
    if (!this.#isFilter && !this.#isFilterAsync) this.#input.setAttribute('readonly', '');

    if (event.type === 'click') return this.#panel.show();

    // if focused via tab then the user needs to press down to open
    document.body.addEventListener('keydown', this.#onKeydown_bound, { signal: this.#abort.signal });
    event.target.addEventListener('blur', this.#onInputBlur_bound, { signal: this.#abort.signal });
  }

  #onInputBlur(event) {
    // enable input validation
    if (!this.#isFilter && !this.#isFilterAsync) this.#input.removeAttribute('readonly');
    if (!this.#panel.open) document.body.removeEventListener('keydown', this.#onKeydown_bound, { signal: this.#abort.signal });
    event.target.removeEventListener('blur', this.#onInputBlur_bound, { signal: this.#abort.signal });
  }

  // set the min width of the select to the input width
  async #setWidth() {
    this.#panel.style.minWidth = `${this.offsetWidth}px`;

    // fonts can cause input widths to change
    await document.fonts.ready;
    this.#panel.style.minWidth = `${this.offsetWidth}px`;
  }

  #onOpen() {
    this.#textfield.classList.add('mdw-raise-label');
    if (!this.#isFilter) this.#updateOptionDisplay();

    this.#arrowElement.classList.add('mdw-open');
    this.addEventListener('click', this.#onClick_bound, { signal: this.#abort.signal });
    document.body.addEventListener('keydown', this.#onKeydown_bound, { signal: this.#abort.signal });
    if (this.#isFilter) this.#input.addEventListener('input', this.#onInputFilter_debounce, { signal: this.#abort.signal });
    if (this.#isFilterAsync) this.#input.addEventListener('input', this.#onInputFilterAsync_bound, { signal: this.#abort.signal });

    this.options.forEach(e => e.tabindex = 0);
  }

  async #onClose() {
    this.options.forEach(e => e.tabindex = -1);

    this.#textfield.classList.remove('mdw-raise-label');
    this.#arrowElement.classList.remove('mdw-open');
    this.removeEventListener('click', this.#onClick_bound);
    document.body.removeEventListener('keydown', this.#onKeydown_bound);
    if (this.#isFilter) this.#input.removeEventListener('input', this.#onInputFilter_debounce);
    if (this.#isFilterAsync) this.#input.removeEventListener('input', this.#onInputFilterAsync_bound);

    // reset value if not changed
    this.#input.value = this.#displayValue;

    if (this.#isFilter || this.#isFilterAsync) {
      await util.animationendAsync(this.#panel);
      this.#renderInitialOptions();
    }
  }

  #onClick(event) {
    if (event.target.nodeName === 'MDW-OPTION') {
      this.#selectOption(event.target);
      this.#panel.close();
    }
  }

  #selectOption(optionElement) {
    this.value = optionElement.value;

    // clear any autocomplete text
    this.#textfield.autocomplete = '';

    // update validity style
    if (!this.#textfield.classList.contains('mdw-invalid') !== this.#input.checkValidity()) {
      this.#input.reportValidity();
    }
    
    this.dispatchEvent(new Event('change', this));
  }

  #updateOptionDisplay() {
    const currentSelected = this.querySelector('mdw-option[selected]')
    if (currentSelected) {
      currentSelected.removeAttribute('selected');
      currentSelected.removeAttribute('aria-selected');
    }

    const nextSelected = this.querySelector(`mdw-option[value="${this.#value}"]`);
    if (nextSelected) {
      nextSelected.setAttribute('selected', '');
      nextSelected.setAttribute('aria-selected', 'true');
      nextSelected.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (this.#panel.scrollTop < 56) this.#panel.scrollTop = 0;
    }
  }

  #onKeydown(event) {
    const { key, shiftKey } = event;
    const escape = key === 'Escape';
    const tab = key === 'Tab';
    const enter = key === 'Enter';
    const downArrow = key === 'ArrowDown';
    const upArrow = key === 'ArrowUp';

    if (!this.#panel.open) {
      if (downArrow || upArrow || enter) this.#panel.show();
      else return;
    }


    if (escape && this.clickOutsideToClose === true) this.#panel.close();

    else if ((tab && !shiftKey) || downArrow) {
      this.#focusNext();
      event.preventDefault();
    } else if ((tab && shiftKey) || upArrow) {
      this.#focusPrevious();
      event.preventDefault();
    }

    else if (enter) {
      const focusedElement = document.activeElement;
      if (focusedElement.nodeName === 'INPUT') {
        const firstOption = this.querySelector('mdw-option');
        firstOption.click();
        this.#panel.close();
      }

      if (focusedElement.nodeName === 'MDW-OPTION') {
        event.target.click();
        this.#panel.close();
      }
    }

    else if (!this.#isFilter && ![38, 40, 13].includes(event.keyCode)) return this.#textSearch(event.key);
  }

  #focusNext() {
    const focusedElement = document.activeElement;
    const selected = this.querySelector('mdw-option[selected]');
    let nextFocus;

    // if no focus on options then try focusing on element after selected
    if (!focusedElement || focusedElement.nodeName !== 'MDW-OPTION') {
      if (selected) nextFocus = selected.nextElementSibling;
    }

    // try next sibling
    if (focusedElement && focusedElement.nodeName === 'MDW-OPTION' && !nextFocus) nextFocus = focusedElement.nextElementSibling;
    if (!nextFocus) nextFocus = this.querySelector('mdw-option'); // first
    if (nextFocus) nextFocus.focus();
  }

  #focusPrevious() {
    const focusedElement = document.activeElement;
    const selected = this.querySelector('mdw-option[selected]');
    let nextFocus;

    // if no focus on options then try focusing on element after selected
    if (!focusedElement || focusedElement.nodeName !== 'MDW-OPTION') {
      if (selected) nextFocus = selected.previousElementSibling;
    }

    // try next sibling
    if (focusedElement && focusedElement.nodeName === 'MDW-OPTION' && !nextFocus) nextFocus = focusedElement.previousElementSibling;
    if (!nextFocus) nextFocus = this.querySelector('mdw-option:last-of-type'); // last
    if (nextFocus) nextFocus.focus();
  }

  #onInputFilter() {
    const terms = this.#input.value.trim();
    if (!terms) return this.#renderOptions();

    const filtered = util.fuzzySearch(terms, this.#options);
    const fragment = new DocumentFragment();
    for (const item of filtered) {
      fragment.append(item.element);
    }
    this.replaceChildren(fragment);

    if (filtered.length > 0) {
      const regex = new RegExp(`^${terms}`, 'i');
      if (filtered[0].label.match(regex) === null) {
        this.#textfield.autocomplete = '';
      } else {
        this.#textfield.autocomplete = filtered[0].label;
      }
    } else {
      this.#textfield.autocomplete = '';
    }
  }


  #renderOptions() {
    const fragment = new DocumentFragment();
    for (const item of this.#options) {
      fragment.append(item.element);
    }
    this.replaceChildren(fragment);
    if (this.#isFilterAsync) {
      this.insertAdjacentHTML('afterbegin', '<mdw-progress-linear class="mdw-indeterminate"></mdw-progress-linear>');
    }
    if (this.#options.length === 0) this.insertAdjacentHTML('beforeend', '<div class="mdw-no-items">No items</div> ');
    this.#updateOptionDisplay();
    this.resolveFilter();
  }

  #renderInitialOptions() {
    const fragment = new DocumentFragment();
    for (const item of this.#originalOptions) {
      fragment.append(item.element);
    }
    this.replaceChildren(fragment);
    if (this.#isFilterAsync) {
      this.insertAdjacentHTML('afterbegin', '<mdw-progress-linear class="mdw-indeterminate"></mdw-progress-linear>');
    }
    if (this.#originalOptions.length === 0) this.insertAdjacentHTML('beforeend', '<div class="mdw-no-items">No items</div> ');
  }

  #onInputFilterAsync() {
    const terms = this.#input.value.trim();
    if (!terms) return this.#renderOptions();
    this.classList.add('mdw-filter-async-active');
    this.#filterAsyncEvent_debounced();
  }

  #filterAsyncEvent() {
    this.dispatchEvent(new Event('filter', this));
  }

  // focus on element that starts with typed characters
  #textSearch(key) {
    this.#searchKeys += key.toLowerCase();
    const match = this.#options.find(({ label }) => label.toLowerCase().startsWith(this.#searchKeys));
    if (match) match.element.focus();
    this.#textSearchOver_debounced();
  }

  #textSearchOver() {
    this.#searchKeys = '';
  }
});
