export default class Formatter {
  #input;
  #patternString;
  #pattern;
  #parser;
  #format;
  #formatParts;
  #formatSplitter;
  #mask;
  #maskParts;
  #rawValue = '';
  #displayValue = '';
  #formattedValue = '';
  #maskedValue = '';
  #initialized = false;
  #previousPatternMismatch;
  #replaceStringGroupRegex = /(\$[\d\&])/;
  #regexGroupMatcher = /(\((?:\?\<\w+\>)?([^\)]+)\)\??)/g;
  #navigationKeys = [
    'Backspace',
    'Delete',
    'Shift',
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Tab'
  ];
  #keyDown_bound = this.#keyDown.bind(this);
  #paste_bound = this.#paste.bind(this);
  #onBlur_bound = this.#onBlur.bind(this);
  #onFocus_bound = this.#onFocus.bind(this);

  constructor(textfield) {
    this.#input = textfield.querySelector('input');
  }

  get value() {
    return this.#rawValue;
  }

  get formattedValue() {
    return this.#formattedValue;
  }

  get maskedValue() {
    return this.#maskedValue;
  }

  get displayValue() {
    return this.#displayValue;
  }

  get pattern() {
    return this.#patternString;
  }
  set pattern(value) {
    this.#patternString = value;
    this.#setPattern(value);
  }

  get format() {
    return this.#format;
  }
  set format(value) {
    this.#format = value;
    this.#buildFormat(value);
  }

  get mask() {
    return this.#mask;
  }
  set mask(value) {
    this.#mask = value;
    this.#buildMask(value);
  }

  enable() {
    if (!this.#format) return;
    if (!this.#pattern) throw Error('Must set pattern before enabling');
    this.#initialize();

    this.#input.addEventListener('keydown', this.#keyDown_bound);
    this.#input.addEventListener('paste', this.#paste_bound);
    this.#input.addEventListener('blur', this.#onBlur_bound);
    this.#input.addEventListener('focus', this.#onFocus_bound);
  }

  disable() {
    this.#input.removeEventListener('keydown', this.#keyDown_bound);
    this.#input.removeEventListener('paste', this.#paste_bound);
    this.#input.removeEventListener('blur', this.#onBlur_bound);
    this.#input.removeEventListener('focus', this.#onFocus_bound);
  }

  #initialize() {
    if (this.#initialized) return;
    this.#initialized = true;

    // intercept the value property on the input
    const that = this;
    const inputDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    Object.defineProperty(this.#input, 'value', {
      get: function () {
        return that.#valueGetter();
      },
      set: function (value) {
        value = that.#valueSetter(value);
        return inputDescriptor.set.call(this, value);
      }
    });
  }

  // add regex slashes and begin and end operators (/^ $/)
  #setPattern(regexString) {
    // do not use pattern for masking because it will not be valid.
    if (!this.#mask) this.#input.pattern = regexString;
    else this.#input.removeAttribute('pattern');

    this.#pattern = new RegExp(regexString);
    let i = 0;
    // make all groups after first optional. This will help with parsing for formatting
    const modified = regexString.replace(this.#regexGroupMatcher, (_match, value) => {
      if (i > 0 && value.slice(-1) !== '?') value += '?';
      i += 1;
      return value;
    });
    // remove regex slashes
    // remove $ from end so we can parse portions
    // add ^ at beginning if non existing
    this.#parser = new RegExp(`^${modified.replace(/^\//, '').replace(/^\^/, '').replace(/(?<!\\)\$$/, '').replace(/\/$/, '')}`);
  }

  #buildFormat(value) {
    const formatParts = value.split(this.#replaceStringGroupRegex);
    // splitting with regex can inset items at start and ent. This will remove them if not already existing
    if (value[0] === '' && value[0] !== formatParts[0]) formatParts.splice(0, 1);
    if (value[value.length - 1] !== formatParts[formatParts.length - 1]) formatParts.splice(-1);
    // array split by groups "$1"
    this.#formatParts = formatParts;
    // new format string with a unique separator to make it easy to partially format.
    this.#formatSplitter = formatParts.filter(v => v.match(this.#replaceStringGroupRegex)).join('_:_');
  }

  #buildMask(value) {
    const maskParts = value.split(this.#replaceStringGroupRegex);
    // for some reason splitting with regex will inset spaces. This will remove them if not already existing
    if (maskParts[0] === '' && value[0] !== maskParts[0]) maskParts.splice(0, 1);
    if (value[value.length - 1] !== maskParts[maskParts.length - 1]) maskParts.splice(-1);
    this.#maskParts = maskParts;
  }


  #valueGetter() {
    return this.#rawValue;
  }

  #valueSetter(value) {
    const parsed = value.match(this.#parser);

    // if value was set with the mask do not re-mask. This could be value on render or from server
    if (!parsed && this.#mask && this.#checkIfValueIsMask(value)) {
      this.#rawValue = value;
      this.#formattedValue = value;
      this.#displayValue = value;
      return this.#displayValue;
    }

    if (!parsed || !this.#format) {
      this.#rawValue = value;
      this.#formattedValue = value;
      if (this.#mask) this.#maskedValue = this.#maskValue(value, false);
      this.#displayValue = this.#maskValue(value, false);
      return this.#displayValue;
    }
    
    this.#formattedValue = this.#formatValue(value);
    if (this.#mask) this.#maskedValue = this.#maskValue(this.#formattedValue);
    this.#displayValue = this.#maskedValue || this.#formattedValue;
    if (!this.#rawValue) this.#rawValue = value;
    return this.#displayValue;
  }

  #keyDown(event) {
    // TODO handle this on mozilla window.
    // Meta does not work on windows key
    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/metaKey    
    if (event.metaKey) return;

    // do not do anything on enter
    if (event.key === 'Enter') return;

    // input keys
    if (!this.#navigationKeys.includes(event.key)) {
      const selection = this.#getSelection();
      // inset input into correct position
      const arr = this.#rawValue.split('');
      const start = arr.slice(0, selection.rawStart).join('');
      const end = arr.slice(selection.rawEnd).join('');
      this.#rawValue = `${start}${event.key}${end}`;

      event.target.value = this.#rawValue;
      event.preventDefault();

      // if range selected move 1 forward from start
      if (selection.displayStart !== selection.displayEnd) {
        event.target.selectionStart = selection.displayStart + 1;
        event.target.selectionEnd = selection.displayStart + 1;

      // move cursor to end
      } else if (!selection.isAtEnd) {
        event.target.selectionStart = selection.displayEnd + 1;
        event.target.selectionEnd = selection.displayEnd + 1;
      }

      this.#reportValidityOnInput();

    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      const selection = this.#getSelection();
      if (selection.rawStart > 0) {
        // when range selected we do not want to delete the item before the selection
        if (selection.rawStart !== selection.rawEnd) this.#rawValue = `${this.#rawValue.slice(0, selection.rawStart)}${this.#rawValue.slice(selection.rawEnd)}`;
        else this.#rawValue = `${this.#rawValue.slice(0, selection.rawStart - 1)}${this.#rawValue.slice(selection.rawEnd)}`;
      }

      event.target.value = this.#rawValue;
      event.preventDefault();

      if (selection.rawStart !== selection.rawEnd) {
        event.target.selectionStart = selection.displayStart;
        event.target.selectionEnd = selection.displayStart;
      } else {
        event.target.selectionStart = selection.displayStart - 1;
        event.target.selectionEnd = selection.displayStart - 1;
      }

      this.#reportValidityOnInput();
    }
  }

  #paste(event) {
    event.preventDefault();

    const selection = this.#getSelection();

    // inset pasted ito correct section
    if (!(event.clipboardData || window.clipboardData)) return;
    const paste = (event.clipboardData || window.clipboardData).getData('text');
    const arr = this.#rawValue.split('');
    const start = arr.slice(0, selection.rawStart).join('');
    const end = arr.slice(selection.rawEnd).join('');
    this.#rawValue = `${start}${paste}${end}`;
    event.target.value = this.#rawValue;

    // move selection to end of pasted content
    event.target.selectionStart = selection.displayStart + paste.length;
    event.target.selectionEnd = selection.displayStart + paste.length;
    this.#reportValidityOnInput();
  }

  // return selection for display and raw values
  // the raw values length may not be the same as the display because of formatting
  #getSelection() {
    const displayStart = this.#input.selectionStart;
    const displayEnd = this.#input.selectionEnd;
    let rawStart = displayStart;
    let rawEnd = displayEnd;
    const isSelectionAtEnd = rawEnd === this.#displayValue.length;

    let rawIndex = 0;
    // we need to check against non masked for this to work
    const selectCheckValue = this.#mask ? this.#formatValue(this.#rawValue) : this.#displayValue;
    selectCheckValue.slice(0, rawStart).split('').filter(c => {
      if (c === this.#rawValue[rawIndex]) rawIndex += 1;
    });
    rawStart = rawIndex;
    rawIndex = 0;
    selectCheckValue.slice(0, rawEnd).split('').filter(c => {
      if (c === this.#rawValue[rawIndex]) rawIndex += 1;
    });
    rawEnd = rawIndex;

    return {
      displayStart,
      displayEnd,
      rawStart: rawStart,
      rawEnd: rawEnd,
      isAtEnd: isSelectionAtEnd
    };
  }

  #reportValidityOnInput() {
    // report only when moving from invalid to valid, this will prevent invalid while typing
    if (!this.#mask && this.#previousPatternMismatch === true && this.#input.validity.patternMismatch === false) {
      this.#input.reportValidity();
      this.#previousPatternMismatch = true;

    
    } else if (this.#mask && this.#input.hasAttribute('pattern')) {
      // remove pattern when rawValue is invalid because the displayValue(mask) will not match the pattern
      if (this.#rawValue.match(this.#pattern) !== null) {
        this.#input.removeAttribute('pattern');
        this.#input.reportValidity();
      }
    }
  }

  #formatValue(value) {
    const parsed = value.match(this.#parser);
    // return raw value if it does not match
    if (!parsed) return value;

    const matchedValue = parsed[0];
    let endMatches = false;
    let matchIndex = 0;
    // characters that do not parse
    const leftOvers = value.replace(matchedValue, '');
    // match part by part until no more groups matches found. This is how we partially match
    const formatGroupMatches = matchedValue.replace(this.#parser, this.#formatSplitter).split('_:_');
    const formatted = this.#formatParts.map(v => {
      if (endMatches) return;
      if (v.match(this.#replaceStringGroupRegex)) {
        v = formatGroupMatches[matchIndex];
        matchIndex += 1;
        if (v === '') endMatches = true;
      }
      return v;
    }).join('');

    return `${formatted}${leftOvers}`;
  }

  // TODO do i limit length? based on regex
  #maskValue(value, parsed = true) {
    if (!this.#mask) return value;
    // if value is not parsable then return the mask with the value length
    if (!parsed) return this.#mask.slice(0, value.length);
    // mask value and restrain its length
    const masked = value.replace(this.#parser, this.#mask);
    if (masked.length > value.length) return masked.slice(0, value.length);
    return masked;
  }

  #checkIfValueIsMask(value) {
    if (!this.#mask) return false;
    if (value.length < this.#mask.length) return false;

    // check if all non group matchers exist in value
    const nonGroupMatches = this.#maskParts
      .filter(v => v.match(this.#replaceStringGroupRegex) === null)
      .filter(v => !value.includes(v)).length;
    return nonGroupMatches === 0;
  }

  #onFocus() {
    if (this.#pattern) this.#previousPatternMismatch = this.#input.validity.patternMismatch;
  }

  #onBlur() {
    // Set pattern attribute on blur if the rawValue is invalid so validity is correct
    // We remove this why typing because the displayValue(mask) will not match the regex
    if (
      this.#pattern
      && this.#mask
      && !this.#checkIfValueIsMask(this.#rawValue)
      && this.#rawValue.match(this.#pattern) === null
    ) this.#input.setAttribute('pattern', this.#patternString);
    this.#input.reportValidity();
  }

}
