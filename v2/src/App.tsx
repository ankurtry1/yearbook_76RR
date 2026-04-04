import { useMemo, useState } from 'react';
import { DesktopWriteBoard } from './components/desktop/DesktopWriteBoard';
import { MobileStoryDiscovery } from './components/mobile/MobileStoryDiscovery';
import { ReadWall } from './components/read/ReadWall';
import { useViewportMode } from './lib/hooks/useViewportMode';
import { MOCK_MEMOIRS, MOCK_ROSTER } from './data/mock/seed';
import type { SortMode, ViewMode } from './lib/utils/types';

export default function App() {
  const [view, setView] = useState<ViewMode>('write');
  const [sortMode, setSortMode] = useState<SortMode>('random');
  const viewport = useViewportMode();

  const memoirs = useMemo(() => {
    const items = [...MOCK_MEMOIRS];
    if (sortMode === 'newest') return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sortMode === 'unread') return items.sort((a, b) => Number(a.isRead) - Number(b.isRead));
    return items.sort(() => Math.random() - 0.5);
  }, [sortMode]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-script">The Yearbook</span>
          <span className="brand-sub">V2 prototype scaffold</span>
        </div>
        <nav className="mode-switch">
          <button className={view === 'write' ? 'mode-btn active' : 'mode-btn'} onClick={() => setView('write')}>Write</button>
          <button className={view === 'read' ? 'mode-btn active' : 'mode-btn'} onClick={() => setView('read')}>Read</button>
        </nav>
      </header>
      {view === 'write' ? (
        viewport === 'mobile' ? <MobileStoryDiscovery people={MOCK_ROSTER} /> : <DesktopWriteBoard people={MOCK_ROSTER} />
      ) : (
        <ReadWall memoirs={memoirs} sortMode={sortMode} setSortMode={setSortMode} />
      )}
    </div>
  );
}
