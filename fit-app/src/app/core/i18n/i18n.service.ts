import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TRANSLATIONS, Lang } from './translations';
import { ApiService } from '../services/api.service';
import { LoadingService } from '../services/loading.service';

const STORAGE_KEY = 'fitmob_lang';
// Marca que a escolha ainda não chegou ao servidor (ex.: estava sem internet)
const PENDING_KEY = 'fitmob_lang_pending';

export const LANGUAGES: { code: Lang; label: string; flag: string; locale: string }[] = [
  { code: 'pt', label: 'Português', flag: '🇧🇷', locale: 'pt-BR' },
  { code: 'en', label: 'English', flag: '🇺🇸', locale: 'en-US' },
  { code: 'es', label: 'Español', flag: '🇪🇸', locale: 'es-ES' }
];

function isLang(v: unknown): v is Lang {
  return typeof v === 'string' && v in TRANSLATIONS;
}

function read(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function write(key: string, value: string | null) {
  try { value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value); } catch {}
}

function initialLang(): Lang {
  const saved = read(STORAGE_KEY);
  if (isLang(saved)) return saved;
  // Primeiro acesso: segue o idioma do aparelho, com português como padrão
  const nav = (navigator.language || 'pt').slice(0, 2).toLowerCase();
  return isLang(nav) ? nav : 'pt';
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly api = inject(ApiService);
  private readonly loading = inject(LoadingService);

  readonly lang = signal<Lang>(initialLang());
  readonly locale = computed(() => LANGUAGES.find(l => l.code === this.lang())!.locale);
  readonly changing = signal(false);

  constructor() {
    document.documentElement.lang = this.locale();
  }

  /** Aplica o idioma na hora e guarda no aparelho */
  setLang(lang: Lang) {
    this.lang.set(lang);
    document.documentElement.lang = this.locale();
    write(STORAGE_KEY, lang);
  }

  /**
   * Troca escolhida pelo usuário: mostra o carregamento, salva na conta
   * (para valer em qualquer aparelho) e aplica.
   */
  async changeLanguage(lang: Lang) {
    if (lang === this.lang() || this.changing()) return;
    this.changing.set(true);
    // A mensagem já sai no idioma novo
    this.loading.showMessage(TRANSLATIONS[lang]['common.applying_language'] ?? '...');

    const loggedIn = !!read('fitmob_token');
    const save = loggedIn
      ? firstValueFrom(this.api.put<void>('/api/auth/language', { language: lang }))
          .then(() => write(PENDING_KEY, null))
          .catch(() => write(PENDING_KEY, '1')) // sem internet: aplica local e sincroniza depois
      : Promise.resolve();

    // Tempo mínimo para o carregamento não "piscar"
    await Promise.all([save, new Promise(r => setTimeout(r, 700))]);

    this.setLang(lang);
    this.updateStoredUser(lang);
    await new Promise(r => setTimeout(r, 150));
    this.loading.hideMessage();
    this.changing.set(false);
  }

  /**
   * Chamado após login/cadastro. Se havia uma troca pendente (feita offline), envia
   * para o servidor; senão aplica o idioma salvo na conta.
   */
  syncAfterLogin(serverLang?: string | null) {
    if (read(PENDING_KEY) || !isLang(serverLang)) {
      firstValueFrom(this.api.put<void>('/api/auth/language', { language: this.lang() }))
        .then(() => write(PENDING_KEY, null))
        .catch(() => {});
      return;
    }
    if (serverLang !== this.lang()) this.setLang(serverLang);
  }

  /** Traduz uma chave ("treinos.title"). Parâmetros: t('x', { n: 3 }) troca {n}. Cai no português se faltar. */
  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    const text = TRANSLATIONS[this.lang()][key] ?? TRANSLATIONS.pt[key] ?? key;
    if (!params) return text;
    return text.replace(/\{(\w+)\}/g, (_, p) => String(params[p] ?? ''));
  }

  private updateStoredUser(lang: Lang) {
    const raw = read('fitmob_user');
    if (!raw) return;
    try { write('fitmob_user', JSON.stringify({ ...JSON.parse(raw), language: lang })); } catch {}
  }
}
