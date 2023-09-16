import HTMLElementExtended from '../HTMLElementExtended.js';
import styles from './chip.css' assert { type: 'css' };
import Ripple from '../../core/Ripple.js';
import util from '../../core/util.js';
import {
  check_FILL1_wght400_GRAD0_opsz20,
  close_FILL1_wght400_GRAD0_opsz20
} from '../../core/svgs.js';


customElements.define('mdw-chip', class MDWChipElement extends HTMLElementExtended {
  static styleSheets = styles;
  static useShadowRoot = true;
  static useTemplate = false;
  
  #inputValueRegex = /^(.+)<(.+)>$/;
  #type;
  #value = this.getAttribute('value') || '';
  #menuItemValue = '';
  #checked = false;
  #group;
  #ripple;
  #input;
  #inputValueDisplay;
  #hasMenu = false;
  #originalText;
  #abort = new AbortController();
  #onClick_bound = this.#click.bind(this);
  #focus_bound = this.#focus.bind(this);
  #blur_bound = this.#blur.bind(this);
  #menuOpen_bound = this.#menuOpen.bind(this);
  #menuClose_bound = this.#menuClose.bind(this);
  #menuChange_bound = this.#menuChange.bind(this);
  #focusKeydown_bound = this.#focusKeydown.bind(this);
  #clearClick_bound = this.#clearClick.bind(this);
  #onInput_bound = this.#onInput.bind(this);
  #inputBlur_bound = this.#inputBlur.bind(this);
  #inputKeydown_bound = this.#inputKeydown.bind(this);


  constructor() {
    super();
  }

  connectedCallback() {
    this.tabIndex = 0;
    this.#group = this.parentElement;
    this.#hasMenu = this.querySelector('mdw-menu');
    this.#type = this.#getType();

    if (this.#hasMenu) {
      this.#originalText = util.getTextFromNode(this);
      const selectedValue = this.getAttribute('selected');
      if (selectedValue) {
        const target = this.querySelector(`mdw-menu mdw-button[value="${selectedValue}"]`);
        if (target) {
          this.checked = true;
          this.#menuChange({ target }, false);
        }
      }
      this.insertAdjacentHTML('beforeend', '<div class="mdw-select-arrow"></div>');
      this.querySelector('mdw-menu').addEventListener('open', this.#menuOpen_bound, { signal: this.#abort.signal });
    }

    if (this.hasAttribute('checked')) this.checked = true;
    util.addClickTimeout(this, this.#onClick_bound);
    this.addEventListener('focus', this.#focus_bound, { signal: this.#abort.signal });
    if (!this.hasAttribute('aria-label')) {
      this.setAttribute('aria-label', this.value);
    }
  }

  disconnectedCallback() {
    this.#abort.abort();
    util.removeClickTimeout(this, this.#onClick_bound);
    if (this.#ripple) this.#ripple.destroy();
  }

  afterRender() {
    this.#ripple = new Ripple({
      element: this.shadowRoot.querySelector('.ripple'),
      triggerElement: this,
      ignoreElements: [this.querySelector('mdw-menu')]
    });

    if (this.#type === 'input') {
      this.#inputValueDisplay = this.shadowRoot.querySelector('.value-display');
      this.shadowRoot.querySelector('.clear').addEventListener('click', this.#clearClick_bound, { signal: this.#abort.signal });
      this.#input = this.shadowRoot.querySelector('input');
    }
  }

  get value() {
    if (this.#type === 'filter' && this.#hasMenu) {
      return `${this.#value}:${this.querySelector('mdw-menu mdw-button[checked]')?.getAttribute('value') || ''}`;
    }
    return this.#value;
  }
  set value(value) {
    if (this.#type === 'filter' && this.#hasMenu) {
      let target = this.querySelector(`mdw-menu mdw-button[value="${value}"]`);
      if (!target) target = this.querySelector('mdw-menu mdw-button[checked]');
      if (target) this.#menuChange({ target }, false);
    }
  }

  get checked() {
    return this.#checked;
  }
  set checked(value) {
    this.#checked = !!value;
    this.classList.toggle('mdw-checked', this.#checked);
    this.setAttribute('aria-checked', this.#checked.toString());
  }

  template() {
    return /*html*/`
      ${this.#type === 'filter' ? `<div class="check">${check_FILL1_wght400_GRAD0_opsz20}</div>` : ''}
      <slot></slot>
      ${this.#type === 'input' ? /*html*/`
        <input value="${this.#value}">
        <span class="value-display">${this.#getInputDisplayValue(this.#value)}</span>
        <div class="clear">${close_FILL1_wght400_GRAD0_opsz20}</div>
      ` : ''}
      <div class="ripple"></div>
    `;
  }

  #getType() {
    if (this.classList.contains('mdw-input')) return 'input';
    if (this.classList.contains('mdw-filter')) {
      if (this.#hasMenu) this.setAttribute('role', 'button');
      else {
        this.setAttribute('role', 'checkbox');
        this.setAttribute('aria-checked', 'false');
      }
      return 'filter';
    }
    if (this.classList.contains('mdw-suggestion')) {
      this.setAttribute('role', 'button');
      return 'suggestion';
    }
    return 'assist';
  }

  #click() {
    if (this.#type === 'filter' && !this.#hasMenu) {
      this.checked = !this.checked;
      this.#group.dispatchEvent(new Event('change'));
    }

    if (this.#type === 'input') {
      this.classList.add('mdw-edit');
      this.#onInput();
      this.#input.focus();
      this.#input.select();
      this.#input.addEventListener('input', this.#onInput_bound, { signal: this.#abort.signal });
      this.#input.addEventListener('blur', this.#inputBlur_bound, { signal: this.#abort.signal });
      document.body.addEventListener('keydown', this.#inputKeydown_bound, { signal: this.#abort.signal });
    }
    this.blur();
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
          this.#input.addEventListener('blur', this.#inputBlur_bound, { signal: this.#abort.signal });
          document.body.addEventListener('keydown', this.#inputKeydown_bound, { signal: this.#abort.signal });
        });
      }

      if (this.#type === 'filter' && !this.#hasMenu && this.checked === false) {
        this.#click();
      }

      if (this.#type === 'filter' && this.#hasMenu) {
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

  #menuOpen() {
    this.classList.add('mdw-open');
    this.querySelector('mdw-menu').addEventListener('close', this.#menuClose_bound, { signal: this.#abort.signal });
    this.querySelector('mdw-menu').addEventListener('selected', this.#menuChange_bound, { signal: this.#abort.signal });
  }

  #menuClose() {
    this.classList.remove('mdw-open');
    this.querySelector('mdw-menu').removeEventListener('close', this.#menuClose_bound, { signal: this.#abort.signal });
    this.querySelector('mdw-menu').removeEventListener('selected', this.#menuChange_bound, { signal: this.#abort.signal });
  }

  #menuChange(event, dispatchEvent = true) {
    const value = event.target.getAttribute('value');
    const text = util.getTextFromNode(event.target);
    const currentText = util.getTextFromNode(this);
    const textNode = [...this.childNodes].find(node => node.nodeType === 3 && node.nodeValue.trim() === currentText);
    const selected = this.querySelector('mdw-menu mdw-button[checked]');
    if (selected) selected.removeAttribute('checked');
    if (this.#menuItemValue !== value) {
      this.checked = true;
      this.#menuItemValue = value;
      textNode.nodeValue = text;
      event.target.setAttribute('checked', '');
    } else {
      this.#menuItemValue = '';
      this.checked = false;
      textNode.nodeValue = this.#originalText;
    }
    if (dispatchEvent) this.#group.dispatchEvent(new Event('change'));
  }

  #getInputDisplayValue(str) {
    const match = str.match(this.#inputValueRegex);
    if (!match) return str;
    return match[1];
  }

  #clearClick(event) {
    this.remove();
    event.stopPropagation();
    this.#group.dispatchEvent(new Event('change'));
  }

  #onInput() {
    const width = util.getTextWidthFromInput(this.#input);
    this.#input.style.width = `${width}px`;
  }

  #inputBlur() {
    this.#value = this.#input.value;
    this.#inputValueDisplay.innerText = this.#getInputDisplayValue(this.#input.value);
    this.classList.remove('mdw-edit');
    this.#input.removeEventListener('input', this.#onInput_bound);
    this.#input.removeEventListener('blur', this.#inputBlur_bound);
    document.body.removeEventListener('keydown', this.#inputKeydown_bound);
    this.#group.dispatchEvent(new Event('change'));
  }

  #inputKeydown(event) {
    if (event.key === 'Enter') this.#input.blur();
  }
});
