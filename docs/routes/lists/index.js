import { Component } from '@webformula/core';
import html from './page.html';

export default class extends Component {
  static pageTitle = 'Lists';
  static html = html;

  #onSelectionMode_bound = this.#onSelectionMode.bind(this);
  #exitSelectionMode_bound = this.#exitSelectionMode.bind(this);

  constructor() {
    super();
  }

  afterRender() {
    document.querySelector('#swipe-actions').addEventListener('swipeactionstart', event => {
      event.target.remove();
    });

    const button = document.querySelector('wfc-list[selection-mode]');
    button.addEventListener('enter-selection-mode', this.#onSelectionMode_bound);
    button.addEventListener('exit-selection-mode', this.#exitSelectionMode_bound);
  }

  disconnectedCallback() {
    const button = document.querySelector('wfc-list[selection-mode]');
    button.removeEventListener('enter-selection-mode', this.#onSelectionMode_bound);
    button.removeEventListener('exit-selection-mode', this.#exitSelectionMode_bound);
  }

  exitSelectionMode() {
    this.#exitSelectionMode();
    document.querySelector('wfc-list[selection-mode]').exitSelectionMode();
  }

  #onSelectionMode() {
    const button = document.querySelector('#selection-mode-exit');
    button.style.opacity = '1';
    button.style.pointerEvents = 'all';
  }

  #exitSelectionMode() {
    const button = document.querySelector('#selection-mode-exit');
    button.style.opacity = '0';
    button.style.pointerEvents = 'none';
  }
}
