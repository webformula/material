import { registerPage, enableLinkIntercepts } from '@webformula/core/client';
enableLinkIntercepts();

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




registerPage(home, '/');
registerPage(styles, '/styles');
registerPage(badges, '/badges');
registerPage(bottomAppBars, '/bottom-app-bars');
registerPage(bottomSheets, '/bottom-sheets');
registerPage(buttons, '/buttons');
registerPage(cards, '/cards');
registerPage(checkboxes, '/checkboxes');
registerPage(chips, '/chips');
registerPage(datePickers, '/date-pickers');
registerPage(dialogs, '/dialogs');
registerPage(fabs, '/fabs');
registerPage(forms, '/forms');
registerPage(icons, '/icons');
registerPage(iconButtons, '/icon-buttons');
registerPage(gettingStarted, '/getting-started');
registerPage(lists, '/lists');
registerPage(menus, '/menus');
registerPage(navigations, '/navigations');
registerPage(progressIndicators, '/progress-indicators');
registerPage(radios, '/radios');
registerPage(search, '/search');
registerPage(segmentedButtons, '/segmented-buttons');
registerPage(selects, '/selects');
registerPage(sideSheets, '/side-sheets');
registerPage(sliders, '/sliders');
registerPage(snackbars, '/snackbars');
registerPage(switches, '/switches');
registerPage(tabs, '/tabs');
registerPage(timePickers, '/time-pickers');
registerPage(textFields, '/text-fields');
registerPage(topAppBars, '/top-app-bars');
registerPage(tooltips, '/tooltips');
registerPage(utilities, '/utilities');

registerPage(notFound, '/not-found', { notFound: true });



window.addEventListener('load', () => {
  hljs.highlightAll();
  if (location.hash) {
    setTimeout(() => {
      handleHashAnchor(location.hash, false);
    });
  }
});

window.addEventListener('locationchange', () => {
  setTimeout(() => {
    hljs.highlightAll();
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
