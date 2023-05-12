import HTMLElementExtended from '../HTMLElementExtended.js';
import util from '../../core/util.js';
import styles from './segmented-button-group.css' assert { type: 'css' };
HTMLElementExtended.registerGlobalStyleSheet(styles);


customElements.define('mdw-segmented-button-group', class MDWSegmentedButtonGroupElement extends HTMLElementExtended {
  #multiSelect = this.classList.contains('mdw-multi-select');
  #onclick_bound = this.#onclick.bind(this);
  #value = '';

  constructor() {
    super();
  }

  connectedCallback() {
    this.setAttribute('role', 'radiogroup');
    this.addEventListener('click', this.#onclick_bound);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#onclick_bound);
  }

  static get observedAttributes() {
    return ['value'];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    this[name] = newValue;
  }

  get value() {
    return this.#value;
  }
  set value(value) {
    if (value === null || value === undefined) value = '';
    this.#value = value;
    const valueArray = value.split(',');
    // if we call checked before the component is connected, it will overwrite the setter/getter
    util.nextAnimationFrameAsync().then(() => {
      [...this.querySelectorAll('mdw-segmented-button')].forEach(item => {
        item.checked = valueArray.includes(item.value);
      });
    });
  }

  updateSelection(value, checked) {
    if (this.#multiSelect) {
      const valueArray = this.value.split(',');
      if (checked === true) valueArray.push(value);
      else {
        const matchIndex = valueArray.indexOf(value);
        valueArray.splice(matchIndex, 1)
      }
      this.#value = valueArray.filter(v => !!v.trim()).join(',');


    } else {
      if (checked === true) {
        const currentChecked = [...this.querySelectorAll('mdw-segmented-button.mdw-checked')].filter(i => i.value !== value);
        currentChecked.forEach(v => v.checked = false);
        this.#value = value;
      } else this.#value = '';
    }
  }

  deselect() {
    const currentSelected = this.querySelector('mdw-segmented-button.mdw-checked');
    if (currentSelected) currentSelected.checked = false;
  }

  #onclick(event) {
    if (this.#multiSelect) {
      event.target.checked = !event.target.checked;
      return;
    }

    this.deselect();
    event.target.checked = true;
  }
});
