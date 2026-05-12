import type { ReactNode } from 'react';
import { Film, Music, Settings, Sparkle } from '../icons';

// Left rail (72px wide). Three tab buttons — Claude, Media, Audio — plus a
// settings footer. Ported from hs-app.jsx <LeftRail>. State lifted to App.

export type RailTab = 'chat' | 'media' | 'audio';

interface RailItem {
  id: RailTab;
  icon: ReactNode;
  label: string;
  badge?: number;
  count?: number;
}

const ITEMS: readonly RailItem[] = [
  { id: 'chat', icon: <Sparkle size={18} />, label: 'Claude', badge: 1 },
  { id: 'media', icon: <Film size={18} />, label: 'Media', count: 0 },
  { id: 'audio', icon: <Music size={18} />, label: 'Audio', count: 0 },
];

interface LeftRailProps {
  active: RailTab;
  onChange: (next: RailTab) => void;
}

export function LeftRail({ active, onChange }: LeftRailProps): JSX.Element {
  return (
    <nav className="leftrail" aria-label="Workspace tabs">
      {ITEMS.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            className={`leftrail__item${isActive ? ' is-active' : ''}`}
            onClick={() => onChange(item.id)}
            aria-pressed={isActive}
          >
            {item.icon}
            <span className="leftrail__label">{item.label}</span>
            {item.badge !== undefined && <span className="leftrail__badge">{item.badge}</span>}
            {isActive && <span className="leftrail__indicator" aria-hidden />}
          </button>
        );
      })}

      <div className="leftrail__spacer" />

      <button type="button" className="leftrail__settings" title="Settings">
        <Settings size={16} />
      </button>
    </nav>
  );
}
