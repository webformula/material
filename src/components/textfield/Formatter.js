const replaceStringGroupRegex = /(\$[\d\&])/;
const regexGroupMatcher = /(\((?:\?\<\w+\>)?([^\)]+)\)\??)/g;
const navigationKeys = [
  'Backspace',
  'Delete',
  'Shift',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Tab'
];

export default class Formatter {
  #textfield;
  #input;
  #rawValue = '';
  #displayValue = '';
  #formattedValue = '';
  #maskedValue = '';
  #patternString;
  #pattern;
  #partialParser;
  #parser;
  #format;
  #formatParts;
  #formatSplitter;
  #mask;
  #maskParts;
  #initialized = false;
  #disabled = true;
  #keyDown_bound = this.#keyDown.bind(this);
  #paste_bound = this.#paste.bind(this);
  #onBlur_bound = this.#onBlur.bind(this);
  #inputCallback;
  #patternRestrict = false;


  constructor(textfield) {
    this.#textfield = textfield;
    this.#initialize();
  }


  get value() {
    return this.#rawValue;
  }
  set value(value) {
    this.#rawValue = value;
    if (this.#disabled) return;
    this.#input.value = value;
    this.#updateValidity();
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
    this.#setPattern();
  }

  get patternRestrict() {
    return this.#patternRestrict;
  }
  set patternRestrict(value) {
    this.#patternRestrict = value;
  }

parseStructureRegex(structureRegexString) {
  const simplifiedRegexString = this.simplifyGroupRegexString(structureRegexString)
  const regexString = `^${simplifiedRegexString}$`;
  const regex = new RegExp(regexString);
  const structureRegex = new RegExp(`^${structureRegexString}$`);
  return {
    regex,
    regexString,
    structureRegex,
    structureRegexString
  };
}

// remove new group matcher features that are not supported by all platforms
simplifyGroupRegexString(regexString) {
  return regexString.replace(/\(\?\<\w+\>([^\)]+)\)/g, (_match, value) => {
    return `(${value})`;
  });
}

  get format() {
    return this.#format;
  }
  set format(value) {
    this.#format = value;
    this.#buildFormat();
  }

  get mask() {
    return this.#mask;
  }
  set mask(value) {
    this.#mask = value;
    this.#buildMask();
  }

  set onInput(callback = () => {}) {
    if (typeof callback !== 'function') this.#inputCallback = undefined;
    else this.#inputCallback = callback;
  }

  #onInput() {
    if (this.#inputCallback) this.#inputCallback();
  }

