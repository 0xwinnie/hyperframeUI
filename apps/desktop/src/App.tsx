import { useEffect, useState } from 'react';
import { LeftRail, type RailTab } from './components/LeftRail';
import { PlayerStage } from './components/PlayerStage';
import { SidePanel } from './components/SidePanel';
import { TimelinePlaceholder } from './components/TimelinePlaceholder';
import { TopBar } from './components/TopBar';
import { useProjectStore } from './store/project';
import { applyTheme } from './theme/apply';
import { DEFAULT_THEME } from './theme/themes';

// Phase 0/1 shell. On mount we apply the default theme, then fetch the demo
// project path from the main process and ask the store to load it.

export function App(): JSX.Element {
  const [tab, setTab] = useState<RailTab>('chat');
  const loadProject = useProjectStore((s) => s.load);

  useEffect(() => {
    applyTheme(DEFAULT_THEME);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const projectPath = await window.hs?.env.getDemoProjectPath();
      if (cancelled || !projectPath) return;
      await loadProject(projectPath);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadProject]);

  return (
    <div className="shell">
      <TopBar />
      <div className="shell__body">
        <LeftRail active={tab} onChange={setTab} />
        <SidePanel tab={tab} />
        <PlayerStage />
      </div>
      <TimelinePlaceholder />
    </div>
  );
}
