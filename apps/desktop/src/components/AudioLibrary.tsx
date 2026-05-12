import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Trash, Upload } from '../icons';
import { useMediaStore } from '../store/media';
import { useProjectStore } from '../store/project';

// Audio tab — vertical list of audio clips from the project folder.
// Same import/remove flow as Media; play is a thin <audio> wrapper for
// preview. Waveform rendering (offline FFT) lands later in Phase 2.

export function AudioLibrary(): JSX.Element {
  const projectStatus = useProjectStore((s) => s.status);
  const files = useMediaStore((s) => s.files);
  const baseUrl = useMediaStore((s) => s.baseUrl);
  const loading = useMediaStore((s) => s.loading);
  const error = useMediaStore((s) => s.error);
  const load = useMediaStore((s) => s.load);
  const watch = useMediaStore((s) => s.watch);
  const unwatch = useMediaStore((s) => s.unwatch);
  const importFiles = useMediaStore((s) => s.importFiles);
  const remove = useMediaStore((s) => s.remove);

  const projectRoot = projectStatus.kind === 'ready' ? projectStatus.project.root : null;

  useEffect(() => {
    if (!projectRoot) return;
    void load(projectRoot);
    watch(projectRoot);
    return () => {
      unwatch();
    };
  }, [projectRoot, load, watch, unwatch]);

  const visible = useMemo(() => files.filter((f) => f.kind === 'audio'), [files]);
  const [pendingRemove, setPendingRemove] = useState<MediaFile | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = (file: MediaFile): void => {
    const url = baseUrl ? `${baseUrl}/${encodeURI(file.relativePath)}` : null;
    if (!url) return;
    const el = audioRef.current ?? new Audio();
    audioRef.current = el;
    if (playingId === file.id) {
      el.pause();
      setPlayingId(null);
      return;
    }
    if (el.src !== url) el.src = url;
    el.onended = () => setPlayingId(null);
    void el.play();
    setPlayingId(file.id);
  };

  return (
    <div className="library">
      <header className="library__header">
        <div className="library__title-row">
          <div className="library__title">Audio</div>
          <span className="library__count mono">{visible.length}</span>
        </div>
        <button
          type="button"
          className="library__import-btn"
          disabled={!projectRoot}
          onClick={() => {
            if (projectRoot) void importFiles(projectRoot);
          }}
        >
          <Upload size={12} />
          Import
        </button>
      </header>

      {loading && <div className="library__hint mono">Scanning project…</div>}
      {error && <div className="library__hint library__hint--error mono">{error}</div>}

      <div className="library__list">
        {visible.length === 0 && !loading && (
          <div className="library__empty mono">
            No audio clips yet. Drop .m4a / .mp3 / .wav into this folder, or click Import.
          </div>
        )}
        {visible.map((file) => (
          <div className="audio-row" key={file.id}>
            <button
              type="button"
              className="audio-row__play"
              onClick={() => togglePlay(file)}
            >
              {playingId === file.id ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <div className="audio-row__meta">
              <div className="audio-row__name truncate" title={file.name}>
                {file.name}
              </div>
              <div className="audio-row__sub mono">{formatSize(file.sizeBytes)}</div>
            </div>
            <button
              type="button"
              className="audio-row__remove"
              onClick={() => setPendingRemove(file)}
              title="Remove from project"
            >
              <Trash size={12} />
            </button>
          </div>
        ))}
      </div>

      {pendingRemove && projectRoot && (
        <div className="dialog-backdrop" onClick={() => setPendingRemove(null)}>
          <div
            className="dialog"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog__title">Remove this audio clip from the project?</div>
            <div className="dialog__body">
              <code className="dialog__code mono">{pendingRemove.relativePath}</code>
              <p className="dialog__hint">
                The file is moved to the Trash. You can restore it from there if needed.
              </p>
            </div>
            <div className="dialog__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setPendingRemove(null)}
              >
                Keep file
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={async () => {
                  const t = pendingRemove;
                  setPendingRemove(null);
                  if (audioRef.current && playingId === t.id) {
                    audioRef.current.pause();
                    setPlayingId(null);
                  }
                  await remove(projectRoot, t.relativePath);
                }}
              >
                Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