  async enable() {
    if (!this.#disabled) return;
    this.#disabled = false;
    if (!this.#format) return;
    if (!this.#pattern) throw Error('Must set pattern before enabling');

    this.#input.addEventListener('keydown', this.#keyDown_bound);
    this.#input.addEventListener('paste', this.#paste_bound);
    this.#textfield.addEventListener('blur', this.#onBlur_bound);
  }

  disable() {
    if (this.#disabled) return;
    this.#disabled = true;
    this.#input.removeEventListener('keydown', this.#keyDown_bound);
    this.#input.removeEventListener('paste', this.#paste_bound);
    this.#textfield.removeEventListener('blur', this.#onBlur_bound);
  }

  async #initialize() {
    if (this.#initialized) return;
    this.#initialized = true;
    
    this.#input = this.#textfield.shadowRoot.querySelector('input');

    this.#buildFormat();
    this.#buildMask();
    this.#setPattern();

    // intercept the value property on the input
    const that = this;
    const inputDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    Object.defineProperty(this.#input, 'value', {
      get: function () {
        return that.#rawValue;
      },
      set: function (value) {
        value = that.#valueSetter(value);
        return inputDescriptor.set.call(this, value);
      }
    });
  }

  #buildFormat() {
    if (!this.#format) {
      this.#formatParts = undefined;
      this.#formatSplitter = undefined;
      return;
    }

    const formatParts = this.#format.split(replaceStringGroupRegex);
    // splitting with regex can inset items at start and end. This will remove them if not already existing
    if (this.#format[0] === '' && this.#format[0] !== formatParts[0]) formatParts.splice(0, 1);
    if (this.#format[this.#format.length - 1] !== formatParts[formatParts.length - 1]) formatParts.splice(-1);
    // array split by groups "$1"
    this.#formatParts = formatParts;
    // new format string with a unique separator to make it easy to partially format.
    this.#formatSplitter = formatParts.filter(v => v.match(replaceStringGroupRegex)).join('_:_');
  }

  #buildMask() {
    this.#setPattern();
    if (!this.#mask) {
      this.#maskParts = undefined;
      return;
    }

    const maskParts = this.#mask.split(replaceStringGroupRegex);
    // for some reason splitting with regex will inset spaces. This will remove them if not already existing
    if (maskParts[0] === '' && this.#mask[0] !== maskParts[0]) maskParts.splice(0, 1);
    if (this.#mask[this.#mask.length - 1] !== maskParts[maskParts.length - 1]) maskParts.splice(-1);
    this.#maskParts = maskParts;
  }

  // add regex slashes and begin and end operators (/^ $/)
  #setPattern() {
    if (!this.#patternString) {
      this.#pattern = undefined;
      this.#parser = undefined;
      this.#partialParser = undefined;
      return;
    }

    // do not use pattern for masking because it will not be valid.
    if (!this.#mask) this.#input.pattern = this.#patternString;
    else this.#input.removeAttribute('pattern');

    this.#pattern = new RegExp(this.#patternString);
    let i = 0;
    // make all groups after first optional. This will help with parsing for formatting
    const modified = this.#patternString.replace(regexGroupMatcher, (_match, value) => {
      if (i > 0 && value.slice(-1) !== '?') value += '?';
      i += 1;
      return value;
    });
    // remove regex slashes
    // remove $ from end so we can parse portions
    // add ^ at beginning if non existing
    this.#parser = new RegExp(`^${modified.replace(/^\//, '').replace(/^\^/, '').replace(/(?<!\\)\$$/, '').replace(/\/$/, '')}`);
    this.#partialParser = this.#partialMatchRegex(this.#patternString);
  }
  
  // remove characters that do not match
  //  This uses a modified version of he regex that can check per character
  #stripInvalidCharacters(value, chars = '') {
    if (value.length === 0) return value;
    const valid = value.match(this.#partialParser);
    if (valid === null) return this.#stripInvalidCharacters(value.slice(0, value.length - 1), chars += value.slice(-1));
    return value;
  }

  #valueSetter(value) {
    value = value || '';
    if (!this.#parser || !this.#input) {
      this.#rawValue = value;
      return value;
    }

    // remove characters that do not match
    if (this.#patternRestrict) {
      const stripped = this.#stripInvalidCharacters(value);
      value = stripped;
    }

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
    this.#rawValue = value;
    return this.#displayValue;
  }


  #checkIfValueIsMask(value) {
    if (!this.#mask) return false;
    if (value.length < this.#mask.length) return false;

    // check if all non group matchers exist in value
    const nonGroupMatches = this.#maskParts
      .filter(v => v.match(replaceStringGroupRegex) === null)
      .filter(v => !value.includes(v)).length;
    return nonGroupMatches === 0;
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
      if (v.match(replaceStringGroupRegex)) {
        v = formatGroupMatches[matchIndex];
        matchIndex += 1;
        if (v === '') endMatches = true;
      }
      return v;
    }).join('');

    return `${formatted}${leftOvers}`;
  }


  #keyDown(event) {
    // Firefox does not consider the windows key to be a metaKey
    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/metaKey    
    if (event.metaKey || event.getModifierState('OS') || event.getModifierState('Win')) return;

    // do not do anything on enter
    if (event.key === 'Enter') return;

    // input keys
    if (!navigationKeys.includes(event.key)) {
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

      this.#updateValidity();
      this.#onInput();

    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      const selection = this.#getSelection();

      if (selection.rawStart !== selection.rawEnd) {
        const arr = this.#rawValue.split('');
        const start = arr.slice(0, selection.rawStart).join('');
        const end = arr.slice(selection.rawEnd).join('');
        this.#rawValue = `${start}${end}`;
      } else {
        this.#rawValue = `${this.#rawValue.slice(0, selection.rawStart - 1)}${this.#rawValue.slice(selection.rawEnd)}`;
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

      this.#updateValidity();
      this.#onInput();
    }
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

  #onBlur() {
    this.#updateValidity();
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

    // offset cursor based on formatting changes
    const previousLength = start.length + end.length + paste.length;
    const lengthDifference = this.#displayValue.length - previousLength;

    // move selection to end of pasted content
    event.target.selectionStart = selection.displayStart + paste.length + lengthDifference;
    event.target.selectionEnd = selection.displayStart + paste.length + lengthDifference;
    

    this.#updateValidity();
    this.#onInput();
  }

  #updateValidity() {
    const valid = this.#rawValue.match(this.#pattern) !== null;
    const hasPatternAttr = this.#input.hasAttribute('pattern');

    // Set pattern attribute on blur if the rawValue is invalid so validity is correct
    // We remove this while typing because the displayValue(mask) will not match the regex
    if (
      this.#mask
      && !hasPatternAttr
      && !this.#checkIfValueIsMask(this.#rawValue)
      && !valid
    ) {
      this.#input.setAttribute('pattern', this.#patternString);
    } else if (valid && hasPatternAttr) {
      this.#input.removeAttribute('pattern');
    }
  }

