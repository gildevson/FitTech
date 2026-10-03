import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'fittech-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  theme = signal<Theme>(this.readInitialTheme());

  constructor() {
    this.applyTheme(this.theme());
  }

  toggle() {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  setTheme(theme: Theme) {
    this.theme.set(theme);
    this.applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore unavailable storage (private mode, SSR, etc.) */
    }
  }

  private applyTheme(theme: Theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  private readInitialTheme(): Theme {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      /* ignore unavailable storage */
    }
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
}
