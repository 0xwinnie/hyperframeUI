import { Folder, Plus, Sparkle2 } from '../icons';
import { useProjectStore } from '../store/project';

// Welcome screen — shown when no project is open. Two primary calls to
// action: create a new project folder, or open an existing one. The chrome
// (TopBar, LeftRail, Timeline) is intentionally hidden behind this view to
// keep the cold-start experience focused.

export function Welcome(): JSX.Element {
  const createAndLoad = useProjectStore((s) => s.createAndLoad);
  const pickAndLoad = useProjectStore((s) => s.pickAndLoad);

  return (
    <div className="welcome">
      <div className="welcome__card">
        <div className="welcome__brand" aria-hidden>
          <div className="welcome__mark">
            <Sparkle2 size={20} stroke={2} style={{ color: '#fff' }} />
          </div>
          <span className="welcome__wordmark">HyperframeUI</span>
        </div>

        <h1 className="welcome__title">Where would you like to start?</h1>
        <p className="welcome__subtitle">
          Pick a new folder for raw clips, or reopen a project you've worked on before.
        </p>

        <div className="welcome__actions">
          <button
            type="button"
            className="welcome__cta welcome__cta--primary"
            onClick={() => {
              void createAndLoad();
            }}
          >
            <Plus size={18} />
            <span className="welcome__cta-label">
              <span className="welcome__cta-title">New project</span>
              <span className="welcome__cta-hint mono">
                Create a folder. Drop your raw clips into it.
              </span>
            </span>
          </button>

          <button
            type="button"
            className="welcome__cta"
            onClick={() => {
              void pickAndLoad();
            }}
          >
            <Folder size={18} />
            <span className="welcome__cta-label">
              <span className="welcome__cta-title">Open existing</span>
              <span className="welcome__cta-hint mono">
                Pick a folder with an <code>index.html</code> already in it.
              </span>
            </span>
          </button>
        </div>

        <p className="welcome__footnote mono">
          Once a project is open, ask Claude to import, transcribe, or cut.
        </p>
      </div>
    </div>
  );
}
