import { Injectable, effect, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const KEY = 'fitmob_theme';

/** Tema do app (claro laranja/branco ou escuro), salvo no aparelho. Aplica a classe .theme-light no <html>. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.read());

  constructor() {
    effect(() => {
      const t = this.theme();
      document.documentElement.classList.toggle('theme-light', t === 'light');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'light' ? '#ffffff' : '#0b1020');
      try { localStorage.setItem(KEY, t); } catch { /* sem armazenamento: vale só nesta sessão */ }
    });
  }

  set(theme: Theme) {
    this.theme.set(theme);
  }

  private read(): Theme {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch { /* ignora */ }
    return 'dark'; // padrão: as cores originais do app
  }
}