  // build a version of the pattern regex that allows per character partial validation
  // Example: SSN
  //   ^([0-9]{3})[\\- ]?([0-9]{2})[\\- ]?([0-9]{4})$
  //   -> ^((?:[0-9]|$){3}|$)(?:[\- ]|$)?((?:[0-9]|$){2}|$)(?:[\- ]|$)?((?:[0-9]|$){4}|$)$
  #partialMatchRegex(source) {
    let results = '';
    let tmp;
    let i = 0;
    let iAdd;
    let sAdd;
    const bracketMatcher = /\[(?:\\.|.)*?\]/g;
    const curlyBracketMatcher = /\{\d+,?\d*\}/g;

    const p2 = performance.now();
    while (i < source.length) {
      switch (source[i]) {
        case '\\':
          switch (source[i + 1]) {
            case 'c':
              iAdd = 3;
              sAdd = `(?:${source.slice(i, i + iAdd)}|$)`;
              break;

            case 'x':
              iAdd = 4;
              sAdd = `(?:${source.slice(i, i + iAdd)}|$)`;
              break;

            case 'u':
              if (source[i + 2] === '{') iAdd = source.indexOf('}', i) - i + 1;
              else iAdd = 6;
              sAdd = `(?:${source.slice(i, i + iAdd)}|$)`;
              break;

            case 'p':
            case 'P':
              iAdd = source.indexOf('}', i) - i + 1;
              sAdd = `(?:${source.slice(i, i + iAdd)}|$)`;
              break;

            case 'k':
              iAdd = source.indexOf('}', i) - i + 1;
              sAdd = `(?:${source.slice(i, i + iAdd)}|$)`;
              break;

            default:
              iAdd = 2;
              sAdd = `(?:${source.slice(i, i + iAdd)}|$)`;
              break;
          }
          break;

        case '[':
          bracketMatcher.lastIndex = i;
          iAdd = bracketMatcher.exec(source)[0].length;
          sAdd = `(?:${source.slice(i, i + iAdd)}|$)`;
          break;

        case '{':
          curlyBracketMatcher.lastIndex = i;
          tmp = curlyBracketMatcher.exec(source);
          if (tmp) {
            iAdd = tmp[0].length;
            sAdd = source.slice(i, i + iAdd);
          } else {
            iAdd = 1;
            sAdd = `(?:${source.slice(i, i + iAdd)}|$)`;
          }
          break;

        case '(':
          if (source[i + 1] === '?') {
            switch (source[i + 2]) {
              case ':':
                sAdd = '(?:';
                iAdd = 3;
                tmp = this.#partialMatchRegex(source.slice(i + iAdd));
                iAdd += tmp.index;
                sAdd += tmp.results + '|$)';
                break;

              case '=':
                sAdd = '(?=';
                iAdd = 3;
                tmp = this.#partialMatchRegex(source.slice(i + iAdd));
                iAdd += tmp.index;
                sAdd += tmp.results + ')';
                break;

              case '!':
                iAdd = 3;
                iAdd += this.#partialMatchRegex(source.slice(i + iAdd)).index;
                sAdd = source.slice(i, i + iAdd); // here
                break;

              case '<':
                switch (source[i + 3]) {
                  case '=':
                  case '!':
                    iAdd = 4;
                    iAdd += this.#partialMatchRegex(source.slice(i + iAdd)).index;
                    sAdd = source.slice(i, i + iAdd); // here
                    break;

                  default:
                    iAdd = source.indexOf('>', i) - i + 1;
                    sAdd = source.slice(i, i + iAdd);
                    tmp = this.#partialMatchRegex(source.slice(i + iAdd));
                    iAdd += tmp.index;
                    sAdd += tmp.results + '|$)';
                    break;
                }
                break;
            }
          } else {
            sAdd = source[i];
            iAdd = 1;
            tmp = this.#partialMatchRegex(source.slice(i + iAdd));
            iAdd += tmp.index;
            sAdd += tmp.results + '|$)';
          }
          break;

        case ')':
          i += 1;
          return {
            results,
            index: i
          };

        default:
          sAdd = source[i];
          iAdd = 1;
          break;
      }

      i += iAdd;
      results += sAdd;
    }

    return new RegExp(results, 'v');
  }
}
