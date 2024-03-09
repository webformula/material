import '@webformula/material';

if (typeof hljs !== 'undefined') {
  hljs.configure({ ignoreUnescapedHTML: true });
  hljs.highlightAll();
}
window.addEventListener('load', () => {
  hljs.configure({ ignoreUnescapedHTML: true });
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
      if (animate)  document.documentElement.scroll({ top: element.offsetTop, behavior: 'smooth' });
      else document.documentElement.scroll({ top: element.offsetTop });
    }
  } catch(e) { console.log('error', e); }
}


window.toggleColorScheme = () => {
  const scheme = wfcUtil.toggleColorScheme();
  setTimeout(() => {
    document.querySelectorAll('.theme-toggle').forEach(element => {
      if (scheme === 'dark') element.classList.add('wfc-toggled');
      else element.classList.remove('wfc-toggled');
    });
  }, 0);
};
