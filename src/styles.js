import core from './core/core.css' assert { type: 'css' };
import typography from './core/typography.css' assert { type: 'css' };
import elevations from './core/elevations.css' assert { type: 'css' };
import pageContent from './core/page-content.css' assert { type: 'css' };
import anchor from './core/anchor.css' assert { type: 'css' };

import badge from './components/badge/component.css' assert { type: 'css' };
import bottomAppBar from './components/bottom-app-bar/component.css' assert { type: 'css' };
import bottomSheet from './components/bottom-sheet/component.css' assert { type: 'css' };
import card from './components/card/card.css' assert { type: 'css' };
import cardGroup from './components/card/group.css' assert { type: 'css' };
import checkbox from './components/checkbox/global.css' assert { type: 'css' };
import chipGroup from './components/chip/chip-group.css' assert { type: 'css' };
import datePickerDesktopRange from './components/date-picker/desktop-range.css' assert { type: 'css' };
import datePickerDesktop from './components/date-picker/desktop.css' assert { type: 'css' };
import datePickerMobileRange from './components/date-picker/mobile-range.css' assert { type: 'css' };
import datePickerMobile from './components/date-picker/mobile.css' assert { type: 'css' };
import dialog from './components/dialog/component.css' assert { type: 'css' };
import icon from './components/icon/component.css' assert { type: 'css' };
import list from './components/list/list.css' assert { type: 'css' };
import menu from './components/menu/component.css' assert { type: 'css' };
import navigation from './components/navigation/navigation.css' assert { type: 'css' };
import navigationAnchor from './components/navigation/anchor-global.css' assert { type: 'css' };
import navigationButton from './components/navigation/navigation-button.css' assert { type: 'css' };
import navigationGroup from './components/navigation/navigation-group.css' assert { type: 'css' };
import panel from './components/panel/component.css' assert { type: 'css' };
import radioGroup from './components/radio/group.css' assert { type: 'css' };
import scrim from './components/scrim/component.css' assert { type: 'css' };
import search from './components/search/search-global.css' assert { type: 'css' };
import segmentedButtonGroup from './components/segmented-button-group/segmented-button-group.css' assert { type: 'css' };
import sideSheet from './components/side-sheet/component.css' assert { type: 'css' };
import snackbar from './components/snackbar/component.css' assert { type: 'css' };
import suggestions from './components/search/suggestions.css' assert { type: 'css' };
import tab from './components/tab/tab.css' assert { type: 'css' };
import tabBar from './components/tab/tab-bar.css' assert { type: 'css' };
import tabContent from './components/tab/tab-content.css' assert { type: 'css' };
import tabPanel from './components/tab/tab-panel.css' assert { type: 'css' };
import textfield from './components/textfield/component.css' assert { type: 'css' };
import timePicker from './components/time-picker/component.css' assert { type: 'css' };
import tooltip from './components/tooltip/component.css' assert { type: 'css' };
import topAppBar from './components/top-app-bar/component.css' assert { type: 'css' };

import anchorShadowRoot from './components/navigation/anchor.css' assert { type: 'css' };
import avatarShadowRoot from './components/avatar/component.css' assert { type: 'css' };
import buttonShadowRoot from './components/button/component.css' assert { type: 'css' };
import checkboxShadowRoot from './components/checkbox/component.css' assert { type: 'css' };
import chipShadowRoot from './components/chip/chip.css' assert { type: 'css' };
import fabShadowRoot from './components/fab/component.css' assert { type: 'css' };
import optionShadowRoot from './components/select/option.css' assert { type: 'css' };
import progressCircularShadowRoot from './components/progress-circular/component.css' assert { type: 'css' };
import progressLinearShadowRoot from './components/progress-linear/component.css' assert { type: 'css' };
import radioShadowRoot from './components/radio/radio.css' assert { type: 'css' };
import rangeShadowRoot from './components/slider/range.css' assert { type: 'css' };
import searchShadowRoot from './components/search/search.css' assert { type: 'css' };
import segmentedButtonShadowRoot from './components/segmented-button-group/segmented-button.css' assert { type: 'css' };
import selectShadowRoot from './components/select/select.css' assert { type: 'css' };
import sliderShadowRoot from './components/slider/slider.css' assert { type: 'css' };
import switchShadowRoot from './components/switch/component.css' assert { type: 'css' };


document.adoptedStyleSheets = [
  ...document.adoptedStyleSheets,
  core,
  typography,
  elevations,
  pageContent,
  anchor,
  badge,
  bottomAppBar,
  bottomSheet,
  card,
  cardGroup,
  checkbox,
  chipGroup,
  datePickerDesktopRange,
  datePickerDesktop,
  datePickerMobileRange,
  datePickerMobile,
  dialog,
  icon,
  list,
  menu,
  navigation,
  navigationAnchor,
  navigationButton,
  navigationGroup,
  panel,
  radioGroup,
  scrim,
  search,
  segmentedButtonGroup,
  sideSheet,
  snackbar,
  suggestions,
  tab,
  tabBar,
  tabContent,
  tabPanel,
  textfield,
  timePicker,
  tooltip,
  topAppBar
];

export {
  avatarShadowRoot,
  buttonShadowRoot,
  checkboxShadowRoot,
  chipShadowRoot,
  fabShadowRoot,
  anchorShadowRoot,
  panel as panelShadowRoot,
  progressCircularShadowRoot,
  progressLinearShadowRoot,
  radioShadowRoot,
  searchShadowRoot,
  segmentedButtonShadowRoot,
  optionShadowRoot,
  selectShadowRoot,
  textfield as textfieldShadowRoot,
  rangeShadowRoot,
  sliderShadowRoot,
  switchShadowRoot
};

document.querySelector('html').classList.add('mdw-initiated');
