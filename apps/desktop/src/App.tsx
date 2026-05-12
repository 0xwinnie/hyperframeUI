import { useEffect, useState } from 'react';
import { LeftRail, type RailTab } from './components/LeftRail';
import { PlayerStage } from './components/PlayerStage';
import { SidePanel } from './components/SidePanel';
import { Timeline } from './components/Timeline/Timeline';
import { TopBar } from './components/TopBar';
import { Welcome } from './components/Welcome';
import { useChatStore } from './store/chat';
import { useProjectStore } from './store/project';
import { applyTheme } from './theme/apply';
import { DEFAULT_THEME } from './theme/themes';

// Phase 0/1 shell. Mount applies the Moss theme + auto-loads the demo
// project when HFUI_DEMO_PROJECT is set. When no project is loaded, the
// Welcome screen takes over the window; otherwise the standard three-pane
// workbench renders.

export function App(): JSX.Element {
  const [tab, setTab] = useState<RailTab>('chat');
  const status = useProjectStore((s) => s.status);
  const loadProject = useProjectStore((s) => s.load);
  const noticeProjectChange = useChatStore((s) => s.noticeProjectChange);

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

  // Project-change side effects (reset agent session + add system notice)
  // live here so they fire even when ChatPanel isn't mounted.
  const projectRoot = status.kind === 'ready' ? status.project.root : null;
  useEffect(() => {
    void noticeProjectChange(projectRoot);
  }, [projectRoot, noticeProjectChange]);

  if (status.kind === 'idle') {
    return <Welcome />;
  }

  return (
    <div className="shell">
      <TopBar />
      <div className="shell__body">
        <LeftRail active={tab} onChange={setTab} />
        <SidePanel tab={tab} />
        <PlayerStage />
      </div>
      <Timeline />
    </div>
  );
}
