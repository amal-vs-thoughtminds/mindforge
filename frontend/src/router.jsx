import { useEffect, useState } from 'react';

// Minimal history-API router: enough for "/", "/teams" and "/teams/:id".
export function navigate(to) {
  window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
  if (!to.includes('#')) window.scrollTo(0, 0);
}

export function usePath() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return path;
}

export function Link({ to, onClick, ...props }) {
  const handle = (e) => {
    onClick?.(e);
    // Let the browser handle new-tab clicks and in-page anchors on the home page.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (to.startsWith('/#') && window.location.pathname === '/') return;
    e.preventDefault();
    navigate(to);
  };
  return <a href={to} onClick={handle} {...props} />;
}
