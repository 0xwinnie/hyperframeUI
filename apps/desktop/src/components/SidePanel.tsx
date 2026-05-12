import { ChatPanel } from './ChatPanel';
import type { RailTab } from './LeftRail';

// Side panel — host for the chat / media / audio panel content.
// Chat is wired to the Agent SDK as of P0.9; media + audio remain stubs
// until the parser + asset model land in P1.

interface SidePanelProps {
  tab: RailTab;
}

const STUB_HEADINGS: Record<Exclude<RailTab, 'chat'>, { title: string; hint: string }> = {
  media: { title: 'Media', hint: 'Media library arrives in P1' },
  audio: { title: 'Audio', hint: 'Audio library arrives in P1' },
};

export function SidePanel({ tab }: SidePanelProps): JSX.Element {
  if (tab === 'chat') {
    return (
      <aside className="sidepanel sidepanel--chat">
        <ChatPanel />
      </aside>
    );
  }

  const { title, hint } = STUB_HEADINGS[tab];
  return (
    <aside className="sidepanel">
      <header className="sidepanel__header">
        <div className="sidepanel__title">{title}</div>
        <div className="sidepanel__hint mono">{hint}</div>
      </header>
      <div className="sidepanel__body" />
    </aside>
  );
}
