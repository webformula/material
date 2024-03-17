import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './chip.css' assert { type: 'css' };
import {
  check_FILL1_wght400_GRAD0_opsz20,
  close_FILL1_wght400_GRAD0_opsz20
} from '../../core/svgs.js';

const inputValueRegex = /^(.+)<(.+)>$/;

// TODO figure out aria label for chip with check mark

class WFCchipElement extends HTMLComponentElement {
  static tag = 'wfc-chip';
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = styles;

  #abort;
  #label;
  #value;
  #checked;
  #filter;
  #input;
  #edit;
  #inputElement;
  #menu;
  #filterClick_bound = this.#filterClick.bind(this);
  #onFocus_bound = this.#onFocus.bind(this);
  #onBlur_bound = this.#onBlur.bind(this);
  #clearClick_bound = this.#clearClick.bind(this);
  #focusKeydown_bound = this.#focusKeydown.bind(this);
  #menuSelected_bound = this.#menuSelected.bind(this);
  #slotChange_bound = this.#slotChange.bind(this);

  constructor() {
    super();

    this.role = 'button';
    this.tabIndex = 0;
    this.render();
    this.#inputElement = this.shadowRoot.querySelector('input');
  }

  static get observedAttributesExtended() {
    return [
      ['aria-label', 'string'],
      ['label', 'string'],
      ['value', 'string'],
      ['checked', 'boolean'],
      ['filter', 'boolean'],
      ['input', 'boolean'],
      ['edit', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  template() {
    return /*html*/`
      <div class="check">${check_FILL1_wght400_GRAD0_opsz20}</div>
      <slot name="avatar"></slot>
      <slot name="leading-icon"></slot>
      <div class="label"></div>
      <div class="menu-arrow"></div>
      <div class="clear">${close_FILL1_wght400_GRAD0_opsz20}</div>
      <input tabIndex="-1" />
      <wfc-state-layer ripple></wfc-state-layer>
      <slot name="menu"></slot>
    `;
  }

  connectedCallback() {
    this.#abort = new AbortController();
    if (this.#filter) this.addEventListener('click', this.#filterClick_bound, { signal: this.#abort.signal });
    if (this.#input && this.#edit) {
      this.shadowRoot.querySelector('.clear').addEventListener('click', this.#clearClick_bound, { signal: this.#abort.signal });
    }
    this.addEventListener('focus', this.#onFocus_bound, { signal: this.#abort.signal });
    this.shadowRoot.addEventListener('slotchange', this.#slotChange_bound, { signal: this.#abort.signal });
  }

  disconnectedCallback() {
    if (this.#abort) this.#abort.abort();
  }

  get label() { return this.#label; }
  set label(value) {
    this.#label = value;
    this.shadowRoot.querySelector('.label').innerText = value;
    this.ariaLabel = value;
  }

  get value() { return this.#value || this.label; }
  set value(value) {
    if (this.#value === value) return;

    this.#value = value;
    if (!this.label && !this.hasAttribute('label')) {
      this.label = this.#getLabelFromInput(this.#value);
    }
    if (this.#menu) this.#updateMenuSelection();
  }

  get ariaLabel() { return this.#inputElement.ariaLabel; }
  set ariaLabel(value) {
    this.#inputElement.ariaLabel = value;
  }

  get valueObject() {
    return {
      ...(this.hasAttribute('id') && { id: this.getAttribute('id') }),
      ...(this.hasAttribute('name') && { name: this.getAttribute('name') }),
      type: this.type,
      value: this.value,
      label: this.label,
      ...(this.#filter && { checked: !!this.checked })
    };
  }
  set valueObject(value) {
    if (!value || (value.label === undefined && value.value === undefined)) return;
    this.label = value.label !== undefined ? value.label : value.value;
    this.value = value.value !== undefined ? value.value : value.label;
    if (this.#filter && value.checked !== undefined) this.checked = !!value.checked;
  }

  get type() {
    if (this.#input) return 'input';
    if (this.#filter) return 'filter';
    // if (this.#suggestion) return 'suggestion';
    return 'assist';
  }

  get filter() { return this.#filter; }
  set filter(value) { this.#filter = value; }

  get input() { return this.#input; }
  set input(value) { this.#input = value; }

  get edit() { return this.#edit; }
  set edit(value) { this.#edit = value; }

  get checked() { return this.#checked; }
  set checked(value) {
    this.#checked = !!value;
    this.classList.toggle('checked', this.#checked);
    this.setAttribute('aria-checked', this.#checked.toString());
  }

  get #isEdit() { return this.classList.contains('edit-mode'); }


  reset() {
    if (this.#input) this.#clearClick();
    else if (this.#filter) {
      this.value = this.getAttribute('value');
      this.label = this.getAttribute('label');
      this.checked = this.hasAttribute('checked');
    }
  }

  #filterClick(event) {
    if (this.#menu) {
      if (event.target.nodeName === 'WFC-MENU-ITEM') {
        const current = event.target.parentElement.querySelector('.selected');
        if (current) current.classList.remove('selected');
        event.target.classList.add('selected');
        this.label = event.target.label;
        this.value = event.target.value;
        this.checked = true;
      } else {
        return;
      }
    } else {
      this.checked = !this.checked;
    }
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  #menuSelected(event) {
    this.label = event.target.label;
    this.value = event.target.value;
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  #onFocus() {
    if (this.#input && this.#edit) {
      this.#inputElement.value = this.value;
      this.#inputElement.style.width = `${this.#inputElement.scrollWidth}px`;
      this.style.width = `${this.#inputElement.scrollWidth}px`;
      this.#inputElement.setSelectionRange(0, this.value.length);
      this.classList.add('edit-mode');
      this.#inputElement.focus();
    }
    this.addEventListener('blur', this.#onBlur_bound, { signal: this.#abort.signal });
    window.addEventListener('keydown', this.#focusKeydown_bound, { signal: this.#abort.signal });
  }

  #onBlur() {
    if (this.#input && this.#edit) {
      const valueChange = this.value !== this.#inputElement.value;
      this.value = this.#inputElement.value;
      if (this.value) {
        this.label = this.#getLabelFromInput(this.#inputElement.value);
        this.#inputElement.style.width = '';
        this.style.width = '';
        this.classList.remove('edit-mode');
      }
      if (!this.value) this.#clearClick();
      else if (valueChange) this.dispatchEvent(new Event('change', { bubbles: true }));
    }
    this.removeEventListener('blur', this.#onBlur_bound);
    window.removeEventListener('keydown', this.#focusKeydown_bound);
  }

  #clearClick() {
    this.dispatchEvent(new Event('change', { bubbles: true }));
    this.remove();
  }

  #getLabelFromInput(str) {
    const match = str.match(inputValueRegex);
    if (!match) return str;
    return match[1];
  }

  #focusKeydown(event) {
    const space = event.key === 'Space';
    const enter = event.key === 'Enter';
    const escape = event.key === 'Escape';
    const backspace = event.key === 'Backspace' || event.key === 'Delete';
    if (this.#input && this.#edit && this.#isEdit) {
      if (enter || escape) this.blur();
      return;
    }

    if (enter || space) {
      this.click();
      this.shadowRoot.querySelector('wfc-state-layer').triggerRipple();
    } else if (backspace) {
      if (this.#input) {
        event.preventDefault();
        this.#focusNext();
        this.#clearClick();
      }
      if (this.#filter) this.checked = false;
      this.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }


  #focusNext() {
    const next = [...this.parentElement.querySelectorAll('wfc-chip')].reverse().find(e => e !== this);
    if (next) requestAnimationFrame(() => next.focus());
  }

  #slotChange(event) {
    if (event.target.getAttribute('name') === 'menu') {
      this.#menu = [...event.target.assignedElements()][0];
      if (this.#menu) {
        this.#menu.anchorElement = this;
        this.#menu.overlap = false;
        if (this.parentElement.nodeName === 'WFC-SEARCH') {
          this.#menu.fixedAfter = true;
          this.#menu.position = 'top center';
        } else {
          this.#menu.position = 'top left';
        }
        this.classList.add('menu');
        this.#menu.addEventListener('selected', this.#menuSelected_bound, { signal: this.#abort.signal });
        this.#updateMenuSelection();
      }
    }
  }

  #updateMenuSelection() {
    const current = this.#menu.querySelector('wfc-menu-item.selected');
    if (current) {
      current.classList.remove('selected');
      this.#checked = false;
      this.classList.remove('checked');
    }

    const toSelect = this.value && [...this.#menu.querySelectorAll('wfc-menu-item')].find(e => e.value === this.value);
    if (toSelect) {
      toSelect.classList.add('selected');
      if (!this.label || this.label === this.value) this.label = toSelect.label;
      this.#checked = true;
      this.classList.add('checked');
    }
  }
}
customElements.define(WFCchipElement.tag, WFCchipElement);
