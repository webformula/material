import WFCMenuElement from '../menu/menu.js';
import styles from './search.css' assert { type: 'css' };
import dividerStyles from '../divider/global.css' assert { type: 'css' };
import util from '../../core/util.js';
import device from '../../core/device.js';
import {
  search_FILL0_wght400_GRAD0_opsz24,
  close_FILL0_wght400_GRAD0_opsz24,
  history_FILL0_wght400_GRAD0_opsz24,
  arrow_back_ios_FILL1_wght300_GRAD0_opsz24,
  mic_FILL1_wght400_GRAD0_opsz24
} from '../../core/svgs.js';

const isIncrementalSupported = 'incremental' in document.createElement('input');
const speechRecognitionSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

// TODO chips
// TODO fix aria

class WFCSearchElement extends WFCMenuElement {
  static tag = 'wfc-search';
  static styleSheets = [dividerStyles, styles];

  #abort;
  #input;
  #selected;
  #selectedObject;
  #surfaceContent;
  #inputContainer;
  #results = [];
  #suggestions = [];
  #incremental;
  #speech;
  #speechRecognition;
  #speechListening;
  #history = null;
  #historyMax = 100;
  #historyItems = [];
  #searchTimeout;
  #searchTimeoutSeconds = 3;
  #onInput_bound = this.#onInput.bind(this);
  #renderSuggestions_debounced = util.debounce(this.#renderSuggestions, 50).bind(this);
  #onSearch_bound = this.#onSearch.bind(this);
  #incrementalPolyfill_debounced = util.debounce(this.#onSearch, 300).bind(this);
  #clear_bound = this.#clear.bind(this);
  #micClick_bound = this.#micClick.bind(this);
  #close_bound = this.#close.bind(this);
  #itemClick_bound = this.#itemClick.bind(this);


  constructor() {
    super();

    this.role = 'search';

    this.disableLetterFocus = true;
    if (device.state !== 'compact') {
      this.allowClose = true;
      this.overlap = false;
    } else {
      this.modal = true;
      this.fixed = true;
      this.allowClose = false;
      this.animation = 'fullscreen';
    }

    this.#input = this.shadowRoot.querySelector('input');
    this.#surfaceContent = this.shadowRoot.querySelector('.surface-content');
    this.#inputContainer = this.shadowRoot.querySelector('.input');
  }

  template() {
    return /*html*/`
      <div class="search">
        <div class="input">
          <slot name="leading"></slot>
          <wfc-icon class="search-icon">${search_FILL0_wght400_GRAD0_opsz24}</wfc-icon>
          <wfc-icon-button class="back" aria-label="back">
            <wfc-icon>${arrow_back_ios_FILL1_wght300_GRAD0_opsz24}</wfc-icon>
          </wfc-icon-button>
          <input type="search" />
          <wfc-icon-button class="mic" aria-label="speech">
            <wfc-icon>${mic_FILL1_wght400_GRAD0_opsz24}</wfc-icon>
          </wfc-icon-button>
          <wfc-icon-button class="clear" aria-label="clear">
            <wfc-icon>${close_FILL0_wght400_GRAD0_opsz24}</wfc-icon>
          </wfc-icon-button>
          <slot name="trailing"></slot>
          <wfc-divider></wfc-divider>
        </div>

        <div class="surface">
          <div class="surface-content">
            <div class="item-padding">
              <wfc-progress-linear indeterminate disabled></wfc-progress-linear>
              <div class="no-results">No items</div>
              <slot name="suggestions"></slot>
              <slot class="options-container"></slot>
            </div>
          </div>
        </div>
        
      </div>
    `;
  }


  static get observedAttributesExtended() {
    return [
      ['placeholder', 'string'],
      ['incremental', 'boolean'],
      ['history', 'default'],
      ['history-max', 'int'],
      ['speech', 'boolean'],
      ['search-timeout-seconds', 'int']
    ];
  }

  attributeChangedCallbackExtended(name, _oldValue, newValue) {
    this[name] = newValue;
  }


