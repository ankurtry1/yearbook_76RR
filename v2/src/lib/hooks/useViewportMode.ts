import { useEffect, useState } from 'react';
export function useViewportMode() {
  const getMode = () => (window.innerWidth < 768 ? 'mobile' : 'desktop');
  const [mode, setMode] = useState<'mobile' | 'desktop'>(getMode);
  useEffect(() => { const onResize = () => setMode(getMode()); window.addEventListener('resize', onResize); return () => window.removeEventListener('resize', onResize); }, []);
  return mode;
}
