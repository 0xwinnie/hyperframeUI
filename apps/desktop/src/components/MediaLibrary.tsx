import { useEffect, useMemo, useState } from 'react';
import { Trash, Upload } from '../icons';
import { useMediaStore } from '../store/media';
import { useProjectStore } from '../store/project';

// Media tab — grid of video + image clips from the project folder.
// The user adds files two ways:
//   1. Drop them into the folder in Finder (chokidar picks it up).
//   2. Click "Import" here to copy clips in via a native dialog.
// "Remove" trashes the file (uses macOS trash, recoverable).

export function MediaLibrary(): JSX.Element {
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

  const visible = useMemo(() => files.filter((f) => f.kind !== 'audio'), [files]);

  const [pendingRemove, setPendingRemove] = useState<MediaFile | null>(null);

  return (
    <div className="library">
      <header className="library__header">
        <div className="library__title-row">
          <div className="library__title">Media</div>
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

      <div className="library__grid">
        {visible.length === 0 && !loading && (
          <div className="library__empty mono">
            No video or image clips yet. Drop files into this folder, or click Import.
          </div>
        )}
        {visible.map((file) => (
          <MediaCard
            key={file.id}
            file={file}
            baseUrl={baseUrl}
            onAskRemove={() => setPendingRemove(file)}
          />
        ))}
      </div>

      {pendingRemove && projectRoot && (
        <RemoveDialog
          file={pendingRemove}
          onCancel={() => setPendingRemove(null)}
          onConfirm={async () => {
            const target = pendingRemove;
            setPendingRemove(null);
            await remove(projectRoot, target.relativePath);
          }}
        />
      )}
    </div>
  );
}

function MediaCard({
  file,
  baseUrl,
  onAskRemove,
}: {
  file: MediaFile;
  baseUrl: string | null;
  onAskRemove: () => void;
}): JSX.Element {
  const url = baseUrl ? `${baseUrl}/${encodeURI(file.relativePath)}` : null;
  return (
    <div className="media-card">
      <div className="media-card__thumb">
        {file.kind === 'image' && url && <img src={url} alt={file.name} loading="lazy" />}
        {file.kind === 'video' && url && (
          <video
            src={url}
            muted
            playsInline
            preload="metadata"
            // Loading the first frame as the poster is a Phase 1 stand-in
            // for proper ffmpeg-generated thumbnails (Phase 2).
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              try {
                v.currentTime = Math.min(0.1, v.duration);
              } catch {
                // ignore
              }
            }}
          />
        )}
        <span className={`media-card__badge media-card__badge--${file.kind}`}>
          {file.kind.toUpperCase()}
        </span>
        <button
          type="button"
          className="media-card__remove"
          onClick={onAskRemove}
          title="Remove from project"
        >
          <Trash size={12} />
        </button>
      </div>
      <div className="media-card__meta">
        <div className="media-card__name truncate" title={file.name}>
          {file.name}
        </div>
        <div className="media-card__sub mono">{formatSize(file.sizeBytes)}</div>
      </div>
    </div>
  );
}

function RemoveDialog({
  file,
  onCancel,
  onConfirm,
}: {
  file: MediaFile;
  onCancel: () => void;
  onConfirm: () => void;
}): JSX.Element {
  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog__title">Remove this clip from the project?</div>
        <div className="dialog__body">
          <code className="dialog__code mono">{file.relativePath}</code>
          <p className="dialog__hint">
            The file is moved to the Trash. You can restore it from there if needed.
          </p>
        </div>
        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Keep file
          </button>
          <button type="button" className="btn btn--danger" onClick={onConfirm}>
            Move to Trash
          </button>
        </div>
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
