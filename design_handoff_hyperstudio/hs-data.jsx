// Project data — the "morning coffee vlog" demo project.
// Times in seconds. Timeline range is 0..84s (1:24).

const PROJECT = {
  name: 'morning-coffee-vlog',
  path: '~/Movies/Hyperframes/morning-coffee-vlog',
  duration: 84.0,
  fps: 30,
  resolution: '1920×1080',
  aspect: '16:9',
};

const PLAYHEAD = 28.4;

const TRACKS = [
  {
    id: 'a-roll', label: 'A-Roll', kind: 'video', color: 'orange', height: 56,
    clips: [
      { id: 'a1', start: 0,    end: 14,   name: 'IMG_0413', src: 'IMG_0413.mp4', thumb: 0 },
      { id: 'a2', start: 14,   end: 28.4, name: 'IMG_0414', src: 'IMG_0414.mp4', thumb: 1 },
      { id: 'a3', start: 28.4, end: 46,   name: 'IMG_0418', src: 'IMG_0418.mp4', thumb: 2, pulse: true },
      { id: 'a4', start: 46,   end: 64,   name: 'IMG_0421', src: 'IMG_0421.mp4', thumb: 3 },
      { id: 'a5', start: 64,   end: 84,   name: 'IMG_0427', src: 'IMG_0427.mp4', thumb: 4 },
    ],
  },
  {
    id: 'b-roll', label: 'B-Roll', kind: 'video', color: 'violet', height: 56,
    clips: [
      { id: 'b1', start: 8,    end: 14,  name: 'cup-pour',   src: 'cup-pour.mp4',  thumb: 5 },
      { id: 'b2', start: 36,   end: 42,  name: 'cup-steam',  src: 'cup-steam.mp4', thumb: 6 },
      { id: 'b3', start: 70,   end: 78,  name: 'beans-top',  src: 'beans-top.mp4', thumb: 7 },
    ],
  },
  {
    id: 'music', label: 'Music', kind: 'audio', color: 'green', height: 44,
    clips: [
      { id: 'm1', start: 0, end: 84, name: 'morning.wav', waveform: 'long' },
    ],
  },
  {
    id: 'captions', label: 'Captions', kind: 'caption', color: 'amber', height: 36,
    clips: [
      { id: 'c1',  start: 1,    end: 4,    text: 'So I bought a hand grinder' },
      { id: 'c2',  start: 4,    end: 7,    text: 'and it changed everything' },
      { id: 'c3',  start: 8,    end: 11,   text: 'about my morning routine' },
      { id: 'c4',  start: 14,   end: 18,   text: "Today's beans — Ethiopian Yirgacheffe" },
      { id: 'c5',  start: 19,   end: 23,   text: 'Light roast, fruity, citrus notes' },
      { id: 'c6',  start: 24,   end: 28,   text: 'I grind about 18 grams' },
      { id: 'c7',  start: 29,   end: 33,   text: "First pour — bloom for 30 seconds" },
      { id: 'c8',  start: 34,   end: 38,   text: 'Then slow circles, edge to center' },
      { id: 'c9',  start: 39,   end: 43,   text: 'AI might replace baristas' },
      { id: 'c10', start: 44,   end: 49,   text: "but it can't replace this", emphasis: true },
      { id: 'c11', start: 50,   end: 54,   text: 'The smell hits first' },
      { id: 'c12', start: 56,   end: 60,   text: 'Then the warmth in your hands' },
      { id: 'c13', start: 64,   end: 69,   text: "That's it. That's the whole video." },
      { id: 'c14', start: 70,   end: 75,   text: 'Thanks for watching' },
      { id: 'c15', start: 76,   end: 82,   text: 'Tomorrow I might try a V60' },
    ],
  },
];

