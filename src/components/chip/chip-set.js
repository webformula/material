import HTMLComponentElement from '../HTMLComponentElement.js';
import styles from './chip-set.css' assert { type: 'css' };


customElements.define('mdw-chip-set', class MDWChipSetElement extends HTMLComponentElement {
  static useShadowRoot = true;
  static useTemplate = true;
  static styleSheets = styles;

  #label;
  #input;
  #inputElement;
  #edit;
  #inputFocus_bound = this.#inputFocus.bind(this);
  #inputBlur_bound = this.#inputBlur.bind(this);
  #createChip_bound = this.#createChip.bind(this);

  constructor() {
    super();

    this.render();
    this.#inputElement = this.shadowRoot.querySelector('input');
  }

  static get observedAttributesExtended() {
    return [
      ['label', 'string'],
      ['value', 'string'],
      ['input', 'boolean'],
      ['edit', 'boolean']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  template() {
    return /*html*/`
      <div class="label"></div>
      <slot></slot>
      <input />
    `;
  }

  connectedCallback() {
    if (this.#input) this.#inputElement.addEventListener('focus', this.#inputFocus_bound);
  }

  disconnectedCallback() {
    this.#inputElement.removeEventListener('focus', this.#inputFocus_bound);
  }


  get values() {
    return [...this.querySelectorAll('mdw-chip')].map(chip => chip.valueObject);
  }
  set values(values) {
    const chips = [...this.querySelectorAll('mdw-chip')];
    if (!values || !Array.isArray(values)) {
      chips.forEach(c => c.reset());
    }

    if (this.#input) {
      chips.forEach(c => c.remove());
      values.forEach(obj => this.addChip({
        ...obj,
        type: 'input',
        edit: this.#edit || obj.edit
      }));
    } else {
      values.forEach((obj, i) => {
        let chip;
        if (obj.id) chip = this.querySelector(`mdw-chip[id="${obj.id}"]`);
        else if (obj.name) chip = this.querySelector(`mdw-chip[name="${obj.name}"]`);
        if (chip) chip.valueObject = obj;
        else this.addChip(obj);
      });
    }
  }

  addChip(params = {
    type: 'suggestion',
    edit: false,
    label: '',
    value: '',
    checked: false,
    name: ''
  }) {
    this.insertAdjacentHTML('beforeend', `<mdw-chip ${params.type}${params.edit ? ` edit` : ''}${params.checked ? ` checked` : ''}${params.value !== undefined ? ` value="${params.value}"` : ''}${params.label !== undefined ? ` label="${params.label}"` : ''}></mdw-chip>`);
  }

  get input() { return this.#input; }
  set input(value) { this.#input = !!value; }

  get edit() { return this.#edit; }
  set edit(value) { this.#edit = !!value; }

  get label() { return this.#label; }
  set label(value) {
    this.#label = value;
    const label = this.shadowRoot.querySelector('.label');
    label.innerText = value;
    label.classList.toggle('has-label', !!value);
    if (this.#inputElement) this.#inputElement.ariaLabel = value;
  }

  #inputFocus() {
    this.#inputElement.addEventListener('blur', this.#inputBlur_bound);
    this.#inputElement.addEventListener('keydown', this.#createChip_bound);
  }

  #inputBlur() {
    this.#inputElement.removeEventListener('blur', this.#inputBlur_bound);
    this.#inputElement.removeEventListener('keydown', this.#createChip_bound);
  }

  #createChip(event) {
    if (event.key === 'Backspace' && !this.#inputElement.value) {
      const lastChip = this.querySelector('mdw-chip:last-child');
      if (lastChip) requestAnimationFrame(() => lastChip.focus());
      event.stopPropagation();
      return;
    }
    if (event.key !== 'Enter' || !this.#inputElement.value) return;
    this.insertAdjacentHTML('beforeend', `<mdw-chip input${this.#edit ? ' edit' : ''} value="${this.#inputElement.value}"></mdw-chip>`);
    this.#inputElement.value = '';
    this.dispatchEvent(new Event('change'));
  }
});
