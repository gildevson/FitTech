import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBack, chevronForward, checkmarkCircle, closeCircle, trendingUp, trendingDown, removeOutline } from 'ionicons/icons';
import { TPipe } from '../../core/i18n/t.pipe';
import { I18nService } from '../../core/i18n/i18n.service';
import { ApiService } from '../../core/services/api.service';
import { CalendarWorkoutLog, MonthlyFrequency } from '../../core/models';

type DayStatus = 'done' | 'skipped' | null;

interface CalendarDay {
  day: number;
  date: string;
  status: DayStatus;
  count: number;
  isToday: boolean;
  isFuture: boolean;
}

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Calendário mensal com os dias em que o usuário treinou (ou pulou) e a agenda do dia escolhido. */
@Component({
  selector: 'app-frequency-calendar',
  standalone: true,
  imports: [TPipe, IonIcon],
  styles: [`
    .freq-card {
      margin: 0 16px; padding: 14px; border-radius: var(--ft-radius);
      background: var(--ft-surface); border: 1px solid var(--ft-border);
    }

    .freq-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .freq-month { font-size: 0.98rem; font-weight: 700; color: var(--ft-text); }
    .freq-nav {
      width: 34px; height: 34px; border-radius: 10px; cursor: pointer; padding: 0;
      display: flex; align-items: center; justify-content: center;
      background: var(--ft-bg-elevated); border: 1px solid var(--ft-border); color: var(--ft-text);
    }
    .freq-nav:disabled { opacity: 0.35; cursor: default; }

    .freq-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px; }
    .freq-stat {
      padding: 10px 6px; border-radius: 10px; text-align: center;
      background: var(--ft-bg-elevated); border: 1px solid var(--ft-border);
    }
    .freq-stat strong { display: block; font-size: 1.2rem; font-weight: 700; color: var(--ft-text); }
    .freq-stat.accent strong { color: var(--ft-accent); }
    .freq-stat small { font-size: 0.68rem; color: var(--ft-text-muted); }

    .freq-compare {
      display: flex; align-items: center; gap: 8px; margin: -4px 0 14px; padding: 8px 10px; border-radius: 10px;
      font-size: 0.78rem; color: var(--ft-text-muted); background: var(--ft-bg-elevated);
    }
    .freq-compare ion-icon { font-size: 1.1rem; flex-shrink: 0; }
    .freq-compare strong { color: var(--ft-text); }
    .freq-compare.up ion-icon, .freq-compare.up strong { color: var(--ft-success); }
    .freq-compare.down ion-icon, .freq-compare.down strong { color: var(--ft-accent); }

    .freq-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
    .freq-weekday {
      text-align: center; font-size: 0.66rem; font-weight: 700; color: var(--ft-text-faint);
      text-transform: uppercase; padding-bottom: 4px;
    }
    .freq-day {
      position: relative; aspect-ratio: 1; border-radius: 10px; padding: 0; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-family: inherit; font-size: 0.82rem; font-weight: 600; color: var(--ft-text-muted);
      background: transparent; border: 0;
    }
    .freq-day:disabled { cursor: default; }
    .freq-day.done { background: var(--ft-accent); color: #ffffff; }
    .freq-day.skipped { background: var(--ft-bg-elevated); border: 1px dashed var(--ft-text-faint); color: var(--ft-text-faint); }
    .freq-day.today { box-shadow: inset 0 0 0 2px var(--ft-accent); color: var(--ft-text); }
    .freq-day.done.today { box-shadow: 0 0 0 2px var(--ft-bg), 0 0 0 4px var(--ft-accent); }
    .freq-day.selected { outline: 2px solid var(--ft-text); outline-offset: 2px; }
    .freq-day.future { opacity: 0.35; }
    /* Mais de um treino no mesmo dia */
    .freq-day .freq-count {
      position: absolute; top: 2px; right: 4px; font-size: 0.55rem; font-weight: 700; opacity: 0.9;
    }

    .freq-legend { display: flex; gap: 16px; margin-top: 12px; font-size: 0.72rem; color: var(--ft-text-muted); }
    .freq-legend span { display: flex; align-items: center; gap: 6px; }
    .freq-dot { width: 12px; height: 12px; border-radius: 4px; }
    .freq-dot.done { background: var(--ft-accent); }
    .freq-dot.skipped { background: var(--ft-bg-elevated); border: 1px dashed var(--ft-text-faint); }

    .agenda { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--ft-border); }
    .agenda-title { margin: 0 0 10px; font-size: 0.85rem; font-weight: 700; color: var(--ft-text); }
    .agenda-empty { margin: 0; font-size: 0.8rem; color: var(--ft-text-muted); }
    .agenda-item {
      display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 6px;
      border-radius: 10px; background: var(--ft-bg-elevated); border: 1px solid var(--ft-border);
    }
    .agenda-item ion-icon { font-size: 1.3rem; flex-shrink: 0; color: var(--ft-accent); }
    .agenda-item.skipped ion-icon { color: var(--ft-text-faint); }
    .agenda-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .agenda-text strong { font-size: 0.9rem; color: var(--ft-text); }
    .agenda-text small { font-size: 0.74rem; color: var(--ft-text-muted); }

    .history { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--ft-border); }
    .history-title { margin: 0 0 10px; font-size: 0.85rem; font-weight: 700; color: var(--ft-text); }
    .history-bars { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; align-items: end; }
    .history-bar {
      display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 0; cursor: pointer;
      background: transparent; border: 0; font-family: inherit; color: var(--ft-text-muted);
    }
    .history-value { font-size: 0.72rem; font-weight: 700; color: var(--ft-text); }
    .history-track { width: 100%; height: 80px; display: flex; align-items: flex-end; border-radius: 8px; background: var(--ft-bg-elevated); }
    .history-fill { width: 100%; min-height: 3px; border-radius: 8px; background: var(--ft-text-faint); transition: height 0.3s; }
    .history-bar.active .history-fill { background: var(--ft-accent); }
    .history-bar.active .history-label { color: var(--ft-accent); font-weight: 700; }
    .history-label { font-size: 0.68rem; text-transform: capitalize; }

    .freq-error { margin: 10px 0 0; font-size: 0.78rem; color: var(--ft-text-muted); text-align: center; }
  `],
  template: `
    <div class="freq-card">
      <div class="freq-head">
        <button type="button" class="freq-nav" [attr.aria-label]="'freq.prev' | t" (click)="changeMonth(-1)">
          <ion-icon name="chevron-back"></ion-icon>
        </button>
        <span class="freq-month">{{ monthLabel() }}</span>
        <button type="button" class="freq-nav" [attr.aria-label]="'freq.next' | t"
                [disabled]="isCurrentMonth()" (click)="changeMonth(1)">
          <ion-icon name="chevron-forward"></ion-icon>
        </button>
      </div>

      <div class="freq-stats">
        <div class="freq-stat accent">
          <strong>{{ stats().done }}</strong>
          <small>{{ 'freq.trained' | t }}</small>
        </div>
        <div class="freq-stat">
          <strong>{{ stats().skipped }}</strong>
          <small>{{ 'freq.skipped' | t }}</small>
        </div>
        <div class="freq-stat">
          <strong>{{ stats().perWeek }}</strong>
          <small>{{ 'freq.per_week' | t }}</small>
        </div>
      </div>

      @if (comparison(); as c) {
        <div class="freq-compare" [class.up]="c.diff > 0" [class.down]="c.diff < 0">
          <ion-icon [name]="c.diff > 0 ? 'trending-up' : c.diff < 0 ? 'trending-down' : 'remove-outline'"></ion-icon>
          <span>
            @if (c.diff === 0) {
              {{ 'freq.compare_same' | t: { month: c.prevLabel } }}
            } @else {
              <strong>{{ c.diff > 0 ? '+' : '' }}{{ c.diff }}</strong>
              {{ (c.diff === 1 || c.diff === -1 ? 'freq.compare_day' : 'freq.compare_days') | t: { month: c.prevLabel, prev: c.prev } }}
            }
          </span>
        </div>
      }

      <div class="freq-grid">
        @for (w of weekdays(); track $index) {
          <span class="freq-weekday">{{ w }}</span>
        }
        @for (blank of leadingBlanks(); track $index) {
          <span></span>
        }
        @for (d of days(); track d.date) {
          <button type="button" class="freq-day"
                  [class.done]="d.status === 'done'" [class.skipped]="d.status === 'skipped'"
                  [class.today]="d.isToday" [class.future]="d.isFuture" [class.selected]="d.date === selectedDate()"
                  [disabled]="d.isFuture" [attr.aria-pressed]="d.date === selectedDate()"
                  (click)="selectedDate.set(d.date)">
            {{ d.day }}
            @if (d.count > 1) { <span class="freq-count">{{ d.count }}</span> }
          </button>
        }
      </div>

      <div class="freq-legend">
        <span><i class="freq-dot done"></i>{{ 'freq.legend_done' | t }}</span>
        <span><i class="freq-dot skipped"></i>{{ 'freq.legend_skipped' | t }}</span>
      </div>

      @if (selectedDate()) {
        <div class="agenda">
          <p class="agenda-title">{{ selectedLabel() }}</p>
          @for (log of selectedLogs(); track log.id) {
            <div class="agenda-item" [class.skipped]="log.status === 'skipped'">
              <ion-icon [name]="log.status === 'skipped' ? 'close-circle' : 'checkmark-circle'"></ion-icon>
              <span class="agenda-text">
                <strong>{{ log.workoutName }}</strong>
                <small>
                  {{ log.planName }}
                  @if (log.status === 'skipped') {
                    · {{ 'freq.legend_skipped' | t }}@if (log.skipReason) {: {{ log.skipReason }}}
                  }
                </small>
              </span>
            </div>
          } @empty {
            <p class="agenda-empty">{{ 'freq.no_workout' | t }}</p>
          }
        </div>
      }

      <div class="history">
        <p class="history-title">{{ 'freq.history' | t }}</p>
        <div class="history-bars">
          @for (b of history(); track b.key) {
            <button type="button" class="history-bar" [class.active]="b.active"
                    [attr.aria-label]="b.label + ': ' + b.doneDays" (click)="goToMonth(b.date)">
              <span class="history-value">{{ b.doneDays }}</span>
              <span class="history-track"><span class="history-fill" [style.height.%]="b.percent"></span></span>
              <span class="history-label">{{ b.label }}</span>
            </button>
          }
        </div>
      </div>

      @if (error()) {
        <p class="freq-error">{{ 'freq.error' | t }}</p>
      }
    </div>
  `
})
export class FrequencyCalendarComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly i18n = inject(I18nService);

  private readonly logs = signal<CalendarWorkoutLog[]>([]);
  readonly error = signal(false);

  /** Primeiro dia do mês exibido */
  readonly month = signal(this.firstOfMonth(new Date()));
  /** Dia aberto na agenda (começa em hoje) */
  readonly selectedDate = signal<string | null>(localDateStr(new Date()));

  /** Resumo dos últimos meses, para comparar (meses sem treino não vêm da API) */
  private readonly monthly = signal<MonthlyFrequency[]>([]);
  private static readonly SUMMARY_MONTHS = 12;

  constructor() {
    addIcons({ chevronBack, chevronForward, checkmarkCircle, closeCircle, trendingUp, trendingDown, removeOutline });
  }

  ngOnInit() {
    this.load();
    this.api.get<MonthlyFrequency[]>('/api/workoutlogs/me/monthly', { months: FrequencyCalendarComponent.SUMMARY_MONTHS })
      .subscribe({ next: m => this.monthly.set(m ?? []), error: () => this.monthly.set([]) });
  }

  private load() {
    const m = this.month();
    this.error.set(false);
    this.api.get<CalendarWorkoutLog[]>('/api/workoutlogs/me/calendar', { year: m.getFullYear(), month: m.getMonth() + 1 })
      .subscribe({
        next: logs => this.logs.set(logs ?? []),
        error: () => { this.logs.set([]); this.error.set(true); }
      });
  }

  private readonly logsByDate = computed(() => {
    const map = new Map<string, CalendarWorkoutLog[]>();
    for (const l of this.logs()) {
      const date = l.loggedDate.slice(0, 10);
      map.set(date, [...(map.get(date) ?? []), l]);
    }
    return map;
  });

  /** "Outubro de 2026": só a primeira letra maiúscula (text-transform deixaria "De") */
  readonly monthLabel = computed(() => {
    const label = this.month().toLocaleDateString(this.i18n.locale(), { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  });

  /** Iniciais dos dias da semana começando no domingo, no idioma do app */
  readonly weekdays = computed(() => {
    const fmt = new Intl.DateTimeFormat(this.i18n.locale(), { weekday: 'short' });
    // 2023-01-01 foi um domingo
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2023, 0, 1 + i)).replace('.', '').slice(0, 3));
  });

  readonly leadingBlanks = computed(() => Array(this.month().getDay()));

  readonly days = computed<CalendarDay[]>(() => {
    const first = this.month();
    const total = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const today = localDateStr(new Date());
    const byDate = this.logsByDate();
    return Array.from({ length: total }, (_, i) => {
      const date = localDateStr(new Date(first.getFullYear(), first.getMonth(), i + 1));
      const logs = byDate.get(date) ?? [];
      // Se treinou em algum treino do dia conta como "done", mesmo que tenha pulado outro
      const status: DayStatus = logs.some(l => l.status !== 'skipped') ? 'done' : logs.length ? 'skipped' : null;
      return { day: i + 1, date, status, count: logs.length, isToday: date === today, isFuture: date > today };
    });
  });

  readonly selectedLogs = computed(() => this.logsByDate().get(this.selectedDate() ?? '') ?? []);

  readonly selectedLabel = computed(() => {
    const date = this.selectedDate();
    if (!date) return '';
    const [y, m, d] = date.split('-').map(Number);
    const label = new Date(y, m - 1, d).toLocaleDateString(this.i18n.locale(), { weekday: 'long', day: 'numeric', month: 'long' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  });

  readonly isCurrentMonth = computed(() =>
    this.month().getTime() === this.firstOfMonth(new Date()).getTime());

  readonly stats = computed(() => {
    const days = this.days();
    const done = days.filter(d => d.status === 'done').length;
    const skipped = days.filter(d => d.status === 'skipped').length;
    // Média por semana considerando só os dias do mês que já passaram
    const elapsed = days.filter(d => !d.isFuture).length;
    const perWeek = elapsed ? (done / elapsed) * 7 : 0;
    return { done, skipped, perWeek: perWeek.toLocaleString(this.i18n.locale(), { maximumFractionDigits: 1 }) };
  });

  /** Dias treinados de um mês pelo resumo (0 se não treinou); null se o mês é mais antigo que o resumo */
  private doneDaysOf(d: Date): number | null {
    const oldest = new Date(new Date().getFullYear(), new Date().getMonth() - (FrequencyCalendarComponent.SUMMARY_MONTHS - 1), 1);
    if (d < oldest) return null;
    return this.monthly().find(m => m.year === d.getFullYear() && m.month === d.getMonth() + 1)?.doneDays ?? 0;
  }

  /** Dias treinados no mês exibido comparados com o mês anterior */
  readonly comparison = computed(() => {
    const m = this.month();
    const prevDate = new Date(m.getFullYear(), m.getMonth() - 1, 1);
    const prev = this.doneDaysOf(prevDate);
    if (prev === null) return null;
    const prevLabel = prevDate.toLocaleDateString(this.i18n.locale(), { month: 'long' });
    return { diff: this.stats().done - prev, prev, prevLabel };
  });

  /** Barras dos últimos 6 meses (o atual por último), destacando o mês exibido */
  readonly history = computed(() => {
    const now = new Date();
    const shown = this.month().getTime();
    const bars = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return {
        key: localDateStr(date),
        date,
        doneDays: this.doneDaysOf(date) ?? 0,
        label: date.toLocaleDateString(this.i18n.locale(), { month: 'short' }).replace('.', ''),
        active: date.getTime() === shown,
        percent: 0
      };
    });
    const max = Math.max(...bars.map(b => b.doneDays), 1);
    bars.forEach(b => b.percent = (b.doneDays / max) * 100);
    return bars;
  });

  changeMonth(delta: number) {
    const m = this.month();
    this.goToMonth(new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  goToMonth(date: Date) {
    this.month.set(this.firstOfMonth(date));
    // No mês atual abre a agenda de hoje; nos outros, espera o usuário tocar num dia
    this.selectedDate.set(this.isCurrentMonth() ? localDateStr(new Date()) : null);
    this.load();
  }

  private firstOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }
}
