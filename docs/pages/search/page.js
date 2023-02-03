import { Page } from '@webformula/core';
import html from './page.html';

export default new class extends Page {
  onSearch_bound = this.onSearch.bind(this);

  constructor() {
    super();
  }

  template() {
    return this.renderTemplateString(html);
  }

  afterRender() {
    this.one();
    this.debounce();
    this.two();
    this.three();
    this.four();
    this.five();
    this.six();
    this.seven();
    this.eight();
    this.nine();
  }

  one() {
    const searchOne = document.querySelector('mdw-search#one');
    searchOne.registerSection('alt', 'Alt results');

    searchOne.registerTemplate(data => /*html*/`
      <mdw-list-item value="${data.value}">
        <mdw-avatar>A</mdw-avatar>
        ${data.primary}
      </mdw-list-item>
    `, 'default');

    searchOne.registerTemplate(data => /*html*/`
      <mdw-list-item value="${data.value}" class="mdw-line-two">
        <mdw-icon>inbox</mdw-icon>
        <div class="mdw-text">
          <div class="mdw-headline">${data.primary}</div>
          <div class="mdw-supporting-text">${data.secondary}</div>
        </div>
      </mdw-list-item>
    `, 'alt');


    // quick results
    searchOne.registerTemplate(data => /*html*/`
      <mdw-list-item value="${data.value}" class="mdw-line-two">
        <mdw-icon>inbox</mdw-icon>
        <div class="mdw-text">
          <div class="mdw-headline">${data.primary}</div>
          <div class="mdw-supporting-text">${data.secondary}</div>
        </div>
      </mdw-list-item>
    `, 'quick');

    document.querySelector('mdw-search#one').addEventListener('input', () => {
      searchOne.updateQuickResults([
        {
          value: 'four',
          primary: 'Four',
          secondary: 'Secondary',
          section: 'quick'
        },
        {
          value: 'five',
          primary: 'Five',
          secondary: 'Secondary',
          section: 'quick'
        },
        {
          value: 'six',
          primary: 'Six',
          secondary: 'Secondary',
          section: 'quick'
        }
      ].filter(v => v.primary.toLocaleLowerCase().includes(searchOne.searchValue)));
    });
    document.querySelector('mdw-search#one').addEventListener('search', this.onSearch_bound);
    document.querySelector('mdw-search#one').addEventListener('change', event => {
      console.log(event.target.value);
    });
    document.querySelector('mdw-search#one').addEventListener('filter', event => {
      console.log(event.target.filterValue);
    });
  }


  two() {
    document.querySelector('mdw-search#two').addEventListener('search', this.onSearch_bound);
  }

  debounce() {
    document.querySelector('mdw-search#debounce').addEventListener('search', this.onSearch_bound);
  }

  three() {
    document.querySelector('mdw-search#three').addEventListener('search', this.onSearch_bound);
  }

  four() {
    document.querySelector('mdw-search#four').addEventListener('search', this.onSearch_bound);
  }

  five() {
    document.querySelector('mdw-search#five').addEventListener('search', this.onSearch_bound);
  }

  six() {
    document.querySelector('mdw-search#six').addEventListener('search', this.onSearch_bound);
    document.querySelector('mdw-search#six').registerSection('alt', 'Alt results');
  }

  seven() {
    document.querySelector('mdw-search#seven').registerSection('alt', 'Alt results');

    document.querySelector('mdw-search#seven').registerTemplate(data => /*html*/`
      <mdw-list-item value="${data.value}">
        <mdw-avatar>A</mdw-avatar>
        ${data.primary}
      </mdw-list-item>
    `, 'default');

    document.querySelector('mdw-search#seven').registerTemplate(data => /*html*/`
      <mdw-list-item value="${data.value}" class="mdw-line-two">
        <mdw-icon>inbox</mdw-icon>
        <div class="mdw-text">
          <div class="mdw-headline">${data.primary}</div>
          <div class="mdw-supporting-text">${data.secondary}</div>
        </div>
      </mdw-list-item>
    `, 'alt');

    document.querySelector('mdw-search#seven').addEventListener('search', this.onSearch_bound);
  }


  eight() {
    document.querySelector('mdw-search#eight').registerTemplate(data => /*html*/`
      <mdw-list-item value="${data.value}">
        <mdw-avatar>A</mdw-avatar>
        ${data.primary}
      </mdw-list-item>
    `, 'default');

    // quick results
    document.querySelector('mdw-search#eight').registerTemplate(data => /*html*/`
      <mdw-list-item value="${data.value}" class="mdw-line-two">
        <mdw-icon>inbox</mdw-icon>
        <div class="mdw-text">
          <div class="mdw-headline">${data.primary}</div>
          <div class="mdw-supporting-text">${data.secondary}</div>
        </div>
      </mdw-list-item>
    `, 'quick');

    document.querySelector('mdw-search#eight').addEventListener('input', event => {
      event.target.updateQuickResults([
        {
          value: 'one',
          primary: 'One',
          secondary: 'Secondary',
          section: 'quick'
        },
        {
          value: 'two',
          primary: 'Two',
          secondary: 'Secondary',
          section: 'quick'
        },
        {
          value: 'three',
          primary: 'Three',
          secondary: 'Secondary',
          section: 'quick'
        }
      ].filter(v => v.primary.toLocaleLowerCase().includes(event.target.searchValue)));
    });
    document.querySelector('mdw-search#eight').addEventListener('search', this.onSearch_bound);
  }

  nine() {
    document.querySelector('mdw-search#nine').addEventListener('search', this.onSearch_bound);
  }

  async onSearch(event) {
    await this.wait(1000);
    event.target.updateSuggestions([
      {
        value: 'one',
        primary: 'One',
      },
      {
        value: 'two',
        primary: 'Two',
      },

      {
        value: 'three',
        primary: 'Three',
      },


      {
        value: 'onealt',
        primary: 'One Alt',
        section: 'alt'
      },
      {
        value: 'twoalt',
        primary: 'Two Alt',
        section: 'alt'
      },

      {
        value: 'threealt',
        primary: 'Three Alt',
        section: 'alt'
      },

      {
        value: 'four',
        primary: 'Four',
        secondary: 'Secondary',
        section: 'quick'
      },
      {
        value: 'five',
        primary: 'Five',
        secondary: 'Secondary',
        section: 'quick'
      },
      {
        value: 'six',
        primary: 'Six',
        secondary: 'Secondary',
        section: 'quick'
      }
    ].filter(v => v.primary.toLocaleLowerCase().includes(event.target.searchValue)));
  }

  async wait(time = 1000) {
    return new Promise(resolve => {
      setTimeout(resolve, time)
    });
  }
}
