import { useEffect, useState } from 'react';
import { LeftRail, type RailTab } from './components/LeftRail';
import { PlayerPlaceholder } from './components/PlayerPlaceholder';
import { SidePanel } from './components/SidePanel';
import { TimelinePlaceholder } from './components/TimelinePlaceholder';
import { TopBar } from './components/TopBar';
import { applyTheme } from './theme/apply';
import { DEFAULT_THEME } from './theme/themes';

// Phase 0.4-0.6 shell. Real state wiring (Zustand store, ⌘Z stack, project
// loader) lands progressively in P0.7+ — see /docs/spec.md §11.

export function App(): JSX.Element {
  const [tab, setTab] = useState<RailTab>('chat');

  useEffect(() => {
    applyTheme(DEFAULT_THEME);
  }, []);

  return (
    <div className="shell">
      <TopBar />
      <div className="shell__body">
        <LeftRail active={tab} onChange={setTab} />
        <SidePanel tab={tab} />
        <PlayerPlaceholder />
      </div>
      <TimelinePlaceholder />
    </div>
  );
}
