// Theme palettes ported from design_handoff_hyperstudio/hs-app.jsx.
// Moss is the default. All tokens are applied as CSS custom properties on
// :root via applyTheme().

export type ThemeMode = 'dark' | 'light';
export type ThemeName = 'moss' | 'tide' | 'abyss' | 'mist' | 'paper' | 'linen' | 'cloud';

export interface Theme {
  mode: ThemeMode;
  vars: Record<string, string>;
}

const dark = (vars: Record<string, string>): Theme => ({ mode: 'dark', vars });
const light = (vars: Record<string, string>): Theme => ({ mode: 'light', vars });

export const THEMES: Record<ThemeName, Theme> = {
  moss: dark({
    '--bg-0': '#1c1d22', '--bg-1': '#24262c', '--bg-2': '#2d2f37', '--bg-3': '#383b45', '--bg-player': '#0e0f12',
    '--fg-1': '#ebecee', '--fg-2': '#bcbfc5', '--fg-3': '#8c919a', '--fg-4': '#666b75', '--fg-5': '#4a4e58',
    '--line-1': 'rgba(220,225,235,0.06)', '--line-2': 'rgba(220,225,235,0.10)', '--line-3': 'rgba(220,225,235,0.18)',
    '--accent': '#7aa589', '--accent-2': '#94bba2', '--accent-soft': 'rgba(122,165,137,0.13)',
    '--accent-line': 'rgba(122,165,137,0.36)', '--accent-ink': '#c8e0d2',
    '--violet': '#a89dd1', '--violet-soft': 'rgba(168,157,209,0.13)',
    '--green': '#86b59a', '--green-soft': 'rgba(134,181,154,0.14)',
    '--amber': '#d9b366', '--amber-soft': 'rgba(217,179,102,0.14)',
  }),
  tide: dark({
    '--bg-0': '#1c1d22', '--bg-1': '#24262c', '--bg-2': '#2d2f37', '--bg-3': '#383b45', '--bg-player': '#0e0f12',
    '--fg-1': '#ebecee', '--fg-2': '#bcbfc5', '--fg-3': '#8c919a', '--fg-4': '#666b75', '--fg-5': '#4a4e58',
    '--line-1': 'rgba(220,225,235,0.06)', '--line-2': 'rgba(220,225,235,0.10)', '--line-3': 'rgba(220,225,235,0.18)',
    '--accent': '#7a9bc4', '--accent-2': '#92b0d6', '--accent-soft': 'rgba(122,155,196,0.13)',
    '--accent-line': 'rgba(122,155,196,0.36)', '--accent-ink': '#c4dcf0',
    '--violet': '#a89dd1', '--violet-soft': 'rgba(168,157,209,0.13)',
    '--green': '#86b59a', '--green-soft': 'rgba(134,181,154,0.14)',
    '--amber': '#d9b366', '--amber-soft': 'rgba(217,179,102,0.14)',
  }),
  abyss: dark({
    '--bg-0': '#1a1e25', '--bg-1': '#222730', '--bg-2': '#2b313c', '--bg-3': '#363d4b', '--bg-player': '#0c0f14',
    '--fg-1': '#eaecf0', '--fg-2': '#bac0cb', '--fg-3': '#8a91a0', '--fg-4': '#646a78', '--fg-5': '#484e5a',
    '--line-1': 'rgba(220,228,240,0.06)', '--line-2': 'rgba(220,228,240,0.10)', '--line-3': 'rgba(220,228,240,0.18)',
    '--accent': '#5e9aa8', '--accent-2': '#7ab1be', '--accent-soft': 'rgba(94,154,168,0.14)',
    '--accent-line': 'rgba(94,154,168,0.36)', '--accent-ink': '#bce0e8',
    '--violet': '#a89dd1', '--violet-soft': 'rgba(168,157,209,0.13)',
    '--green': '#86b59a', '--green-soft': 'rgba(134,181,154,0.14)',
    '--amber': '#d9b366', '--amber-soft': 'rgba(217,179,102,0.14)',
  }),
  mist: dark({
    '--bg-0': '#1c1d22', '--bg-1': '#24262c', '--bg-2': '#2d2f37', '--bg-3': '#383b45', '--bg-player': '#0e0f12',
    '--fg-1': '#ebecee', '--fg-2': '#bcbfc5', '--fg-3': '#8c919a', '--fg-4': '#666b75', '--fg-5': '#4a4e58',
    '--line-1': 'rgba(220,225,235,0.06)', '--line-2': 'rgba(220,225,235,0.10)', '--line-3': 'rgba(220,225,235,0.18)',
    '--accent': '#c48a6a', '--accent-2': '#d6a387', '--accent-soft': 'rgba(196,138,106,0.13)',
    '--accent-line': 'rgba(196,138,106,0.35)', '--accent-ink': '#f0d4be',
    '--violet': '#a89dd1', '--violet-soft': 'rgba(168,157,209,0.13)',
    '--green': '#86b59a', '--green-soft': 'rgba(134,181,154,0.14)',
    '--amber': '#d9b366', '--amber-soft': 'rgba(217,179,102,0.14)',
  }),
  paper: light({
    '--bg-0': '#efeae1', '--bg-1': '#faf6ee', '--bg-2': '#f1ebde', '--bg-3': '#e6dec9', '--bg-player': '#1a1611',
    '--fg-1': '#2a241c', '--fg-2': '#5a5042', '--fg-3': '#897e6b', '--fg-4': '#aea38b', '--fg-5': '#c8bda3',
    '--line-1': 'rgba(42,36,28,0.06)', '--line-2': 'rgba(42,36,28,0.10)', '--line-3': 'rgba(42,36,28,0.18)',
    '--accent': '#b87b58', '--accent-2': '#c89070', '--accent-soft': 'rgba(184,123,88,0.12)',
    '--accent-line': 'rgba(184,123,88,0.32)', '--accent-ink': '#7a4b30',
    '--violet': '#9788c7', '--violet-soft': 'rgba(151,136,199,0.12)',
    '--green': '#7aa589', '--green-soft': 'rgba(122,165,137,0.14)',
    '--amber': '#c89548', '--amber-soft': 'rgba(200,149,72,0.14)',
  }),
  linen: light({
    '--bg-0': '#e9ebe5', '--bg-1': '#f7f8f3', '--bg-2': '#eceee6', '--bg-3': '#dee1d6', '--bg-player': '#161a17',
    '--fg-1': '#1f231f', '--fg-2': '#4e544e', '--fg-3': '#7a807a', '--fg-4': '#a3a8a1', '--fg-5': '#c2c6bf',
    '--line-1': 'rgba(31,35,31,0.06)', '--line-2': 'rgba(31,35,31,0.10)', '--line-3': 'rgba(31,35,31,0.18)',
    '--accent': '#7a9b7a', '--accent-2': '#92b092', '--accent-soft': 'rgba(122,155,122,0.14)',
    '--accent-line': 'rgba(122,155,122,0.36)', '--accent-ink': '#3f5d3f',
    '--violet': '#8e8aae', '--violet-soft': 'rgba(142,138,174,0.12)',
    '--green': '#6c9e88', '--green-soft': 'rgba(108,158,136,0.14)',
    '--amber': '#bd944c', '--amber-soft': 'rgba(189,148,76,0.14)',
  }),
  cloud: light({
    '--bg-0': '#e7eaef', '--bg-1': '#f6f8fa', '--bg-2': '#ebeef2', '--bg-3': '#dde1e8', '--bg-player': '#13161b',
    '--fg-1': '#1b1f25', '--fg-2': '#4a4f57', '--fg-3': '#777d87', '--fg-4': '#a3a9b3', '--fg-5': '#c4c9d1',
    '--line-1': 'rgba(27,31,37,0.06)', '--line-2': 'rgba(27,31,37,0.10)', '--line-3': 'rgba(27,31,37,0.18)',
    '--accent': '#c47a82', '--accent-2': '#d4949a', '--accent-soft': 'rgba(196,122,130,0.13)',
    '--accent-line': 'rgba(196,122,130,0.34)', '--accent-ink': '#7d3b43',
    '--violet': '#8c91b8', '--violet-soft': 'rgba(140,145,184,0.13)',
    '--green': '#79a394', '--green-soft': 'rgba(121,163,148,0.14)',
    '--amber': '#c19256', '--amber-soft': 'rgba(193,146,86,0.14)',
  }),
};

export const DEFAULT_THEME: ThemeName = 'moss';
