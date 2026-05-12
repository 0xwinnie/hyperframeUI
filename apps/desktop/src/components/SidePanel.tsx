import { AudioLibrary } from './AudioLibrary';
import { ChatPanel } from './ChatPanel';
import type { RailTab } from './LeftRail';
import { MediaLibrary } from './MediaLibrary';

// Side panel — host for the chat / media / audio panel content.

interface SidePanelProps {
  tab: RailTab;
}

export function SidePanel({ tab }: SidePanelProps): JSX.Element {
  return (
    <aside className={`sidepanel sidepanel--${tab}`}>
      {tab === 'chat' && <ChatPanel />}
      {tab === 'media' && <MediaLibrary />}
      {tab === 'audio' && <AudioLibrary />}
    </aside>
  );
}
