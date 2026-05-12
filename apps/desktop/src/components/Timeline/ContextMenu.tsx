import { useEffect } from 'react';
import type { Clip, TrackKind } from '@hyperframeui/core';
import { useProjectStore } from '../../store/project';
import { useTimelineStore } from '../../store/timeline';

interface ContextMenuProps {
  clip: Clip;
  trackKind: TrackKind;
  x: number;
  y: number;
  onClose(): void;
  onEditCaption(clip: Clip): void;
}

// A small floating menu shown on right-click of a clip. Items vary by track
// kind: captions also get "Edit text…". All destructive items defer to a
// confirm pattern at the call site.

export function ClipContextMenu({
  clip,
  trackKind,
  x,
  y,
  onClose,
  onEditCaption,
}: ContextMenuProps): JSX.Element {
  const applyOp = useProjectStore((s) => s.applyOp);
  const clearSelection = useTimelineStore((s) => s.clearSelection);

  useEffect(() => {
    const onClickAway = (event: globalThis.MouseEvent): void => {
      if (!(event.target as HTMLElement).closest('.tl-context')) onClose();
    };
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', onClickAway);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClickAway);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const onDelete = async (): Promise<void> => {
    onClose();
    await applyOp({ type: 'delete_clip', clipId: clip.id });
    clearSelection();
  };

  return (
    <div className="tl-context" style={{ left: x, top: y }} role="menu">
      {trackKind === 'caption' && (
        <button
          type="button"
          className="tl-context__item"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onClose();
            onEditCaption(clip);
          }}
        >
          Edit text…
        </button>
      )}
      <button
        type="button"
        className="tl-context__item tl-context__item--danger"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          void onDelete();
        }}
      >
        Delete clip
      </button>
    </div>
  );
}

interface CaptionEditDialogProps {
  clip: Clip;
  onClose(): void;
}

export function CaptionEditDialog({ clip, onClose }: CaptionEditDialogProps): JSX.Element {
  const applyOp = useProjectStore((s) => s.applyOp);
  const [text, setText] = useTextState(clip.text ?? '');

  const save = async (): Promise<void> => {
    if (text === clip.text) {
      onClose();
      return;
    }
    await applyOp({
      type: 'update_caption_text',
      captionId: clip.id,
      text,
    });
    onClose();
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog__title">Edit caption</div>
        <div className="dialog__body">
          <code className="dialog__code mono">{clip.id}</code>
          <textarea
            className="dialog__textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            autoFocus
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                void save();
              }
            }}
          />
        </div>
        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              void save();
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// Tiny local hook so the dialog stays self-contained.
function useTextState(initial: string): [string, (next: string) => void] {
  const [value, setValue] = useStateInternal(initial);
  return [value, setValue];
}

// Wrap useState to avoid pulling the import into the helper file's surface.
import { useState as useStateInternal } from 'react';
