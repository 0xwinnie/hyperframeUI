import { THEMES, type ThemeName } from './themes';

export function applyTheme(name: ThemeName): void {
  const theme = THEMES[name];
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }
  root.dataset['themeMode'] = theme.mode;
  root.dataset['themeName'] = name;
}
