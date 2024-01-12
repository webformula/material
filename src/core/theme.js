export async function generateBrowser() {
  if (!document.body) await new Promise(resolve => document.addEventListener('DOMContentLoaded', () => resolve()));

  // prefers-color-scheme
  const colorSchemePreferenceDisabled = document.querySelector('meta[name="mdw-theme-color-scheme-preference-disable"]');
  if (!colorSchemePreferenceDisabled) {
    const themePreferenceDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('mdw-theme-dark', themePreferenceDark);
    return;
  }

  // use localStorage or class
  const localStorageColorScheme = localStorage.getItem('mdw-color-scheme');
  const isDark = localStorageColorScheme === 'dark' || document.documentElement.classList.contains('mdw-theme-dark');
  document.documentElement.classList.toggle('mdw-theme-dark', isDark);
}
