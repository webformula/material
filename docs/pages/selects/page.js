import { Page } from '@webformula/pax-core';
import html from './page.html';

export default new class extends Page {
  constructor() {
    super();
  }

  template() {
    return this.renderTemplateString(html);
  }

  afterRender() {
    document.querySelector('#async-filter-select').addEventListener('filter', e => page.filter(e.target.display));
  }

  async filter(value) {
    const select = document.querySelector('#async-filter-select');

    await this.wait(500);
    select.optionValues = [
      {
        label: 'One',
        value: '1'
      },
      {
        label: 'Two',
        value: '2'
      },
      {
        label: 'Three',
        value: '3'
      },
      {
        label: 'Four',
        value: '4'
      },
      {
        label: 'Five',
        value: '5'
      },
      {
        label: 'Six',
        value: '6'
      },
      {
        label: 'Seven',
        value: '7'
      },
      {
        label: 'Eight',
        value: '8'
      },
      {
        label: 'Nine',
        value: '9'
      },
      {
        label: 'Ten',
        value: '10'
      }
    ].filter(v => v.label.toLowerCase().includes(value.toLowerCase().trim()));;
  }

  async filterOnEnter(value) {
    const select = document.querySelector('#select-filter-on-enter');

    if (!value) {
      select.options = [
        'One',
        'Two',
        'Three',
        'Four',
        'Five',
        'Six',
        'Seven',
        'Eight',
        'Nine',
        'Ten'
      ];
      return;
    }

    await this.wait(500);
    select.options = [
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
      'Nine',
      'Ten'
    ].filter(v => v.toLowerCase().includes(value.toLowerCase().trim()));
  }


  async wait(time = 1000) {
    return new Promise(resolve => {
      setTimeout(resolve, time)
    });
  }
}
