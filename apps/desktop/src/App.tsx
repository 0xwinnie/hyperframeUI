// Renderer root. Phase 0: a placeholder splash to confirm the Electron +
// Vite + React + Moss-theme pipeline boots. The real three-pane layout
// lands in P0.4–0.6.

export function App(): JSX.Element {
  return (
    <div className="boot-splash">
      <div className="boot-splash__mark" aria-hidden />
      <div className="boot-splash__title">HyperframeUI</div>
      <div className="boot-splash__subtitle">Phase 0 — booting renderer</div>
      <div className="boot-splash__meta mono">
        electron {window.hs?.versions.electron ?? '—'} · node{' '}
        {window.hs?.versions.node ?? '—'} · {window.hs?.platform ?? 'unknown'}
      </div>
    </div>
  );
}
