export async function generateBrowser() {
  if (!document.body) await new Promise(resolve => document.addEventListener('DOMContentLoaded', () => resolve()));

  const localStorageColorScheme = localStorage.getItem('mdw-color-scheme');
  const colorSchemePreferenceDisabled = document.querySelector('meta[name="description"]');
  if (['light', 'dark'].includes(localStorageColorScheme)) {
    document.documentElement.classList.toggle('mdw-theme-dark', localStorageColorScheme === 'dark');
  } else if (!colorSchemePreferenceDisabled && !window.mdwMaterialDisableColorThemePreference && !document.documentElement.classList.contains('mdw-theme-dark')) {
    const themePreferenceDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('mdw-theme-dark', themePreferenceDark);
  }
}
