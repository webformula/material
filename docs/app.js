import { routes } from '@webformula/core';
import '@webformula/material';

import home from './pages/home/page.js';
import styles from './pages/styles/page.js';
import badges from './pages/badges/page.js';
import bottomAppBars from './pages/bottom app bars/page.js';
import bottomSheets from './pages/bottom sheets/page.js';
import buttons from './pages/buttons/page.js';
import cards from './pages/cards/page.js';
import checkboxes from './pages/checkboxes/page.js';
import chips from './pages/chips/page.js';
import datePickers from './pages/date pickers/page.js';
import dialogs from './pages/dialogs/page.js';
import fabs from './pages/fabs/page.js';
import forms from './pages/forms/page.js';
import icons from './pages/icons/page.js';
import iconButtons from './pages/icon buttons/page.js';
import gettingStarted from './pages/getting started/page.js';
import lists from './pages/lists/page.js';
import menus from './pages/menus/page.js';
import navigations from './pages/navigations/page.js';
import progressIndicators from './pages/progress indicators/page.js';
import radios from './pages/radios/page.js';
import search from './pages/search/page.js';
import segmentedButtons from './pages/segmented buttons/page.js';
import selects from './pages/selects/page.js';
import sideSheets from './pages/side sheets/page.js';
import sliders from './pages/sliders/page.js';
import snackbars from './pages/snackbars/page.js';
import switches from './pages/switches/page.js';
import tabs from './pages/tabs/page.js';
import timePickers from './pages/time pickers/page.js';
import textFields from './pages/text fields/page.js';
import topAppBars from './pages/top app bars/page.js';
import tooltips from './pages/tooltips/page.js';
import utilities from './pages/utilities/page.js';
import notFound from './pages/not found/page.js';



routes([
  { path: '/', component: home },
  { path: '/styles', component: styles },
  { path: '/badges', component: badges },
  { path: '/bottom-app-bars', component: bottomAppBars },
  { path: '/bottom-sheets', component: bottomSheets },
  { path: '/buttons', component: buttons },
  { path: '/cards', component: cards },
  { path: '/checkboxes', component: checkboxes },
  { path: '/chips', component: chips },
  { path: '/date-pickers', component: datePickers },
  { path: '/dialogs', component: dialogs },
  { path: '/fabs', component: fabs },
  { path: '/forms', component: forms },
  { path: '/icons', component: icons },
  { path: '/icon-buttons', component: iconButtons },
  { path: '/getting-started', component: gettingStarted },
  { path: '/lists', component: lists },
  { path: '/menus', component: menus },
  { path: '/navigations', component: navigations },
  { path: '/progress-indicators', component: progressIndicators },
  { path: '/radios', component: radios },
  { path: '/search', component: search },
  { path: '/segmented-buttons', component: segmentedButtons },
  { path: '/selects', component: selects },
  { path: '/side-sheets', component: sideSheets },
  { path: '/sliders', component: sliders },
  { path: '/snackbars', component: snackbars },
  { path: '/switches', component: switches },
  { path: '/tabs', component: tabs },
  { path: '/time-pickers', component: timePickers },
  { path: '/text-fields', component: textFields },
  { path: '/top-app-bars', component: topAppBars },
  { path: '/tooltips', component: tooltips },
  { path: '/utilities', component: utilities },
  { path: '/not-found', component: notFound, notFound: true }
]);

if (typeof hljs !== 'undefined') hljs.highlightAll();
window.addEventListener('load', () => {
  hljs.highlightAll();
  if (location.hash) handleHashAnchor(location.hash, false);
});

window.addEventListener('locationchange', () => {
  setTimeout(() => {
    hljs.highlightAll();
    if (!location.hash) return;
    handleHashAnchor(location.hash, false);
  });
});


window.addEventListener('hashchange', () => {
  if (!location.hash) return;
  handleHashAnchor(location.hash);
  setTimeout(() => {
    hljs.highlightAll();
  });
});


function handleHashAnchor(hash, animate = true) {
  try {
    const element = document.querySelector(hash);
    if (element) {
      if (animate)  window.scroll({ top: element.offsetTop, behavior: 'smooth' });
      else window.scroll({ top: element.offsetTop });
    }
  } catch { console.log('error'); }
}


window.toggleColorScheme = () => {
  const scheme = mdwUtil.toggleColorScheme();
  setTimeout(() => {
    document.querySelectorAll('.theme-toggle').forEach(element => {
      if (scheme === 'dark') element.classList.add('mdw-toggled');
      else element.classList.remove('mdw-toggled');
    });
  }, 0);
};
