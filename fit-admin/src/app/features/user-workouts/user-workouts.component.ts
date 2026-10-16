import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkoutLogService } from '../../core/services/workout-log.service';
import { UserWorkoutStats, UserWorkoutLog } from '../../core/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

interface UserRow {
  stats: UserWorkoutStats;
  expanded: boolean;
  logs: UserWorkoutLog[];
  loadingLogs: boolean;
}

@Component({
  selector: 'app-user-workouts',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  styles: [`
    .user-list { display: flex; flex-direction: column; gap: 10px; }

    .user-card {
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: 0 1px 3px rgba(16,24,40,0.05);
      overflow: hidden;
    }

    .user-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 20px; cursor: pointer; gap: 16px;
      transition: background 0.15s;
    }
    .user-row:hover { background: var(--color-surface-hover); }

    .user-left { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }

    .avatar {
      width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
      background: var(--color-primary-soft);
      color: var(--color-primary);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.95rem; font-weight: 700;
      border: 1.5px solid color-mix(in srgb, var(--color-primary) 25%, transparent);
    }
    .avatar.active {
      background: color-mix(in srgb, #22c55e 12%, transparent);
      color: #22c55e;
      border-color: color-mix(in srgb, #22c55e 30%, transparent);
    }

    .user-meta { min-width: 0; }
    .user-name { font-size: 0.95rem; font-weight: 700; color: var(--color-text); }
    .user-email { font-size: 0.8rem; color: var(--color-text-muted); margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .user-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }

    .stat-pills { display: flex; gap: 6px; }
    .stat-pill {
      display: flex; flex-direction: column; align-items: center;
      background: var(--color-surface-hover);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 4px 10px;
      min-width: 48px;
    }
    .stat-pill-val { font-size: 0.95rem; font-weight: 700; color: var(--color-text); line-height: 1.2; }
    .stat-pill-label { font-size: 0.6rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .stat-pill.highlight .stat-pill-val { color: var(--color-primary); }

    .chevron {
      width: 18px; height: 18px; color: var(--color-text-muted);
      transition: transform 0.2s; flex-shrink: 0;
    }
    .chevron.open { transform: rotate(180deg); }

    /* Panel */
    .user-panel {
      border-top: 1px solid var(--color-border);
      background: var(--color-surface);
      padding: 16px 20px 18px;
    }
    .panel-label {
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: var(--color-text-muted); margin-bottom: 10px;
    }

    /* Last workout info */
    .last-workout-bar {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px;
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      margin-bottom: 14px;
    }
    .last-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #22c55e; flex-shrink: 0;
    }
    .last-dot.stale { background: var(--color-text-muted); }
    .last-text { font-size: 0.82rem; color: var(--color-text-muted); }
    .last-text strong { color: var(--color-text); }

    /* Log list */
    .log-list { display: flex; flex-direction: column; gap: 6px; }
    .log-row {
      display: flex; align-items: center; gap: 12px;
      padding: 9px 14px;
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-left: 3px solid var(--color-primary);
      border-radius: var(--radius-sm);
    }
    .log-date {
      font-size: 0.75rem; font-weight: 700;
      color: var(--color-text-muted);
      min-width: 52px; flex-shrink: 0;
    }
    .log-info { flex: 1; min-width: 0; }
    .log-workout { font-size: 0.88rem; font-weight: 600; color: var(--color-text); }
    .log-plan { font-size: 0.74rem; color: var(--color-text-muted); margin-top: 1px; }
    .skip-badge { margin-left: 6px; font-size: 0.66rem; font-weight: 700; padding: 1px 7px; border-radius: 8px; color: var(--color-text-muted); background: var(--color-surface-hover); border: 1px dashed var(--color-border); vertical-align: middle; }

    .empty-msg {
      text-align: center; padding: 14px;
      color: var(--color-text-muted); font-size: 0.85rem;
      border: 1px dashed var(--color-border);
      border-radius: var(--radius-sm);
    }
    .loading-msg { color: var(--color-text-muted); padding: 40px; text-align: center; }

    /* Status bar at top */
    .summary-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    @media (max-width: 700px) { .summary-bar { grid-template-columns: repeat(2, 1fr); } }

    .summary-card {
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-left: 3px solid var(--sc-accent, var(--color-border));
      border-radius: 8px;
      padding: 10px 14px;
      display: flex; align-items: center; gap: 10px;
    }
    .summary-icon {
      font-size: 1rem;
      width: 32px; height: 32px; border-radius: 6px; flex-shrink: 0;
      background: color-mix(in srgb, var(--sc-accent, var(--color-primary)) 12%, transparent);
      display: flex; align-items: center; justify-content: center;
    }
    .summary-body { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .summary-val { font-size: 1.15rem; font-weight: 800; color: var(--color-text); line-height: 1; letter-spacing: -0.3px; }
    .summary-label { font-size: 0.68rem; color: var(--color-text-muted); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .summary-card.green { --sc-accent: #22c55e; }
    .summary-card.blue  { --sc-accent: var(--color-primary); }
    .summary-card.orange { --sc-accent: #f59e0b; }
    .summary-card.purple { --sc-accent: #a855f7; }
  `],
  template: `
    <ui-page-header title="Acompanhamento de Treinos" subtitle="Monitore a frequência e histórico de cada aluno" />

    @if (loading()) {
      <p class="loading-msg">Carregando...</p>
    } @else {

      <!-- Summary bar -->
      <div class="summary-bar">
        <div class="summary-card green">
          <div class="summary-icon">🟢</div>
          <div class="summary-body">
            <div class="summary-val">{{ activeThisWeek() }}</div>
            <div class="summary-label">Ativos esta semana</div>
          </div>
        </div>
        <div class="summary-card blue">
          <div class="summary-icon">📅</div>
          <div class="summary-body">
            <div class="summary-val">{{ activeThisMonth() }}</div>
            <div class="summary-label">Ativos este mês</div>
          </div>
        </div>
        <div class="summary-card orange">
          <div class="summary-icon">⚡</div>
          <div class="summary-body">
            <div class="summary-val">{{ totalSessions() }}</div>
            <div class="summary-label">Sessões totais</div>
          </div>
        </div>
        <div class="summary-card purple">
          <div class="summary-icon">👥</div>
          <div class="summary-body">
            <div class="summary-val">{{ rows().length }}</div>
            <div class="summary-label">Alunos</div>
          </div>
        </div>
      </div>

      <!-- User list -->
      <div class="user-list">
        @for (item of rows(); track item.stats.id) {
          <div class="user-card">

            <div class="user-row" (click)="toggle(item)">
              <div class="user-left">
                <div class="avatar" [class.active]="item.stats.logsThisWeek > 0">
                  {{ item.stats.name.charAt(0).toUpperCase() }}
                </div>
                <div class="user-meta">
                  <div class="user-name">{{ item.stats.name }}</div>
                  <div class="user-email">{{ item.stats.email }}</div>
                </div>
              </div>
              <div class="user-right">
                <div class="stat-pills">
                  <div class="stat-pill highlight">
                    <span class="stat-pill-val">{{ item.stats.logsThisWeek }}</span>
                    <span class="stat-pill-label">Semana</span>
                  </div>
                  <div class="stat-pill">
                    <span class="stat-pill-val">{{ item.stats.logsThisMonth }}</span>
                    <span class="stat-pill-label">Mês</span>
                  </div>
                  <div class="stat-pill">
                    <span class="stat-pill-val">{{ item.stats.totalLogs }}</span>
                    <span class="stat-pill-label">Total</span>
                  </div>
                </div>
                <svg class="chevron" [class.open]="item.expanded" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>

            @if (item.expanded) {
              <div class="user-panel">

                <!-- Last workout -->
                <div class="last-workout-bar">
                  <div class="last-dot" [class.stale]="!item.stats.lastWorkoutDate || daysSince(item.stats.lastWorkoutDate) > 7"></div>
                  @if (item.stats.lastWorkoutDate) {
                    <span class="last-text">
                      Último treino: <strong>{{ formatDate(item.stats.lastWorkoutDate) }}</strong>
                      ({{ daysSince(item.stats.lastWorkoutDate) === 0 ? 'hoje' : daysSince(item.stats.lastWorkoutDate) + ' dias atrás' }})
                    </span>
                  } @else {
                    <span class="last-text">Nenhum treino registrado ainda.</span>
                  }
                </div>

                <!-- Log history -->
                <p class="panel-label">Histórico de Sessões</p>
                @if (item.loadingLogs) {
                  <p class="empty-msg">Carregando...</p>
                } @else if (item.logs.length === 0) {
                  <p class="empty-msg">Este aluno ainda não registrou nenhum treino.</p>
                } @else {
                  <div class="log-list">
                    @for (log of item.logs; track log.id) {
                      <div class="log-row">
                        <div class="log-date">{{ formatDate(log.loggedDate) }}</div>
                        <div class="log-info">
                          <div class="log-workout">
                            {{ log.workoutName }}
                            @if (log.status === 'skipped') { <span class="skip-badge">Pulado</span> }
                          </div>
                          <div class="log-plan">
                            {{ log.planName }}@if (log.status === 'skipped' && log.skipReason) { · {{ log.skipReason }} }
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }

          </div>
        }
      </div>
    }
  `
})
export class UserWorkoutsComponent implements OnInit {
  private readonly logService = inject(WorkoutLogService);

