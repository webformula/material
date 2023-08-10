import '@webformula/material';

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
  console.log('handleHashAnchor')
  try {
    const element = document.querySelector(hash);
    if (element) {
      if (animate)  document.documentElement.scroll({ top: element.offsetTop, behavior: 'smooth' });
      else document.documentElement.scroll({ top: element.offsetTop });
    }
  } catch(e) { console.log('error', e); }
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
