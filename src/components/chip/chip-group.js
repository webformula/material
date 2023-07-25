import HTMLElementExtended from '../HTMLElementExtended.js';

let counter = 0;

customElements.define('mdw-chip-group', class MDWChipGroupElement extends HTMLElementExtended {
  #input;
  #inputFocus_bound = this.#inputFocus.bind(this);
  #inputBlur_bound = this.#inputBlur.bind(this);
  #inputKeydown_bound = this.#inputKeydown.bind(this);


  constructor() {
    super();
  }

  connectedCallback() {
    if (this.classList.contains('mdw-input')) {
      this.#input = document.createElement('input');
      this.#input.id = `chip-input-${counter++}`;
      this.insertAdjacentElement('beforeend', this.#input);
      const label = this.querySelector('label');
      if (label) label.setAttribute('for', this.#input.id);
      this.#input.addEventListener('focus', this.#inputFocus_bound);
    }
  }

  disconnectedCallback() {
    if (this.#input) {
      this.#input.removeEventListener('focus', this.#inputFocus_bound);
      this.#input.removeEventListener('blur', this.#inputBlur_bound);
      this.#input.removeEventListener('keydown', this.#inputKeydown_bound);
    }
  }

  get value() {
    return [...this.querySelectorAll('mdw-chip')]
      .filter(chip => chip.classList.contains('mdw-filter') ? chip.checked : true)
      .map(chip => chip.value)
      .join(',');
  }

  set value(value) {
    const arr = value.split(',');
    [...this.querySelectorAll('mdw-chip.mdw-filter')]
      .forEach(chip => {
        const chipValue = chip.value.split(':')[0];
        const match = arr.find(v => v.split(':')[0] === chipValue);
        if (match) {
          chip.checked = true;
          if (match.includes(':')) chip.value = match.split(':')[1] || '';
        } else chip.checked = false;
      });
  }

  #inputFocus() {
    this.#input.addEventListener('blur', this.#inputBlur_bound);
    this.#input.addEventListener('keydown', this.#inputKeydown_bound);
  }

  #inputBlur() {
    this.#input.removeEventListener('blur', this.#inputBlur_bound);
    this.#input.removeEventListener('keydown', this.#inputKeydown_bound);
    this.#createChip();
  }

  #inputKeydown(event) {
    if (event.key === 'Enter') this.#createChip();
  }

  #createChip() {
    if (this.#input.value.length === 0) return;
    this.#input.insertAdjacentHTML('beforebegin', `<mdw-chip class="mdw-input" value="${this.#input.value}"></mdw-chip>`);
    this.#input.value = '';
    this.dispatchEvent(new Event('change'));
  }
});
