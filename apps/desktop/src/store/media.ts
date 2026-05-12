import { create } from 'zustand';

// Media store. Holds the latest filesystem scan of media files in the
// active project + the base URL used to serve them. Subscribes to push
// notifications from main when chokidar detects filesystem changes.

interface MediaStore {
  files: MediaFile[];
  baseUrl: string | null;
  loading: boolean;
  error: string | null;
  /** Active subscription so we tear it down on unmount / project switch. */
  unsubscribe: (() => void) | null;
  load(projectRoot: string): Promise<void>;
  watch(projectRoot: string): void;
  unwatch(): void;
  importFiles(projectRoot: string): Promise<void>;
  remove(projectRoot: string, relativePath: string): Promise<void>;
}

export const useMediaStore = create<MediaStore>((set, get) => ({
  files: [],
  baseUrl: null,
  loading: false,
  error: null,
  unsubscribe: null,

  async load(projectRoot) {
    if (!window.hs?.media) {
      set({ error: 'Media bridge not available' });
      return;
    }
    set({ loading: true, error: null });
    try {
      const result = await window.hs.media.list(projectRoot);
      set({ files: result.files, baseUrl: result.baseUrl, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  watch(projectRoot) {
    const bridge = window.hs?.media;
    if (!bridge) return;
    // Re-subscribing replaces the previous listener.
    get().unsubscribe?.();
    const off = bridge.onChanged((payload) => {
      set({ files: payload.files });
    });
    set({ unsubscribe: off });
    void bridge.watch(projectRoot);
  },

  unwatch() {
    get().unsubscribe?.();
    set({ unsubscribe: null });
    void window.hs?.media.unwatch();
  },

  async importFiles(projectRoot) {
    const result = await window.hs?.media.import(projectRoot);
    if (!result || !result.ok) {
      if (result && 'error' in result) {
        set({ error: result.error });
      }
      return;
    }
    // The chokidar watcher will refresh the list shortly. As a belt-and-
    // braces fallback (e.g. if the user isn't on Media when the import
    // fires) we also re-fetch explicitly.
    await get().load(projectRoot);
  },

  async remove(projectRoot, relativePath) {
    const result = await window.hs?.media.remove(projectRoot, relativePath);
    if (!result || !result.ok) {
      if (result && 'error' in result) {
        set({ error: result.error });
      }
      return;
    }
    await get().load(projectRoot);
  },
}));
