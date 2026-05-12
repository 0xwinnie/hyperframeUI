// Phase 0 placeholder for the open project. Once the real project loader
// lands in P1 (parser → ProjectState), the TopBar and side panels will read
// from the live Zustand store instead of this stub.

export interface DemoProject {
  name: string;
  duration: number; // seconds
  resolution: string;
  fps: number;
}

export const DEMO_PROJECT: DemoProject = {
  name: 'morning-coffee-vlog',
  duration: 84,
  resolution: '1920×1080',
  fps: 30,
};

export function formatTimecode(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}