  get value() { return this.#input.value; }
  set value(value) {
    this.#input.value = value;
  }

  get selected() { return this.#selected; }
  get selectedObject() { return this.#selectedObject; }

  get placeholder() { return this.#input.placeholder }
  set placeholder(value) {
    this.#input.placeholder = value;
  }

  get incremental() { return this.#incremental; }
  set incremental(value) {
    this.#incremental = value;
    this.#input.incremental = this.#incremental;
  }

  get searchTimeoutSeconds() { return this.#searchTimeoutSeconds; }
  set searchTimeoutSeconds(value = 3) {
    this.#searchTimeoutSeconds = value;
  }

  get history() { return this.#history; }
  set history(value) {
    this.#history = typeof value === 'string' ? (value || this.getAttribute('id') || '_global') : null;
    if (this.#history) this.#historyItems = JSON.parse(localStorage.getItem(`wfc_search_history_${this.#history}`) || '[]');
  }

  get historyMax() { return this.#historyMax; }
  set historyMax(value) {
    this.#historyMax = value;
  }

  get speech() { return this.#speech; }
  set speech(value) {
    this.#speech = value;
    if (this.#speech) this.#enableSpeechRecognition();
    else this.#disableSpeechRecognition();
    this.shadowRoot.querySelector('.mic').classList.toggle('show', this.#speech);
  }

  get results() { return this.#results; }
  set results(value = []) {
    if (value && (!Array.isArray(value) || value.find(v => v.value === undefined))) {
      throw Error('results must be an Array of Objects with at least a value property: [{ value: ""}]');
    }

    this.#results = value || [];
    this.resolve();
    this.#renderResults();
  }

  get suggestions() { return this.#suggestions; }
  set suggestions(value = []) {
    if (value && (!Array.isArray(value) || value.find(v => v.value === undefined))) {
      throw Error('suggestions must be an Array of Objects with at least a value property: [{ value: ""}]');
    }

    this.#suggestions = value || [];
    if (this.#history && Array.isArray(this.#suggestions) && this.#suggestions.length > 0) this.#storHistory(this.#suggestions);
    this.#renderSuggestions();
  }


  connectedCallback() {
    super.connectedCallback();

    this.#abort = new AbortController();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.#abort) this.#abort.abort();
    this.#disableSpeechRecognition();
  }

  onShow() {
    super.onShow();

    this.#input.selectionStart = 10000;
    this.#input.addEventListener('input', this.#onInput_bound, { signal: this.#abort.signal });
    this.#input.addEventListener('search', this.#onSearch_bound, { signal: this.#abort.signal });
    this.shadowRoot.querySelector('.clear').addEventListener('click', this.#clear_bound, { signal: this.#abort.signal });
    this.shadowRoot.querySelector('.surface').addEventListener('click', this.#itemClick_bound, { signal: this.#abort.signal });
    if (device.state === 'compact') this.shadowRoot.querySelector('.back').addEventListener('click', this.#close_bound, { capture: true, signal: this.#abort.signal });
  }

  pending() {
    this.classList.add('loading');
    this.shadowRoot.querySelector('wfc-progress-linear').removeAttribute('disabled');
    this.#searchTimeout = setTimeout(() => {
      this.resolve();
    }, this.#searchTimeoutSeconds * 1000);
  }

  async resolve() {
    if (this.#searchTimeout) clearTimeout(this.#searchTimeout);
    this.classList.remove('loading');
    const progress = this.shadowRoot.querySelector('wfc-progress-linear');
    await util.transitionendAsync(progress);
    progress.setAttribute('disabled', '');
  }

  clearHistory() {
    if (this.#history) {
      localStorage.removeItem(`wfc_search_history_${this.#history}`);
      this.#historyItems = [];
    }
  }

  #clear() {
    this.value = '';
    this.#inputContainer.classList.remove('has-value');
    this.#surfaceContent.classList.remove('has-value');
    this.#clearResults();
    this.#clearSuggestions();
    this.#input.focus();
  }

  #clearResults() {
    this.results = [];
  }

  #clearSuggestions() {
    this.suggestions = [];
  }

  #onInput() {
    const hasValue = !!this.#input.value;
    this.#inputContainer.classList.toggle('has-value', hasValue);
    this.#surfaceContent.classList.toggle('has-value', hasValue);

    if (hasValue) {
      this.#renderSuggestions_debounced();
      if (!isIncrementalSupported) this.#incrementalPolyfill_debounced();
    } else {
      this.#renderSuggestions(true);
      this.#renderResults(true);
    }
  }

  #onSearch() {
    if (this.#input.value) this.pending();

    this.dispatchEvent(new Event('search', {
      bubbles: true,
      composed: true
    }));
  }

  #renderResults(clear = false) {
    const containers = Object.fromEntries([...this.querySelectorAll('wfc-search-container[id]')].map(element => ([element.id, { element, template: '' }])));
    containers._default = { default: true, element: this, template: '' };
    this.results.reduce((obj, result) => {
      const container = obj[result.container] ? result.container : '_default';
      if (clear) obj[container].template = '';
      else obj[container].template += `<wfc-search-item value="${result.value}">
        ${result.icon ? `<wfc-icon slot="start">${result.icon}</wfc-icon>` : ''}
        ${result.display || result.value}
      </wfc-search-item>`;
      return obj;
    }, containers);
    
    [...this.querySelectorAll('wfc-search-item:not([slot])')].forEach(e => e.remove());
    Object.values(containers).forEach(item => {
      if (!item.default) item.element.innerHTML = item.template;
    });

    // insert any non containerd items before containerd items
    const searchContainer = this.querySelector('wfc-search-container');
    if (searchContainer) searchContainer.insertAdjacentHTML('beforebegin', containers._default.template);
    else this.insertAdjacentHTML('beforeend', containers._default.template)
  }

  #renderSuggestions(clear = false) {
    [...this.querySelectorAll('wfc-search-item[slot="suggestions"]')].forEach(e => e.remove());
    if (clear) return;

    const inputValue = this.value;
    this.insertAdjacentHTML('afterbegin', this.suggestions.filter(v => v.value !== inputValue).map(item => `
      <wfc-search-item slot="suggestions" value="${item.value}">
        <wfc-icon slot="start">${search_FILL0_wght400_GRAD0_opsz24}</wfc-icon>
        ${item.display || item.value}
      </wfc-search-item>
    `).join(''));
    
    
    if (this.value) {
      const historyMinusSuggestions = this.#historyItems.filter(h => !this.#suggestions.find(s => s.value === h.value) && h.value !== inputValue);
      const filtered = util.fuzzySearch(this.value, historyMinusSuggestions);
      this.insertAdjacentHTML('afterbegin', filtered.map(item => `
        <wfc-search-item slot="suggestions" value="${item.value}">
          <wfc-icon slot="start">${history_FILL0_wght400_GRAD0_opsz24}</wfc-icon>
          ${item.display || item.value}
        </wfc-search-item>
      `).join(''));
    }
  }

  #storHistory(suggestions) {
    suggestions.forEach(item => {
      if (this.#historyItems.find(h => h.value === item.value)) return;
      this.#historyItems.unshift(item);
    });

    if (this.#historyItems.length > this.#historyMax) this.#historyItems = this.#historyItems.slice(0, this.#historyMax);
    localStorage.setItem(`wfc_search_history_${this.#history}`, JSON.stringify(this.#historyItems));
  }

  #enableSpeechRecognition() {
    if (!speechRecognitionSupported) return console.warn('SpeechRecognition not supported')
    this.#speechRecognition = webkitSpeechRecognition ? new webkitSpeechRecognition() : new SpeechRecognition();
    this.#speechRecognition.lang = device.locale;
    this.#speechRecognition.interimResults = true;
    // this.#speechRecognition.continuous = false;
    // this.#speechRecognition.maxAlternatives = 1;

    this.shadowRoot.querySelector('.mic').addEventListener('click', this.#micClick_bound);

    this.#speechRecognition.onresult = (event) => {
      this.#speechListening = true;
      const text = event.results[0][0].transcript;
      if (text) {
        this.#input.value = text;
        this.#incrementalPolyfill_debounced();
      }
    };

    this.#speechRecognition.onspeechend = (event) => {
      this.#speechListening = false;
      this.#speechRecognition.stop();
    };
  }

  #disableSpeechRecognition() {
    if (this.#speechRecognition) {
      this.#speechListening = false;
      this.#speechRecognition.abort();
      this.#speechRecognition = undefined;
    }
  }

  #micClick() {
    if (this.#speechRecognition) {
      this.shadowRoot.querySelector('.mic').removeEventListener('click', this.#micClick_bound);
      if (this.#speechListening) this.#speechRecognition.stop();
      else this.#speechRecognition.start();
    }
  }

  #close(event) {
    const target = event.composedPath()[0];
    if (target.classList.contains('back')) {
      event.stopPropagation()
      this.close();
    }
  }

  #itemClick(event) {
    if (event.target.nodeName === 'WFC-SEARCH-ITEM') {
      if (event.target.getAttribute('slot') === 'suggestions') {
        this.value = event.target.value;
        this.#incrementalPolyfill_debounced();
      } else {
        const value = event.target.value;
        this.value = event.target.displayValue || value;
        this.#selected = value;
        this.#selectedObject = this.#results.find(v => v.value === value);
        this.dispatchEvent(new Event('change'));

        requestAnimationFrame(() => {
          this.close();
        });
      }
    }
  }
}
customElements.define(WFCSearchElement.tag, WFCSearchElement);
