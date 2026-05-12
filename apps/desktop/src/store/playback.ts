import { create } from 'zustand';

// Playback store. PlayerStage registers an imperative controller on mount
// (play / pause / seek live on the @hyperframes/player web component);
// every other consumer (TransportBar, Timeline, agent tools later) reads
// state and dispatches actions through this store instead of holding a ref
// to the player element.

export interface PlayerController {
  play(): void;
  pause(): void;
  seek(seconds: number): void;
}

interface PlaybackStore {
  ready: boolean;
  paused: boolean;
  duration: number;
  currentTime: number;
  controller: PlayerController | null;
  setReady(ready: boolean, duration: number): void;
  setPaused(paused: boolean): void;
  setCurrentTime(t: number): void;
  setController(controller: PlayerController | null): void;
  play(): void;
  pause(): void;
  toggle(): void;
  seek(seconds: number): void;
  step(delta: number): void;
  reset(): void;
}

export const usePlaybackStore = create<PlaybackStore>((set, get) => ({
  ready: false,
  paused: true,
  duration: 0,
  currentTime: 0,
  controller: null,
  setReady: (ready, duration) => set({ ready, duration }),
  setPaused: (paused) => set({ paused }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setController: (controller) => set({ controller }),
  play: () => get().controller?.play(),
  pause: () => get().controller?.pause(),
  toggle: () => {
    const { controller, paused, ready } = get();
    if (!controller || !ready) return;
    paused ? controller.play() : controller.pause();
  },
  seek: (seconds) => {
    const { controller, duration } = get();
    if (!controller) return;
    controller.seek(Math.max(0, Math.min(seconds, duration || seconds)));
  },
  step: (delta) => {
    const { controller, currentTime, duration } = get();
    if (!controller) return;
    controller.seek(Math.max(0, Math.min(currentTime + delta, duration || currentTime + delta)));
  },
  reset: () =>
    set({ ready: false, paused: true, duration: 0, currentTime: 0, controller: null }),
}));
