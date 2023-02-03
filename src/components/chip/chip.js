import HTMLElementExtended from '../HTMLElementExtended.js';
import styleAsString from '!!raw-loader!./chip.css';
import Ripple from '../../core/Ripple.js';
import util from '../../core/util.js';
import checkIconSVGRaw from '../../svg-icons/check_FILL1_wght400_GRAD0_opsz20.svg';
import closeIconSVGRaw from '../../svg-icons/close_FILL1_wght400_GRAD0_opsz20.svg';


customElements.define('mdw-chip', class MDWChipElement extends HTMLElementExtended {
  useShadowRoot = true;
  useTemplate = false;

  #type;
  #value = '';
  #checked = false;
  #ripple;
  #input;
  #valueDisplay;
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


  constructor() {
    super();
  }
  
  connectedCallback() {
    this.#group = this.parentElement;
    this.#hasMenu = this.querySelector('mdw-menu');
    this.#menuValue = this.getAttribute('menu');
    if (this.#hasMenu) {
      this.insertAdjacentHTML('beforeend', '<div class="mdw-select-arrow"></div>');
      this.querySelector('mdw-menu').addEventListener('open', this.#menuOpen_bound, { signal: this.#abort.signal });
      this.querySelector('mdw-menu').addEventListener('close', this.#menuClose_bound, { signal: this.#abort.signal });
    }
    this.#type = this.#getType();
    util.addClickTimeout(this, this.#onClick_bound);
  }

  afterRender() {
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
      ${this.#type === 'filter' || this.#type === 'filter-menu' ? `<div class="check">${checkIconSVGRaw}</div>` : ''}
      <slot></slot>
      ${this.#type === 'input' ? /*html*/`
        <input value="${this.value}">
        <span class="value-display">${this.value}</span>
        <div class="clear">${closeIconSVGRaw}</div>
      ` : ''}
      <span class="spinner"></span>
      <div class="ripple"></div>
      <style>${styleAsString}</style>
    `;
  }

  #menuOpen() {
    this.classList.add('mdw-open');
  }
  #menuClose() {
    this.classList.remove('mdw-open');
  }

  #onClick(event) {
    if (this.#type === 'filter-menu') {
      if (event.target.nodeName === 'MDW-BUTTON') {
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
    }

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
      return 'filter-menu';
    }

    if (group.classList.contains('mdw-filter')) {
      this.classList.add('mdw-filter');
      return 'filter';
    }
    if (group.classList.contains('mdw-suggestion')) {
      this.classList.add('mdw-suggestion');
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
});
