import HTMLElementExtended from '../HTMLElementExtended.js';
import util from '../../core/util.js';
import device from '../../core/device.js';
import {
  search_FILL0_wght400_GRAD0_opsz24,
  close_FILL0_wght400_GRAD0_opsz24,
  history_FILL0_wght400_GRAD0_opsz24,
  arrow_back_ios_FILL1_wght300_GRAD0_opsz24,
  mic_FILL1_wght400_GRAD0_opsz24
} from '../../core/svgs.js';
import styles from './search.css' assert { type: 'css' };

// TODO search header (fixed at top of page, hides on scroll)

const speechRecognitionSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

customElements.define('mdw-search', class MDWSearchElement extends HTMLElementExtended {
  useShadowRoot = true;
  useTemplate = false;
  static styleSheets = styles;

  #value = '';
  #placeholder = 'Search';
  #debounce;
  #open = false;
  #suggestions = [];
  #quickResults = [];
  #input;
  #templateElement = document.createElement('template');
  #sections = [{
    id: 'default'
  }];
  #templates = {
    default: data => /*html*/`<mdw-list-item value="${data.value}">${data.primary || data.value}</mdw-list-item>`,
    quick: data => /*html*/`<mdw-list-item value="${data.value}">${data.primary || data.value}</mdw-list-item>`
  };
  #historyMax = 100;
  #historyId;
  #history = [];

  #open_bound = this.open.bind(this);
  #onInput_bound = this.#onInput.bind(this);
  #onKeydown_bound = this.#onKeydown.bind(this);
  #onClearClick_bound = this.#onClearClick.bind(this);
  #close_bound = this.close.bind(this);
  #itemClick_bound = this.#itemClick.bind(this);
  #filterChange_bound = this.#filterChange.bind(this);
  #clickOutsideCloseFix_bound = this.#clickOutsideCloseFix.bind(this);
  #backClick_bound = this.#backClick.bind(this);
  #inputSearch_debounced;
  #fullscreenPlaceHolder;
  #speechRecognition;
  #hasSpeech = this.hasAttribute('speech');
  #micClick_bound = this.#micClick.bind(this);
  #noSpinner = this.classList.contains('mdw-no-spinner');
  #abort = new AbortController();
  #openAbort;



  constructor() {
    super();
    this.classList.add('mdw-no-animation');

    if (this.#hasSpeech) {
      if (!speechRecognitionSupported) {
        console.warn('Browser does not support speech recognition');
        this.#hasSpeech = false;
      } else this.#enableSpeechRecognition();
    }

    if (this.hasAttribute('debounce')) {
      this.#debounce = parseInt(this.getAttribute('debounce') || 300);
      this.#inputSearch_debounced = util.debounce(this.#inputSearch.bind(this), this.#debounce);
    }
  }

  connectedCallback() {
    const filters = this.querySelector('[slot=filters]');
    if (filters) this.classList.add('mdw-has-filters');

    if (device.isMobile) {
      this.classList.add('mdw-fullscreen');
      this.insertAdjacentHTML('beforeend', /*html*/`
        <div class="mdw-suggestions" slot="suggestions">
          <mdw-list class="mdw-line-compact">
          </mdw-list>
        </div>
      `);
    } else {
      this.insertAdjacentHTML('beforeend', /*html*/`
        <mdw-suggestions slot="suggestions">
          <mdw-list class="mdw-line-compact">
          </mdw-list>
        </mdw-suggestions>
      `);
    }

    if (this.querySelector('[slot=leading]')) this.classList.add('mdw-has-leading');
    if (this.querySelector('[slot=trailing]')) this.classList.add('mdw-has-trailing');

    this.#historyId = this.getAttribute('history');
    if (this.#historyId) this.#history = JSON.parse(localStorage.getItem(`${this.#historyId}_history`) || '[]');

    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', this.getAttribute('placeholder' || 'search'));
  }

  afterRender() {
    this.#input = this.shadowRoot.querySelector('input');
    this.#input.addEventListener('focus', this.#open_bound, { signal: this.#abort.signal });
    this.shadowRoot.querySelector('.clear').addEventListener('click', this.#onClearClick_bound, { signal: this.#abort.signal });

    setTimeout(() => {
      this.classList.remove('mdw-no-animation');
    }, 200);
  }

  disconnectedCallback() {
    this.#abort.abort();
    if (this.#openAbort) this.#openAbort.abort();
  }

  template() {
    return /*html*/`
      <div class="textfield">
        <slot name="leading"></slot>
        <div class="mdw-svg-icon fullscreen-back">${arrow_back_ios_FILL1_wght300_GRAD0_opsz24}</div>
        <div class="mdw-svg-icon search">${search_FILL0_wght400_GRAD0_opsz24}</div>
        <input placeholder="${this.#placeholder}">
        ${this.#hasSpeech ? `<div class="mdw-svg-icon mic">${mic_FILL1_wght400_GRAD0_opsz24}</div>` : ``}
        <span class="spinner"></span>
        <div class="mdw-svg-icon clear">${close_FILL0_wght400_GRAD0_opsz24}</div>
        <slot name="trailing"></slot>
      </div>
      <slot name="filters"></slot>
      <slot name="suggestions"></slot> <!-- filled in programmatically, used for global css access -->
    `;
  }

  get placeholder() {
    return this.#placeholder;
  }
  set placeholder(value) {
    this.#placeholder = value;
    this.setAttribute('aria-label', value);
    if (this.rendered) this.shadowRoot.querySelector('input').placeholder = value;
  }

  get value() {
    return this.#value;
  }
  set value(value) {
    if (this.rendered) this.shadowRoot.querySelector('input').value = value;
  }

  get searchValue() {
    return this.shadowRoot.querySelector('input').value;
  }
  set searchValue(value) {
    if (this.rendered) this.shadowRoot.querySelector('input').value = value;
  }

  get filterValue() {
    return this.#chipGroup.value;
  }

  get #suggestionsContainer() {
    return this.querySelector('mdw-suggestions') || this.querySelector('.mdw-suggestions');
  }

  get #list() {
    return this.#suggestionsContainer.querySelector(':scope > mdw-list');
  }
  get #chipGroup() {
    return this.querySelector(':scope > mdw-chip-group');
  }

  get sections() {
    return this.#sections;
  }

  get suggestions() {
    return this.#suggestions;
  }

  get quickResults() {
    return this.#quickResults;
  }

  get #hasSearchValue() {
    return this.classList.contains('mdw-has-search-value');
  }
  set #hasSearchValue(value) {
    this.classList.toggle('mdw-has-search-value', !!value);
  }

  get #hasSuggestions() {
    return this.#suggestions.length > 0;
  }

  open() {
    if (this.#open) return;
    this.#openAbort = new AbortController();

    this.#input.selectionStart = 10000;
    this.#input.addEventListener('input', this.#onInput_bound, { signal: this.#openAbort.signal });
    window.addEventListener('keydown', this.#onKeydown_bound, { signal: this.#openAbort.signal });
    
    if (device.isMobile) this.#fullscreenOpen();
    else {
      this.#suggestionsContainer.show();
      this.#suggestionsContainer.addEventListener('close', this.#close_bound, { signal: this.#openAbort.signal });
    }

    this.#list.addEventListener('click', this.#itemClick_bound, { signal: this.#openAbort.signal });
    if (this.#chipGroup) this.#chipGroup.addEventListener('change', this.#filterChange_bound, { signal: this.#openAbort.signal });
    this.addEventListener('click', this.#clickOutsideCloseFix_bound, { signal: this.#openAbort.signal });
    if (this.#hasSpeech) this.shadowRoot.querySelector('.mic').addEventListener('click', this.#micClick_bound, { signal: this.#openAbort.signal });

    this.classList.add('mdw-open');
    this.#open = true;
    this.#render();
  }

  #fullscreenOpen() {
    if (!this.#fullscreenPlaceHolder) this.#fullscreenPlaceHolder = document.createElement('div');
    const bounds = this.getBoundingClientRect();

    this.#fullscreenPlaceHolder.style.height = `${bounds.height}px`;
    this.#fullscreenPlaceHolder.style.width = `${bounds.width}px`;
    this.#fullscreenPlaceHolder.style.margin = getComputedStyle(this).margin;
    this.insertAdjacentElement('beforebegin', this.#fullscreenPlaceHolder);
    this.style.setProperty('--mdw-search-fullscreen-top', `${bounds.top}px`);
    this.style.setProperty('--mdw-search-fullscreen-left', `${bounds.left}px`);
    this.style.setProperty('--mdw-search-fullscreen-width', `${bounds.width}px`);
    this.style.setProperty('--mdw-search-fullscreen-height', `${bounds.height}px`);
    this.shadowRoot.querySelector('.fullscreen-back').addEventListener('click', this.#backClick_bound, { signal: this.#openAbort.signal });
  }

  close() {
    if (!this.#open) return;
    this.#openAbort.abort();

    if (device.isMobile) {
      this.#fullscreenClose();
    } else {
      this.#suggestionsContainer.close();
      this.#clearAll();
      this.classList.remove('mdw-open');
      this.#open = false;
    }
  }

  async #fullscreenClose() {
    this.shadowRoot.querySelector('.fullscreen-back').removeEventListener('click', this.#backClick_bound);
    this.classList.remove('mdw-open');
    this.#open = false;
    await util.animationendAsync(this);
    this.#fullscreenPlaceHolder.remove();
    this.#clearAll();
  }


  pending() {
    if (this.#noSpinner) return;
    this.shadowRoot.querySelector('.spinner').innerHTML = `
      <mdw-progress-circular thickness="2" diameter="28" class="mdw-indeterminate"></mdw-progress-circular>
    `;
    this.classList.add('mdw-pending');
  }

  resolve() {
    if (this.#noSpinner) return;
    this.shadowRoot.querySelector('.spinner').innerHTML = '';
    this.classList.remove('mdw-pending');
  }

  registerSection(id, title = '') {
    this.#sections.push({
      id,
      title
    });
  }

  registerTemplate(template, section = 'default') {
    this.#templates[section] = template;
  }

  updateSuggestions(suggestions) {
    if (!Array.isArray(suggestions) || suggestions.find(v => v.value === undefined)) {
      throw Error('suggestions must be an Array of Objects with at least a value property: [{ value: ""}]');
    }

    this.#suggestions = suggestions || [];
    this.resolve();
    if (this.rendered) this.#render();
  }

  updateQuickResults(quickResults) {
    if (!Array.isArray(quickResults) || quickResults.find(v => v.value === undefined)) {
      throw Error('quickResults must be an Array of Objects with at least a value property: [{ value: ""}]');
    }

    this.#quickResults = quickResults || [];
    if (this.rendered) this.#render();
  }

  #render() {
    if (!this.rendered) return;

    if (this.#hasSuggestions) {
      const sectionSplit = this.#sections.map(({ id, title }) => ({
        id,
        title,
        suggestions: this.#suggestions.filter(v => (v.section || 'default') === id)
      })).filter(v => v.suggestions.length > 0);

      this.#templateElement.innerHTML = sectionSplit.map(section => /*html*/`
        ${section.title ? /*html*/`<div class="mdw-sub-header">${section.title}</div>` : ''}
        ${section.suggestions.map(sug => /*html*/`
          ${(this.#templates[section.id] || this.#templates.default)(sug)}
        `).join('\n')}
      `).join('\n');
      this.#highlight();
      this.#list.replaceChildren(this.#templateElement.content.cloneNode(true));
      
    // history and quick results
    } else if (this.#open && this.#hasSearchValue && (this.#history.length > 0 || this.#quickResults.length > 0)) {
      this.#templateElement.innerHTML = /*html*/`
        ${util.fuzzySearch(this.searchValue, this.#history).slice(0, 10).map(this.#historyTemplate).join('\n')}
        ${this.quickResults.length > 0 ? /*html*/`
          <div class="mdw-sub-header">Quick results</div>
          ${this.#quickResults.map(v => /*html*/`
            ${this.#templates.quick(v)}
          `).join('\n')}
        ` : ''}
      `;
      this.#highlight();
      this.#list.replaceChildren(this.#templateElement.content.cloneNode(true));
    // clear
    } else {
      this.#list.innerHTML = '';
    }

    [...this.#list.querySelectorAll('mdw-list-item')].forEach(element => {
      let label = element.getAttribute('aria-label');
      if (label?.includes('[search result]')) return;
      if (!label) label = element.getAttribute('value');
      element.setAttribute('aria-label', `[search result] ${label}`);
    })
  }

  #highlight() {
    const searchValue = this.searchValue;
    const highlightRegex = new RegExp(searchValue, 'gi');
    this.#getTextNodes(this.#templateElement.content).forEach(node => {
      if (!node.textContent.trim()) return;

      const replaceElement = document.createElement('span');
      replaceElement.innerHTML = node.textContent.replaceAll(highlightRegex, `<mark>${searchValue}</mark>`);
      node.parentNode.insertBefore(replaceElement, node);
      node.remove();
    });
  }

  #getTextNodes(node) {
    let nodes = [];
    if (!node) return nodes;

    node = node.firstChild;
    while (node) {
      if (node.nodeType == 3) nodes.push(node);
      else if (
        node.nodeName !== 'MDW-ICON'
        && node.nodeName !== 'MDW-AVATAR'
        && !node.hasAttribute('history')
        && !node.classList.contains('mdw-sub-header')
      ) nodes = nodes.concat(this.#getTextNodes(node));
      node = node.nextSibling;
    }
    return nodes;
  }

  #onInput() {
    this.#clearAll();
    if (this.searchValue !== '') {
      if (this.#hasSearchValue === false) this.#hasSearchValue = true;

      if (this.#debounce) this.#inputSearch_debounced();
      else this.#inputSearch();
    } else if (this.#hasSearchValue === true) {
      this.#hasSearchValue = false;
      this.#clearAll();
    }

    this.dispatchEvent(new Event('input'));
  }

  #inputSearch() {
    this.#storeHistory(this.searchValue);
    this.pending();
    this.dispatchEvent(new Event('search'));
  }

  #onClearClick() {
    this.searchValue = '';
    this.#hasSearchValue = false;
    this.classList.remove('mdw-has-search-value');
    this.#clearAll();
    this.#input.focus();
  }

  #itemClick(event) {
    if (event.target.nodeName !== 'MDW-LIST-ITEM') return;

    if (event.target.hasAttribute('history')) {
      this.value = event.target.value;
      this.pending();
      this.dispatchEvent(new Event('search'));
      return;
    }

    this.value = event.target.getAttribute('value');
    this.close();
    this.dispatchEvent(new Event('change'));
  }

  #filterChange() {
    this.dispatchEvent(new Event('filter'));
    this.dispatchEvent(new Event('change'));
  }

  #clearAll() {
    this.#suggestions = [];
    this.#quickResults = [];
    this.#render();
  }

  #historyTemplate(value) {
    return /*html*/`
      <mdw-list-item value="${value}" history>
        <div class="mdw-svg-icon">${history_FILL0_wght400_GRAD0_opsz24}</div>
        ${value}
      </mdw-list-item>
    `;
  }

  #storeHistory(value) {
    if (!this.#historyId) return;
    if (!value || value.length < 2) return;
    if (this.#history.includes(value)) return
    this.#history.unshift(value);
    if (this.#history.length > this.#historyMax) this.#history = this.#history.slice(0, this.#historyMax);
    localStorage.setItem(`${this.#historyId}_history`, JSON.stringify(this.#history));
  }

  #onKeydown(event) {
    const { key, shiftKey } = event;
    const escape = key === 'Escape';
    const tab = key === 'Tab';
    const enter = key === 'Enter';
    const downArrow = key === 'ArrowDown';
    const upArrow = key === 'ArrowUp';

    if (escape && !device.isMobile) this.close();

    const focusedElement = document.activeElement;

    if ((tab && !shiftKey) || downArrow) {
      // list focus next handled y list component
      if (focusedElement.nodeName !== 'MDW-LIST-ITEM') {
        const nextFocus = this.#list.querySelector('mdw-list-item');
        if (nextFocus) nextFocus.focus();
      }
      event.preventDefault();
    } else if ((tab && shiftKey) || upArrow) {
      // list focus previous handled y list component
      if (focusedElement.nodeName !== 'MDW-LIST-ITEM') {
        const nextFocus = [...this.#list.querySelectorAll('mdw-list-item')].pop();
        if (nextFocus) nextFocus.focus();
      }
      event.preventDefault();
    }

    if (enter && !this.#debounce) {
      if (focusedElement.nodeName === 'MDW-SEARCH' && !!this.searchValue) {
        this.#storeHistory(this.searchValue);
        this.pending();
        this.dispatchEvent(new Event('search'));
      } else if (focusedElement.nodeName === 'MDW-LIST-ITEM') {
        if (focusedElement.hasAttribute('history')) {
          this.value = focusedElement.value;
          this.pending();
          this.dispatchEvent(new Event('search'));
        } else {
          this.value = focusedElement.getAttribute('value');
          this.close();
          this.dispatchEvent(new Event('change'));
        }
      }
    }
  }

  // close when leading or trailing icons are clicked
  #clickOutsideCloseFix(event) {
    const leading = this.querySelector('[slot=leading]');
    if (leading && leading.contains(event.target)) this.close();
    else {
      const trailing = this.querySelector('[slot=trailing]');
      if (trailing && trailing.contains(event.target)) this.close();
    }
  }

  #backClick() {
    this.close();
  }

  #enableSpeechRecognition() {
    this.#speechRecognition = webkitSpeechRecognition ? new webkitSpeechRecognition() : new SpeechRecognition();
    // this.#speechRecognition.continuous = false;
    // this.#speechRecognition.lang = 'en-US';
    // this.#speechRecognition.interimResults = true;
    // this.#speechRecognition.maxAlternatives = 1;
    // recognition.onstart = () => {
    //   console.log('start');
    // };
    // recognition.onend = () => {
    //   console.log('end');
    // };

    this.#speechRecognition.onresult = (event) => {
      const text = event.results[0][0].transcript;;

      if (text) {
        this.#hasSearchValue = true;
        this.#input.value = text;
      }
    };
  }


  #micClick() {
    if (this.#speechRecognition) this.#speechRecognition.start();
  }
});
