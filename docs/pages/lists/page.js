import { Component } from '@webformula/core';
import html from './page.html';
import '@webformula/material/components/list';
import '@webformula/material/components/avatar';

export default class extends Component {
  static title = 'Lists';
  static html = html;

  constructor() {
    super();
  }

  afterRender() {
    document.querySelector('#post-icon-actions-list').addEventListener('change', (event) => {
      console.log(event.detail);
      if (event.detail?.action === 'delete') {
        console.log('delete action on list-item', event.detail)
      }

      if (event.detail?.action === 'edit') {
        console.log('delete action on list-item', event.detail)
      }
    });

    document.querySelector('#swipe-actions-list').addEventListener('change', (event) => {
      console.log(event.detail);
      if (event.detail?.action === 'delete') {
        console.log('delete action on list-item', event.detail)
      }

      if (event.detail?.action === 'edit') {
        console.log('delete action on list-item', event.detail)
      }
    });
  }

  selectChange(value) {
    console.log('select value', value);
  }

  selectMultipleChange(value) {
    console.log('select value', value);
  }
}
