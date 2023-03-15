import HTMLElementExtended from '../HTMLElementExtended.js';
import './group.css';

customElements.define('mdw-radio-group', class MDWRadioGroup extends HTMLElementExtended {
  #click_bound = this.#click.bind(this);


  constructor() {
    super();
  }

  connectedCallback() {
    this.setAttribute('role', 'radiogroup');
    this.addEventListener('click', this.#click_bound);
  }

  get value() {
    const checked = this.querySelector('mdw-radio.mdw-checked');
    return checked ? checked.value : undefined;
  }
  set value(value) {
    const match = this.querySelector(`mdw-radio[value="${value}"]`);
    if (match) match.checked = true;
  }

  #click(event) {
    if (event.target === this) return;

    const checked = this.querySelector('mdw-radio.mdw-checked');
    if (checked && checked === event.target) return;

    if (checked) checked.checked = false;
    event.target.checked = true;
    event.target.dispatchEvent(new Event('change'));
    this.dispatchEvent(new Event('change'));
  }
});
