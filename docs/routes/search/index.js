import { Component } from '@webformula/core';
import html from './page.html';

export default class extends Component {
  static title = 'Search';
  static html = html;


  constructor() {
    super();
  }

  afterRender() {
    this.one();
    this.two();
    this.three();
    this.four();
  }

  one() {
    const searchOne = document.querySelector('#one');
    searchOne.addEventListener('change', () => console.log(searchOne.selected));
    searchOne.addEventListener('search', async () => {
      await this.wait(500);
      if (!searchOne.value) {
        searchOne.results = [];
        searchOne.suggestions = [];
        return;
      }

      searchOne.results = [
        {
          value: 'one',
          display: 'One',
          icon: 'inbox'
        },
        {
          value: 'two',
          display: 'Two',
          container: 'secondary'
        },
        {
          value: 'three',
          display: 'Three',
          icon: 'inbox'
        },
        {
          value: 'four',
          display: 'Four',
          container: 'secondary'
        },
        {
          value: 'five',
          display: 'Five',
          icon: 'inbox'
        },
        {
          value: 'six',
          display: 'Six',
          icon: 'inbox'
        },
        {
          value: 'seven',
          display: 'Seven',
          container: 'secondary'
        },
        {
          value: 'eight',
          display: 'Eight',
          icon: 'inbox'
        },
        {
          value: 'nine',
          display: 'Nine',
          container: 'secondary'
        },
        {
          value: 'ten',
          display: 'Ten',
          icon: 'inbox'
        }
      ].filter(v => v.display.toLocaleLowerCase().includes(searchOne.value));


      searchOne.suggestions = [
        {
          value: 'one'
        },
        {
          value: 'two'
        },
        {
          value: 'three'
        },
        {
          value: 'four'
        },
        {
          value: 'five'
        }
      ].filter(v => v.value.toLocaleLowerCase().includes(searchOne.value));
    });
  }


  two() {
    const searchTwo = document.querySelector('#two');
    searchTwo.suggestions = [
      {
        value: 'one'
      },
      {
        value: 'two'
      },
      {
        value: 'three'
      },
      {
        value: 'four'
      },
      {
        value: 'five'
      }
    ].filter(v => v.value.toLocaleLowerCase().includes(searchTwo.value));
    searchTwo.suggestions = [];
    searchTwo.addEventListener('search', () => {
      if (!searchTwo.value) return searchTwo.results = [];
      searchTwo.results = [
        {
          value: 'one',
          display: 'One',
          icon: 'inbox'
        },
        {
          value: 'two',
          display: 'Two',
          icon: 'inbox'
        },
        {
          value: 'three',
          display: 'Three',
          icon: 'inbox'
        },
        {
          value: 'four',
          display: 'Four',
          icon: 'inbox'
        },
        {
          value: 'five',
          display: 'Five',
          icon: 'inbox'
        },
        {
          value: 'six',
          display: 'Six',
          icon: 'inbox'
        },
        {
          value: 'seven',
          display: 'Seven',
          icon: 'inbox'
        },
        {
          value: 'eight',
          display: 'Eight',
          icon: 'inbox'
        },
        {
          value: 'nine',
          display: 'Nine',
          icon: 'inbox'
        },
        {
          value: 'ten',
          display: 'Ten',
          icon: 'inbox'
        }
      ].filter(v => v.display.toLocaleLowerCase().includes(searchTwo.value));
    });
  }

  three() {
    const searchThree = document.querySelector('#three');
    searchThree.addEventListener('search', () => {
      if (!searchThree.value) return searchThree.results = [];
      searchThree.results = [
        {
          value: 'one',
          display: 'One',
          icon: 'inbox'
        },
        {
          value: 'two',
          display: 'Two',
          icon: 'inbox'
        },
        {
          value: 'three',
          display: 'Three',
          icon: 'inbox'
        },
        {
          value: 'four',
          display: 'Four',
          icon: 'inbox'
        },
        {
          value: 'five',
          display: 'Five',
          icon: 'inbox'
        },
        {
          value: 'six',
          display: 'Six',
          icon: 'inbox'
        },
        {
          value: 'seven',
          display: 'Seven',
          icon: 'inbox'
        },
        {
          value: 'eight',
          display: 'Eight',
          icon: 'inbox'
        },
        {
          value: 'nine',
          display: 'Nine',
          icon: 'inbox'
        },
        {
          value: 'ten',
          display: 'Ten',
          icon: 'inbox'
        }
      ].filter(v => v.display.toLocaleLowerCase().includes(searchThree.value));
    });
  }

  four() {
    const searchFour = document.querySelector('#four');
    searchFour.addEventListener('change', () => console.log(searchFour.selected));
    searchFour.addEventListener('search', () => {
      if (!searchFour.value) {
        searchFour.results = [];
        searchFour.suggestions = [];
        return;
      }

      searchFour.results = [
        {
          value: 'one',
          display: 'One',
          icon: 'inbox',
          container: 'primary'
        },
        {
          value: 'two',
          display: 'Two',
          container: 'secondary'
        },
        {
          value: 'three',
          display: 'Three',
          icon: 'inbox',
          container: 'primary'
        },
        {
          value: 'four',
          display: 'Four',
          container: 'secondary'
        },
        {
          value: 'five',
          display: 'Five',
          icon: 'inbox',
          container: 'primary'
        },
        {
          value: 'six',
          display: 'Six',
          icon: 'inbox',
          container: 'primary'
        },
        {
          value: 'seven',
          display: 'Seven',
          container: 'secondary'
        },
        {
          value: 'eight',
          display: 'Eight',
          icon: 'inbox',
          container: 'primary'
        },
        {
          value: 'nine',
          display: 'Nine',
          container: 'secondary'
        },
        {
          value: 'ten',
          display: 'Ten',
          icon: 'inbox',
          container: 'primary'
        }
      ].filter(v => v.display.toLocaleLowerCase().includes(searchFour.value));


      searchFour.suggestions = [
        {
          value: 'one'
        },
        {
          value: 'two'
        },
        {
          value: 'three'
        },
        {
          value: 'four'
        },
        {
          value: 'five'
        }
      ].filter(v => v.value.toLocaleLowerCase().includes(searchFour.value));
    });
  }

  async wait(time = 1000) {
    return new Promise(resolve => {
      setTimeout(resolve, time)
    });
  }
}