const MEDIA_ASSETS = [
  { id: 'm-a1', name: 'IMG_0413.mp4', dur: '0:14', size: '78 MB', kind: 'a-roll', resolution: '1080p', used: true },
  { id: 'm-a2', name: 'IMG_0414.mp4', dur: '0:18', size: '92 MB', kind: 'a-roll', resolution: '1080p', used: true },
  { id: 'm-a3', name: 'IMG_0418.mp4', dur: '0:32', size: '164 MB', kind: 'a-roll', resolution: '1080p', used: true },
  { id: 'm-a4', name: 'IMG_0421.mp4', dur: '0:24', size: '124 MB', kind: 'a-roll', resolution: '1080p', used: true },
  { id: 'm-a5', name: 'IMG_0427.mp4', dur: '0:20', size: '108 MB', kind: 'a-roll', resolution: '1080p', used: true },
  { id: 'm-b1', name: 'cup-pour.mp4', dur: '0:08', size: '42 MB', kind: 'b-roll', resolution: 'slo-mo', used: true },
  { id: 'm-b2', name: 'cup-steam.mp4', dur: '0:12', size: '58 MB', kind: 'b-roll', resolution: 'slo-mo', used: true },
  { id: 'm-b3', name: 'beans-top.mp4', dur: '0:10', size: '49 MB', kind: 'b-roll', resolution: '4K', used: true },
  { id: 'm-b4', name: 'grinder-cu.mp4', dur: '0:06', size: '32 MB', kind: 'b-roll', resolution: 'slo-mo', used: false },
  { id: 'm-b5', name: 'kettle-pour.mp4', dur: '0:09', size: '44 MB', kind: 'b-roll', resolution: 'slo-mo', used: false },
  { id: 'm-i1', name: 'logo-mark.png', dur: '–', size: '24 KB', kind: 'image', resolution: '512×512', used: false },
  { id: 'm-i2', name: 'lower-third.png', dur: '–', size: '38 KB', kind: 'image', resolution: '1920×400', used: false },
];

const AUDIO_ASSETS = [
  { id: 'au-1', name: 'morning.wav', dur: '2:10', size: '22 MB', kind: 'music', mood: 'warm · piano', used: true },
  { id: 'au-2', name: 'cafe-jazz.wav', dur: '3:24', size: '35 MB', kind: 'music', mood: 'upbeat · sax', used: false },
  { id: 'au-3', name: 'pour.wav', dur: '0:03', size: '420 KB', kind: 'sfx', mood: 'water · pour', used: false },
  { id: 'au-4', name: 'grind.wav', dur: '0:06', size: '720 KB', kind: 'sfx', mood: 'mechanical', used: false },
  { id: 'au-5', name: 'click-soft.wav', dur: '0:01', size: '110 KB', kind: 'sfx', mood: 'percussive', used: false },
  { id: 'au-6', name: 'voiceover.wav', dur: '1:24', size: '14 MB', kind: 'vo', mood: 'narration', used: true },
  { id: 'au-7', name: 'ambience-cafe.wav', dur: '4:20', size: '44 MB', kind: 'ambience', mood: 'loop · room tone', used: false },
];

const CHAT_HISTORY = [
  {
    role: 'system',
    text: "Opened morning-coffee-vlog.hyper — indexed 12 media assets, 7 audio assets, 4 tracks.",
  },
  {
    role: 'user',
    text: "Cut the shaky part around 0:30 — second clip on A-Roll, the one where I'm reaching for the kettle.",
  },
  {
    role: 'assistant',
    text: "Found it. Motion peaks at 0:30.2–0:32.1 on `IMG_0418.mp4`. Trimming that segment and snapping the adjacent clips together.",
  },
  {
    role: 'tool',
    name: 'cut_segment',
    args: { track: 'a-roll', from: 30.2, to: 32.1 },
    summary: 'Removed 1.9s · A-Roll',
    durationMs: 412,
    status: 'done',
    affected: ['a3'],
  },
  {
    role: 'assistant',
    text: "Done — A-Roll is 1.9s shorter and B-Roll auto-shifted to keep the cup-steam cut on the same beat. Want me to check the audio for clicks at the seam?",
  },
  {
    role: 'user',
    text: "Yes, and look at the whole video — give me 3 suggestions to make it tighter.",
  },
  {
    role: 'assistant',
    text: "Scanning…",
  },
  {
    role: 'tool',
    name: 'analyze_timeline',
    args: { scope: 'full', goal: 'tighten' },
    summary: 'Scanning 84s · 4 tracks · 15 captions',
    durationMs: null,
    status: 'running',
    affected: ['a3', 'a4', 'b2'],
  },
];

Object.assign(window, { PROJECT, PLAYHEAD, TRACKS, MEDIA_ASSETS, AUDIO_ASSETS, CHAT_HISTORY });