  loading = signal(true);
  rows = signal<UserRow[]>([]);

  activeThisWeek = signal(0);
  activeThisMonth = signal(0);
  totalSessions = signal(0);

  ngOnInit() {
    this.logService.getUserStats().subscribe({
      next: (stats) => {
        this.rows.set(stats.map(s => ({ stats: s, expanded: false, logs: [], loadingLogs: false })));
        this.activeThisWeek.set(stats.filter(s => s.logsThisWeek > 0).length);
        this.activeThisMonth.set(stats.filter(s => s.logsThisMonth > 0).length);
        this.totalSessions.set(stats.reduce((t, s) => t + s.totalLogs, 0));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  toggle(item: UserRow) {
    item.expanded = !item.expanded;
    if (item.expanded && item.logs.length === 0 && !item.loadingLogs) {
      this.loadLogs(item);
    }
    this.rows.update(r => [...r]);
  }

  loadLogs(item: UserRow) {
    item.loadingLogs = true;
    this.logService.getUserLogs(item.stats.id).subscribe({
      next: (logs) => { item.logs = logs; item.loadingLogs = false; this.rows.update(r => [...r]); },
      error: () => { item.loadingLogs = false; this.rows.update(r => [...r]); }
    });
  }

  daysSince(dateStr: string): number {
    const d = new Date(dateStr);
    const today = new Date();
    d.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.floor((today.getTime() - d.getTime()) / 86400000);
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}
