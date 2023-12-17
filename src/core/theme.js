export async function generateBrowser() {
  if (!document.body) await new Promise(resolve => document.addEventListener('DOMContentLoaded', () => resolve()));

  const computedStyle = getComputedStyle(document.body);
  if (!computedStyle.getPropertyValue('--mdw-primary')) console.error('No theme loaded');

  // handle theme light / dark
  const localStorageColorScheme = localStorage.getItem('mdw-color-scheme');
  if (['light', 'dark'].includes(localStorageColorScheme)) {
    document.documentElement.classList.toggle('mdw-theme-dark', localStorageColorScheme === dark);
  } else if (!document.documentElement.classList.contains('mdw-theme-dark')) {
    const htmlColorScheme = computedStyle.colorScheme;
    const themePreferenceDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('mdw-theme-dark', themePreferenceDark === true && htmlColorScheme !== 'light');
  }

  // do not run code below ofter initiation
  if (document.documentElement.classList.contains('mdw-initiated')) return;

  const pageContent = document.querySelector('#page-content') || document.querySelector('page-content');
  if (pageContent) {
    const computedStyle = getComputedStyle(pageContent);
    pageContent.style.setProperty('--mdw-page-content-padding-left', computedStyle.paddingLeft);
    pageContent.style.setProperty('--mdw-page-content-padding-right', computedStyle.paddingRight);
    pageContent.style.setProperty('--mdw-page-content-padding-top', computedStyle.paddingTop);
    pageContent.style.setProperty('--mdw-page-content-padding-bottom', computedStyle.paddingBottom);
    pageContent.style.padding = '';
    pageContent.style.paddingLeft = '';
    pageContent.style.paddingRight = '';
    pageContent.style.paddingTop = '';
    pageContent.style.paddingBottom = '';
  }

  document.documentElement.classList.add('mdw-initiated');
  setTimeout(() => {
    document.querySelector('body').classList.add('mdw-animation');
  }, 150);
}
