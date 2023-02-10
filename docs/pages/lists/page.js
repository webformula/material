import { Page } from '@webformula/core';
import html from './page.html';

export default new class extends Page {
  pageTitle = 'Lists';

  constructor() {
    super();
  }

  template() {
    return this.renderTemplateString(html);
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
