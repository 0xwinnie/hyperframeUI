// Icon set — single-line, 18px default, stroke-based.
// Pass size + color via props; defaults inherit currentColor.

const Icon = ({ size = 18, stroke = 1.6, children, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={stroke}
    strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {children}
  </svg>
);

const Ic = {
  Sparkle: (p) => <Icon {...p}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></Icon>,
  Film: (p) => <Icon {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 8h4M17 8h4M3 12h18M3 16h4M17 16h4"/></Icon>,
  Music: (p) => <Icon {...p}><path d="M9 17V5l10-2v12"/><circle cx="6" cy="17" r="3"/><circle cx="16" cy="15" r="3"/></Icon>,
  Settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></Icon>,
  Play: (p) => <Icon {...p}><path d="M6 4l14 8-14 8z" fill="currentColor"/></Icon>,
  Pause: (p) => <Icon {...p}><rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/></Icon>,
  SkipBack: (p) => <Icon {...p}><path d="M19 4L9 12l10 8zM5 4v16" fill="currentColor"/></Icon>,
  SkipFwd: (p) => <Icon {...p}><path d="M5 4l10 8-10 8zM19 4v16" fill="currentColor"/></Icon>,
  StepBack: (p) => <Icon {...p}><path d="M16 6l-6 6 6 6"/></Icon>,
  StepFwd: (p) => <Icon {...p}><path d="M8 6l6 6-6 6"/></Icon>,
  Volume: (p) => <Icon {...p}><path d="M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7"/></Icon>,
  Maximize: (p) => <Icon {...p}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></Icon>,
  Search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></Icon>,
  Plus: (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  Upload: (p) => <Icon {...p}><path d="M12 16V4M6 10l6-6 6 6M4 20h16"/></Icon>,
  Scissors: (p) => <Icon {...p}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14 14l6 6M14 10l-3-3"/></Icon>,
  Trash: (p) => <Icon {...p}><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/></Icon>,
  Undo: (p) => <Icon {...p}><path d="M3 7v6h6M3 13a9 9 0 1 1 3 6.7"/></Icon>,
  Redo: (p) => <Icon {...p}><path d="M21 7v6h-6M21 13a9 9 0 1 0-3 6.7"/></Icon>,
  ZoomIn: (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></Icon>,
  ZoomOut: (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6"/></Icon>,
  Magnet: (p) => <Icon {...p}><path d="M6 4v8a6 6 0 0 0 12 0V4M6 4h4v6M18 4h-4v6"/></Icon>,
  Send: (p) => <Icon {...p}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></Icon>,
  AtSign: (p) => <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.9 7.9"/></Icon>,
  Check: (p) => <Icon {...p}><path d="M4 12l5 5 11-12"/></Icon>,
  Loader: (p) => <Icon {...p}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></Icon>,
  ArrowUpRight: (p) => <Icon {...p}><path d="M7 17L17 7M8 7h9v9"/></Icon>,
  Eye: (p) => <Icon {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Icon>,
  EyeOff: (p) => <Icon {...p}><path d="M17 17a10 10 0 0 1-5 1c-7 0-11-8-11-8a18 18 0 0 1 4.4-5.2M22 12s-2.4 5-7 7M9 4.3A10 10 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2 3M1 1l22 22M9.9 9.9a3 3 0 0 0 4.2 4.2"/></Icon>,
  Lock: (p) => <Icon {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></Icon>,
  Mic: (p) => <Icon {...p}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></Icon>,
  Share: (p) => <Icon {...p}><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14"/></Icon>,
  ChevronDown: (p) => <Icon {...p}><path d="M6 9l6 6 6-6"/></Icon>,
  ChevronRight: (p) => <Icon {...p}><path d="M9 6l6 6-6 6"/></Icon>,
  Sparkle2: (p) => <Icon {...p}><path d="M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2zM19 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/></Icon>,
  Folder: (p) => <Icon {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></Icon>,
  Wand: (p) => <Icon {...p}><path d="M15 4V2M15 14v-2M8 9h2M20 9h2M17.8 11.8l1.4 1.4M11.6 6.4l1.4 1.4M3 21l8-8M11 13l-2 2"/></Icon>,
};

Object.assign(window, { Icon, Ic });
