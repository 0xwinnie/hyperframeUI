import type { RailTab } from './LeftRail';

// Side panel — host for the chat / media / audio panel content.
// Phase 0 renders placeholders; the real ChatPanel/MediaLibrary/AudioLibrary
// land in P0.9 and beyond.

interface SidePanelProps {
  tab: RailTab;
}

const HEADINGS: Record<RailTab, { title: string; hint: string }> = {
  chat: { title: 'Claude', hint: 'Chat panel arrives in P0.9' },
  media: { title: 'Media', hint: 'Media library arrives in P1' },
  audio: { title: 'Audio', hint: 'Audio library arrives in P1' },
};

export function SidePanel({ tab }: SidePanelProps): JSX.Element {
  const { title, hint } = HEADINGS[tab];
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
