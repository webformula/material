import HTMLElementExtended from '../HTMLElementExtended.js';
import Ripple from '../../core/Ripple.js';
import util from '../../core/util.js';
import {
  check_FILL1_wght400_GRAD0_opsz20,
  close_FILL1_wght400_GRAD0_opsz20
} from '../../core/svgs.js';
import { chipShadowRoot } from '../../styles.js';

// TODO labels (initial label, action label, remove label, ...)

customElements.define('mdw-chip', class MDWChipElement extends HTMLElementExtended {
  useShadowRoot = true;
  useTemplate = false;
  static styleSheets = chipShadowRoot;

  #type;
  #value = '';
  #checked = false;
  #ripple;
  #input;
  #valueDisplay;
  #originalLabel;
  #currentLabel;
  #group;
  #menuValue = '';
  #hasMenu;
  #onClick_bound = this.#onClick.bind(this);
  #onClearClick_bound = this.#onClearClick.bind(this);
  #onInput_bound = this.#onInput.bind(this);
  #onInputBlur_bound = this.#onInputBlur.bind(this);
  #onKeydown_bound = this.#onKeydown.bind(this);
  #menuOpen_bound = this.#menuOpen.bind(this);
  #menuClose_bound = this.#menuClose.bind(this);
  #abort = new AbortController();
  #focus_bound = this.#focus.bind(this);
  #blur_bound = this.#blur.bind(this);
  #focusKeydown_bound = this.#focusKeydown.bind(this);
  #menuChange_bound = this.#menuChange.bind(this);


  constructor() {
    super();
  }
  
  connectedCallback() {
    this.tabIndex = 0;
    this.#group = this.parentElement;
    this.#hasMenu = this.querySelector('mdw-menu');
    this.#menuValue = this.getAttribute('menu');
    this.#type = this.#getType();

    this.addEventListener('focus', this.#focus_bound, { signal: this.#abort.signal });

    if (this.querySelector('mdw-menu')) {
      this.#originalLabel = util.getTextFromNode(this);
      this.#currentLabel = this.#originalLabel;
    }
  }

  afterRender() {
    if (this.#hasMenu) {
      this.insertAdjacentHTML('beforeend', '<div class="mdw-select-arrow"></div>');
      this.querySelector('mdw-menu').addEventListener('open', this.#menuOpen_bound, { signal: this.#abort.signal });
      this.querySelector('mdw-menu').addEventListener('close', this.#menuClose_bound, { signal: this.#abort.signal });
    }
    util.addClickTimeout(this, this.#onClick_bound);

    if (this.#type === 'input') {
      this.#valueDisplay = this.shadowRoot.querySelector('.value-display');
      this.shadowRoot.querySelector('.clear').addEventListener('click', this.#onClearClick_bound, { signal: this.#abort.signal });
      this.#input = this.shadowRoot.querySelector('input');
    }
    this.#ripple = new Ripple({
      element: this.shadowRoot.querySelector('.ripple'),
      triggerElement: this,
      ignoreElements: [this.querySelector('mdw-menu')]
    });
  }

  disconnectedCallback() {
    this.#abort.abort();
    util.removeClickTimeout(this, this.#onClick_bound);
    this.#ripple.destroy();
  }

  static get observedAttributes() {
    return ['value', 'checked'];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === 'checked') this.checked = newValue !== null;
    else this[name] = newValue;
  }

  get value() {
    if (this.#menuValue) return `${this.#menuValue}:${this.#value}`;  
    return this.#value;
  }
  set value(value) {
    if (this.#menuValue) {
      this.#value = value.replace(`${this.#menuValue}:`, '');
      const current = this.querySelector(`mdw-button[checked]`);
      if (current) current.removeAttribute('checked');
      const next = this.querySelector(`mdw-button[value="${this.#value}"]`);
      if (next) next.setAttribute('checked', '');
    } else this.#value = value;

    if (this.#type === 'input') {
      if (this.#value === '') this.remove();
    }
  }

  get checked() {
    return this.#checked;
  }
  set checked(value) {
    this.#checked = !!value;
    this.toggleAttribute('checked', this.#checked);
  }

  template() {
    return /*html*/`
      ${this.#type === 'filter' || this.#type === 'filter-menu' ? `<div class="check">${check_FILL1_wght400_GRAD0_opsz20}</div>` : ''}
      <slot></slot>
      ${this.#type === 'input' ? /*html*/`
        <input value="${this.value}">
        <span class="value-display">${this.value}</span>
        <div class="clear">${close_FILL1_wght400_GRAD0_opsz20}</div>
      ` : ''}
      <span class="spinner"></span>
      <div class="ripple"></div>
    `;
  }

  #menuOpen() {
    this.classList.add('mdw-open');
    this.querySelector('mdw-menu').addEventListener('selected', this.#menuChange_bound);
  }
  #menuClose() {
    this.classList.remove('mdw-open');
    this.querySelector('mdw-menu').removeEventListener('selected', this.#menuChange_bound);
    const selected = this.querySelector('mdw-menu mdw-button[checked]');
    const labelNode = [...this.childNodes].find(node => node.nodeType === 3 && node.nodeValue.trim() === this.#currentLabel);
    if (selected) {
      const nextLabel = util.getTextFromNode(selected);
      labelNode.nodeValue = nextLabel;
      this.#currentLabel = nextLabel;
    } else {
      labelNode.nodeValue = this.#originalLabel;
      this.#currentLabel = this.#originalLabel;
    }
  }

  #menuChange(event) {
    const value = event.target.getAttribute('value');
    if (this.#value !== value) {
      this.checked = true;
      this.value = value;
    } else {
      this.value = '';
      this.checked = false;
    }
    this.#group.dispatchEvent(new Event('change'));
  }

  #onClick() {
    if (this.#type === 'filter') {
      this.checked = !this.checked;
      this.#group.dispatchEvent(new Event('change'));
    }

    if (this.#type === 'suggestion') {
      this.#group.value = this.value;
      this.#group.dispatchEvent(new Event('change'));
    }

    if (this.#type === 'input') {
      this.classList.add('mdw-edit');
      this.#onInput();
      this.#input.focus();
      this.#input.select();
      this.#input.addEventListener('input', this.#onInput_bound, { signal: this.#abort.signal });
      this.#input.addEventListener('blur', this.#onInputBlur_bound, { signal: this.#abort.signal });
      document.body.addEventListener('keydown', this.#onKeydown_bound, { signal: this.#abort.signal });
    }
  }

  #onClearClick(event) {
    this.remove();
    event.stopPropagation();
    this.#group.dispatchEvent(new Event('change'));
  }

  #getType() {
    const group = this.#group;
    if (group.classList.contains('mdw-input')) {
      this.classList.add('mdw-input');
      return 'input';
    }
    if (group.classList.contains('mdw-filter') && this.#hasMenu) {
      this.classList.add('mdw-filter-menu');
      this.setAttribute('role', 'button');
      return 'filter-menu';
    }

    if (group.classList.contains('mdw-filter')) {
      this.classList.add('mdw-filter');
      this.setAttribute('role', 'checkbox');
      return 'filter';
    }
    if (group.classList.contains('mdw-suggestion')) {
      this.classList.add('mdw-suggestion');
      this.setAttribute('role', 'button');
      return 'suggestion';
    }
    this.classList.add('mdw-assist');
    return 'assist';
  }

  #onInput() {
    const width = util.getTextWidthFromInput(this.#input);
    this.#input.style.width = `${width + 20}px`;
  }

  #onInputBlur() {
    this.#value = this.#input.value;
    this.#valueDisplay.innerText = this.#input.value;
    this.classList.remove('mdw-edit');
    this.#input.removeEventListener('input', this.#onInput_bound);
    this.#input.removeEventListener('blur', this.#onInputBlur_bound);
    document.body.removeEventListener('keydown', this.#onKeydown_bound);
    this.#group.dispatchEvent(new Event('change'));
  }

  #onKeydown(event) {
    if (event.key === 'Enter') this.#input.blur();
  }

  #focus() {
    this.addEventListener('blur', this.#blur_bound, { signal: this.#abort.signal });
    this.addEventListener('keydown', this.#focusKeydown_bound, { signal: this.#abort.signal });
  }

  #blur() {
    this.removeEventListener('blur', this.#blur_bound, { signal: this.#abort.signal });
    this.removeEventListener('keydown', this.#focusKeydown_bound, { signal: this.#abort.signal });
  }

  #focusKeydown(e) {
    if (e.code === 'Enter' || e.code === 'Space') {
      if (this.#type === 'input') {
        if (this.classList.contains('mdw-edit')) return;

        this.classList.add('mdw-edit');
        this.#onInput();
        this.#input.focus();
        this.#input.select();
        setTimeout(() => {
          this.#input.addEventListener('input', this.#onInput_bound, { signal: this.#abort.signal });
          this.#input.addEventListener('blur', this.#onInputBlur_bound, { signal: this.#abort.signal });
          document.body.addEventListener('keydown', this.#onKeydown_bound, { signal: this.#abort.signal });
        });
      }

      if (this.#type === 'filter' && this.checked === false) {
        this.checked = true;
        this.#group.dispatchEvent(new Event('change'));
      }

      if (this.#type === 'filter-menu') {
        this.click();
      }
      e.preventDefault();
    }

    if (e.code === 'Backspace' || e.code === 'Delete') {
      if (this.#type === 'input') return;
      if (this.#type === 'filter' && this.checked === true) {
        this.checked = false;
        this.#group.dispatchEvent(new Event('change'));
      }
      e.preventDefault();
    }
  }
});
