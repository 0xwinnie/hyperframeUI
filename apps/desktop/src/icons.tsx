// Single-line stroke icon set ported from hs-icons.jsx (24×24 viewBox, 1.6
// stroke, round caps/joins). When we add a Lucide-driven build, every icon
// here has a direct equivalent — keep names aligned.

import type { SVGProps } from 'react';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children' | 'stroke'> {
  size?: number;
  stroke?: number;
}

function Icon({
  size = 18,
  stroke = 1.6,
  children,
  ...rest
}: IconProps & { children: React.ReactNode }): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const Sparkle = (p: IconProps): JSX.Element => (
  <Icon {...p}>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
  </Icon>
);

export const Sparkle2 = (p: IconProps): JSX.Element => (
  <Icon {...p}>
    <path d="M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2zM19 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" />
  </Icon>
);

export const Film = (p: IconProps): JSX.Element => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 4v16M17 4v16M3 8h4M17 8h4M3 12h18M3 16h4M17 16h4" />
  </Icon>
);

export const Music = (p: IconProps): JSX.Element => (
  <Icon {...p}>
    <path d="M9 17V5l10-2v12" />
    <circle cx="6" cy="17" r="3" />
    <circle cx="16" cy="15" r="3" />
  </Icon>
);

export const Settings = (p: IconProps): JSX.Element => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </Icon>
);

export const Folder = (p: IconProps): JSX.Element => (
  <Icon {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </Icon>
);

export const ChevronDown = (p: IconProps): JSX.Element => (
  <Icon {...p}>
    <path d="M6 9l6 6 6-6" />
  </Icon>
);

export const ChevronRight = (p: IconProps): JSX.Element => (
  <Icon {...p}>
    <path d="M9 6l6 6-6 6" />
  </Icon>
);

export const Share = (p: IconProps): JSX.Element => (
  <Icon {...p}>
    <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14" />
  </Icon>
);

export const ArrowUpRight = (p: IconProps): JSX.Element => (
  <Icon {...p}>
    <path d="M7 17L17 7M8 7h9v9" />
  </Icon>
);

export const Play = (p: IconProps): JSX.Element => (
  <Icon {...p}>
    <path d="M6 4l14 8-14 8z" fill="currentColor" />
  </Icon>
);

export const Pause = (p: IconProps): JSX.Element => (
  <Icon {...p}>
    <rect x="6" y="4" width="4" height="16" fill="currentColor" />
    <rect x="14" y="4" width="4" height="16" fill="currentColor" />
  </Icon>
);

export const SkipBack = (p: IconProps): JSX.Element => (
  <Icon {...p}>
    <path d="M19 4L9 12l10 8zM5 4v16" fill="currentColor" />
  </Icon>
);

export const SkipFwd = (p: IconProps): JSX.Element => (
  <Icon {...p}>
    <path d="M5 4l10 8-10 8zM19 4v16" fill="currentColor" />
  </Icon>
);

export const StepBack = (p: IconProps): JSX.Element => (
  <Icon {...p}>
    <path d="M16 6l-6 6 6 6" />
  </Icon>
);

export const StepFwd = (p: IconProps): JSX.Element => (
  <Icon {...p}>
    <path d="M8 6l6 6-6 6" />
  </Icon>
);

export const Volume = (p: IconProps): JSX.Element => (
  <Icon {...p}>
    <path d="M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7" />
  </Icon>
);

export const Maximize = (p: IconProps): JSX.Element => (
  <Icon {...p}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </Icon>
);
