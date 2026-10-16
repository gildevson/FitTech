import { environment } from '../../../environments/environment';
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MuscleGroupService } from '../../core/services/muscle-group.service';
import { ExerciseService } from '../../core/services/exercise.service';
import { WorkoutPlanService } from '../../core/services/workout-plan.service';
import { WorkoutService } from '../../core/services/workout.service';
import { DietService } from '../../core/services/diet.service';
import { UserService } from '../../core/services/user.service';
import { WorkoutLogService } from '../../core/services/workout-log.service';
import { RecentWorkoutLog, PopularPlan } from '../../core/models';
import { DonutChartComponent, DonutSlice } from '../../shared/components/donut-chart/donut-chart.component';
import { BarChartComponent, BarChartPoint } from '../../shared/components/bar-chart/bar-chart.component';
import { BrazilMapComponent, StateCount } from '../../shared/components/brazil-map/brazil-map.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BarChartComponent, DonutChartComponent, BrazilMapComponent],
  styles: [`
    :host { display: block; }

    /* ── Module header ── */
    .mod-header {
      display: flex; align-items: center; justify-content: space-between;
      padding-bottom: 12px;
      border-bottom: 2px solid var(--color-primary);
      margin-bottom: 16px;
    }
    .mod-breadcrumb {
      font-size: 0.7rem; color: var(--color-text-muted);
      text-transform: uppercase; letter-spacing: 0.08em;
      margin-bottom: 2px;
    }
    .mod-title {
      font-size: 1.05rem; font-weight: 700;
      color: var(--color-text); letter-spacing: -0.2px; margin: 0;
    }
    .mod-meta { display: flex; align-items: center; gap: 8px; }
    .mod-date {
      font-size: 0.72rem; color: var(--color-text-muted);
      background: var(--color-surface-hover);
      border: 1px solid var(--color-border);
      padding: 4px 10px; border-radius: 3px;
    }
    .mod-status {
      display: flex; align-items: center; gap: 5px;
      font-size: 0.68rem; font-weight: 600;
      color: #16a34a;
      background: #f0fdf4; border: 1px solid #bbf7d0;
      padding: 4px 10px; border-radius: 3px;
    }
    .mod-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #16a34a; }

    /* ── KPI strip ── */
    .kpi-strip {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 0;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 14px;
      background: var(--color-card-bg);
    }
    @media (max-width: 1100px) { .kpi-strip { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 600px)  { .kpi-strip { grid-template-columns: repeat(2, 1fr); } }

    .kpi-cell {
      padding: 12px 16px;
      border-right: 1px solid var(--color-border);
      display: flex; flex-direction: column; gap: 6px;
      position: relative;
    }
    .kpi-cell:last-child { border-right: none; }
    .kpi-cell::after {
      content: '';
      position: absolute; bottom: 0; left: 0; right: 0;
      height: 2px;
      background: var(--kpi-color, var(--color-primary));
    }
    .kpi-label {
      font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.07em; color: var(--color-text-muted);
    }
    .kpi-value {
      font-size: 1.4rem; font-weight: 800;
      color: var(--color-text); line-height: 1;
      letter-spacing: -0.5px;
    }
    .kpi-sub {
      font-size: 0.62rem; color: var(--color-text-muted);
    }

    /* ── Content grid ── */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 14px;
      margin-bottom: 14px;
    }
    @media (max-width: 900px) { .content-grid { grid-template-columns: 1fr; } }

    /* ── Panel (generic card) ── */
    .panel {
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: 4px;
      overflow: hidden;
    }
    .panel-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 9px 14px;
      background: var(--color-surface-hover);
      border-bottom: 1px solid var(--color-border);
    }
    .panel-title {
      font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.07em; color: var(--color-text);
      display: flex; align-items: center; gap: 6px;
    }
    .panel-title svg { width: 13px; height: 13px; color: var(--color-primary); }
    .panel-badge {
      font-size: 0.62rem; font-weight: 700;
      color: var(--color-primary);
      background: color-mix(in srgb, var(--color-primary) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-primary) 25%, transparent);
      border-radius: 3px; padding: 2px 7px;
    }
    .panel-body { padding: 0; }
    .top-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr);
      gap: 14px;
      margin-bottom: 14px;
      align-items: stretch;
    }
    .top-grid > .panel { margin-bottom: 0; display: flex; flex-direction: column; }
    .top-grid .chart-panel { --bar-height: 210px; --bar-gap: 14px; }
    .chart-toggle { display: inline-flex; padding: 2px; gap: 2px; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-surface-hover); }
    .chart-toggle button {
      display: inline-flex; align-items: center; gap: 5px;
      border: none; background: transparent; cursor: pointer;
      padding: 3px 9px; border-radius: 4px;
      font-size: 0.7rem; font-weight: 600; font-family: inherit; color: var(--color-text-muted);
      transition: background 0.15s, color 0.15s;
    }
    .chart-toggle button svg { width: 12px; height: 12px; }
    .chart-toggle button:hover { color: var(--color-text); }
    .chart-toggle button.active { background: var(--color-card-bg); color: var(--color-primary); box-shadow: var(--shadow-sm); }
    .donut-wrap { flex: 1; display: flex; align-items: center; justify-content: center; padding: 12px 16px; }
    .chart-panel .panel-title { white-space: nowrap; }
    .donut-wrap ui-donut-chart { width: 100%; max-width: 420px; }
    .top-grid .chart-wrap { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; }
    @media (max-width: 1100px) { .top-grid { grid-template-columns: 1fr; } }

    /* ── Chart panel ── */
    .chart-panel { margin-bottom: 14px; --bar-height: 130px; --bar-gap: 18px; }
    .chart-wrap { padding: 4px 8px 8px; }
    .chart-loading {
      flex: 1; min-height: 200px;
      display: flex; align-items: center; justify-content: center;
    }
    .chart-fade { animation: chart-in 0.35s ease-out both; }
    @keyframes chart-in { from { opacity: 0; transform: translateY(6px); } }

    /* ── Data table (activity) ── */
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table thead tr {
      background: var(--color-surface-hover);
    }
    .data-table th {
      font-size: 0.62rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.06em; color: var(--color-text-muted);
      padding: 7px 14px; text-align: left;
      border-bottom: 1px solid var(--color-border);
    }
    .data-table td {
      padding: 8px 14px;
      font-size: 0.8rem; color: var(--color-text);
      border-bottom: 1px solid var(--color-border);
    }
    .data-table tbody tr:last-child td { border-bottom: none; }
    .data-table tbody tr:hover { background: var(--color-surface-hover); }
    .td-user { font-weight: 600; font-size: 0.78rem; }
    .td-sub { font-size: 0.68rem; color: var(--color-text-muted); margin-top: 1px; }
    .td-date {
      font-size: 0.68rem; font-weight: 600; color: var(--color-text-muted);
      white-space: nowrap;
      background: var(--color-surface-hover);
      border: 1px solid var(--color-border);
      border-radius: 3px; padding: 2px 7px;
      display: inline-block;
    }
    .td-avatar {
      width: 26px; height: 26px; border-radius: 3px;
      background: color-mix(in srgb, var(--color-primary) 12%, transparent);
      color: var(--color-primary);
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 0.68rem; font-weight: 800; margin-right: 4px;
      vertical-align: middle;
    }
    .table-empty { padding: 28px 14px; text-align: center; color: var(--color-text-muted); font-size: 0.8rem; }

    /* ── Engagement panel ── */
    .eng-metric {
      padding: 14px;
      text-align: center;
      border-bottom: 1px solid var(--color-border);
    }
    .eng-pct-num {
      font-size: 1.9rem; font-weight: 800; line-height: 1;
      color: var(--color-text); letter-spacing: -0.5px;
    }
    .eng-pct-label { font-size: 0.7rem; color: var(--color-text-muted); margin-top: 2px; }
    .eng-bar {
      height: 6px; display: flex; gap: 2px;
      margin: 10px 14px 0;
    }
    .eng-seg { height: 100%; border-radius: 1px; transition: width 0.5s ease; }
    .eng-rows { padding: 0; }
    .eng-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 14px;
      border-bottom: 1px solid var(--color-border);
      font-size: 0.78rem;
    }
    .eng-row:last-child { border-bottom: none; }
    .eng-row-left { display: flex; align-items: center; gap: 8px; color: var(--color-text-muted); }
    .eng-indicator { width: 8px; height: 8px; border-radius: 1px; }
    .eng-row-right { display: flex; align-items: baseline; gap: 4px; }
    .eng-count { font-weight: 700; color: var(--color-text); font-size: 0.82rem; }
    .eng-pct { font-size: 0.65rem; color: var(--color-text-muted); }

    /* ── Modality table ── */
    .mod-table { width: 100%; border-collapse: collapse; }
    .mod-table th {
      font-size: 0.62rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.06em; color: var(--color-text-muted);
      padding: 7px 14px; text-align: left;
      background: var(--color-surface-hover);
      border-bottom: 1px solid var(--color-border);
    }
    .mod-table th:last-child, .mod-table td:last-child { text-align: right; }
    .mod-table td {
      padding: 8px 14px; font-size: 0.8rem; color: var(--color-text);
      border-bottom: 1px solid var(--color-border);
    }
    .mod-table tbody tr:last-child td { border-bottom: none; }
    .mod-table tbody tr:hover { background: var(--color-surface-hover); }
    .mod-rank-num {
      display: inline-flex; align-items: center; justify-content: center;
      width: 18px; height: 18px; border-radius: 2px;
      background: color-mix(in srgb, var(--color-primary) 10%, transparent);
      color: var(--color-primary);
      font-size: 0.62rem; font-weight: 800; margin-right: 6px;
    }
    .mod-bar-cell { width: 120px; }
    .mod-bar-bg { height: 4px; background: var(--color-border); border-radius: 1px; overflow: hidden; margin-top: 2px; }
    .mod-bar-fill { height: 100%; background: var(--color-primary); border-radius: 1px; transition: width 0.5s; }
    .count-pill {
      display: inline-block;
      font-size: 0.68rem; font-weight: 700;
      padding: 1px 7px; border-radius: 3px;
    }
    .count-pill.users { background: color-mix(in srgb, var(--color-primary) 10%, transparent); color: var(--color-primary); }
    .count-pill.sess  { background: var(--color-surface-hover); color: var(--color-text-muted); border: 1px solid var(--color-border); }

    /* ── States ── */
    .loading {
      display: flex; align-items: center; justify-content: center;
      gap: 10px; padding: 60px; color: var(--color-text-muted); font-size: 0.82rem;
    }
    .spinner {
      width: 16px; height: 16px; border-radius: 50%;
      border: 2px solid var(--color-border);
      border-top-color: var(--color-primary);
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-bar {
      padding: 10px 14px; margin-bottom: 14px;
      color: var(--color-danger);
      background: var(--color-danger-soft);
      border-left: 3px solid var(--color-danger);
      font-size: 0.8rem; border-radius: 0 3px 3px 0;
    }
  `],
  template: `
    <!-- Module header -->
    <div class="mod-header">
      <div>
        <div class="mod-breadcrumb">GordoFit Admin &rsaquo; Visão Geral</div>
        <h1 class="mod-title">Dashboard — Indicadores do Sistema</h1>
      </div>
      <div class="mod-meta">
        <div class="mod-status"><div class="mod-status-dot"></div> Online</div>
        <div class="mod-date">{{ today }}</div>
      </div>
    </div>

    @if (error()) {
      <div class="error-bar">{{ error() }}</div>
    }

    @if (loading()) {
      <div class="loading"><div class="spinner"></div> Carregando indicadores...</div>
    } @else {

      <!-- KPI strip -->
      <div class="kpi-strip">
        @for (k of kpis(); track k.label) {
          <div class="kpi-cell" [style.--kpi-color]="k.color">
            <span class="kpi-label">{{ k.label }}</span>
            <span class="kpi-value">{{ k.value }}</span>
            @if (k.sub) { <span class="kpi-sub">{{ k.sub }}</span> }
          </div>
        }
      </div>

      <!-- Chart + map -->
      <div class="top-grid">
        <div class="panel chart-panel">
          <div class="panel-head">
            <span class="panel-title">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="8" width="3" height="7"/><rect x="6" y="4" width="3" height="11"/>
                <rect x="11" y="1" width="3" height="14"/>
              </svg>
              Conteúdo Cadastrado
            </span>
            <div class="chart-toggle" role="tablist" aria-label="Tipo de gráfico">
              <button type="button" role="tab" [class.active]="chartMode() === 'bar'" [attr.aria-selected]="chartMode() === 'bar'" (click)="setChartMode('bar')" title="Barras">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 14V8M8 14V3M13 14v-4"/></svg>
                Barras
              </button>
              <button type="button" role="tab" [class.active]="chartMode() === 'donut'" [attr.aria-selected]="chartMode() === 'donut'" (click)="setChartMode('donut')" title="Rosca">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="8" r="5.5"/><path d="M8 2.5V8l4 3.5"/></svg>
                Rosca
              </button>
            </div>
          </div>
          <div class="chart-wrap">
            @if (chartSwitching()) {
              <div class="chart-loading" role="status" aria-label="Carregando gráfico"><div class="spinner"></div></div>
            } @else if (chartMode() === 'bar') {
              <ui-bar-chart class="chart-fade" [data]="chartData()" />
            } @else {
              <div class="donut-wrap chart-fade">
                <ui-donut-chart [slices]="donutSlices()" [size]="160" [thickness]="22" centerLabel="itens" />
              </div>
            }
          </div>
        </div>

        <!-- Users by state map -->
        <div class="panel map-panel">
          <div class="panel-head">
            <span class="panel-title">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 15s5-4.6 5-8.5A5 5 0 0 0 3 6.5C3 10.4 8 15 8 15z"/><circle cx="8" cy="6.5" r="1.8"/>
              </svg>
              Alunos por Estado
            </span>
            <span class="panel-badge">{{ usersByState().length }} UF</span>
          </div>
          <ui-brazil-map [data]="usersByState()" [compact]="true" />
        </div>
      </div>

      <!-- Content grid -->
      <div class="content-grid">

        <!-- Activity table -->
        <div class="panel">
          <div class="panel-head">
            <span class="panel-title">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="8" cy="8" r="7"/><polyline points="8,4 8,8 11,10"/>
              </svg>
              Atividade Recente
            </span>
            @if (recentActivity().length) {
              <span class="panel-badge">{{ recentActivity().length }} reg.</span>
            }
          </div>
          <div class="panel-body">
            @if (recentActivity().length === 0) {
              <div class="table-empty">Nenhum treino registrado ainda.</div>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Treino / Plano</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  @for (log of recentActivity(); track log.id) {
                    <tr>
                      <td>
                        <span class="td-avatar">{{ log.userName.charAt(0).toUpperCase() }}</span>
                        <span class="td-user">{{ log.userName }}</span>
                      </td>
                      <td>
                        <div class="td-user">{{ log.workoutName }}</div>
                        <div class="td-sub">{{ log.planName }}</div>
                      </td>
                      <td><span class="td-date">{{ formatDate(log.loggedDate) }}</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>

        <!-- Engagement panel -->
        <div class="panel">
          <div class="panel-head">
            <span class="panel-title">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="8" cy="8" r="7"/><path d="M8 4v4l3 2"/>
              </svg>
              Engajamento Semanal
            </span>
          </div>
          <div class="panel-body">
            <div class="eng-metric">
              <div class="eng-pct-num">{{ engPct(engagementSlices()[0].value) }}%</div>
              <div class="eng-pct-label">dos alunos treinaram esta semana</div>
            </div>
            <div class="eng-bar">
              <div class="eng-seg"
                [style.width.%]="engPct(engagementSlices()[0].value)"
                [style.display]="engPct(engagementSlices()[0].value) ? null : 'none'"
                [style.background]="'#16a34a'">
              </div>
              <div class="eng-seg"
                [style.width.%]="engPct(engagementSlices()[1].value)"
                [style.display]="engPct(engagementSlices()[1].value) ? null : 'none'"
                [style.background]="'#dc2626'">
              </div>
            </div>
            <div class="eng-rows">
              @for (s of engagementSlices(); track s.label) {
                <div class="eng-row">
                  <div class="eng-row-left">
                    <div class="eng-indicator" [style.background]="s.color"></div>
                    {{ s.label }}
                  </div>
                  <div class="eng-row-right">
                    <span class="eng-count">{{ s.value }}</span>
                    <span class="eng-pct">{{ engPct(s.value) }}%</span>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

      </div>

      <!-- Modalities table -->
      <div class="panel">
        <div class="panel-head">
          <span class="panel-title">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 4h12M2 8h8M2 12h10"/>
            </svg>
            Ranking de Modalidades
          </span>
          <span class="panel-badge">Top {{ popularPlans().length }}</span>
        </div>
        <div class="panel-body">
          @if (popularPlans().length === 0) {
            <div class="table-empty">Nenhuma sessão registrada ainda.</div>
          } @else {
            <table class="mod-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Modalidade</th>
                  <th>Alunos únicos</th>
                  <th>Sessões</th>
                  <th class="mod-bar-cell">Penetração</th>
                </tr>
              </thead>
              <tbody>
                @for (plan of popularPlans(); track plan.planName; let i = $index) {
                  <tr>
                    <td><span class="mod-rank-num">{{ i + 1 }}</span></td>
                    <td><strong>{{ plan.planName }}</strong></td>
                    <td><span class="count-pill users">{{ plan.userCount }} alunos</span></td>
                    <td><span class="count-pill sess">{{ plan.logCount }} sess.</span></td>
                    <td class="mod-bar-cell">
                      <div class="mod-bar-bg">
                        <div class="mod-bar-fill"
                          [style.width.%]="maxPopularUsers() > 0 ? (plan.userCount / maxPopularUsers()) * 100 : 0">
                        </div>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </div>

    }
  `
})
export class DashboardComponent implements OnInit {
  private muscleGroupService = inject(MuscleGroupService);
  private exerciseService = inject(ExerciseService);
  private workoutPlanService = inject(WorkoutPlanService);
  private workoutService = inject(WorkoutService);
  private dietService = inject(DietService);
  private userService = inject(UserService);
  private workoutLogService = inject(WorkoutLogService);

  loading = signal(true);
  error = signal('');
  counts = signal({ muscleGroups: 0, exercises: 0, workoutPlans: 0, workouts: 0, diets: 0, activeUsers: 0, totalUsers: 0 });
  chartData = signal<BarChartPoint[]>([]);
  chartMode = signal<'bar' | 'donut'>(this.loadChartMode());
  private readonly chartColors: Record<string, string> = {
    Grupos: '#6366f1', 'Exercícios': '#0ea5e9', Planos: '#f59e0b',
    Treinos: '#ef4444', Dietas: '#a855f7', 'Usuários': '#16a34a'
  };
  donutSlices = computed<DonutSlice[]>(() =>
    this.chartData().map(p => ({ label: p.label, value: p.value, color: this.chartColors[p.label] ?? '#64748b' }))
  );
  recentActivity = signal<RecentWorkoutLog[]>([]);
  popularPlans = signal<PopularPlan[]>([]);
  usersByState = signal<StateCount[]>([]);
  maxPopularUsers = computed(() => Math.max(...this.popularPlans().map(p => p.userCount), 1));
  engagementSlices = signal<DonutSlice[]>([
    { label: 'Treinaram',     value: 0, color: '#16a34a' },
    { label: 'Não treinaram', value: 0, color: '#dc2626' },
  ]);

  today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  kpis = computed(() => {
    const c = this.counts();
    return [
      { label: 'Grupos Musculares', value: c.muscleGroups, color: '#6366f1', sub: '' },
      { label: 'Exercícios',        value: c.exercises,    color: '#0ea5e9', sub: '' },
      { label: 'Planos de Treino',  value: c.workoutPlans, color: '#f59e0b', sub: '' },
      { label: 'Treinos',           value: c.workouts,     color: '#ef4444', sub: '' },
      { label: 'Dietas',            value: c.diets,        color: '#a855f7', sub: '' },
      { label: 'Usuários Ativos',   value: c.activeUsers,  color: '#16a34a', sub: `${c.totalUsers} total` },
    ];
  });

  ngOnInit() {
    forkJoin({
      muscleGroups: this.muscleGroupService.getAll(),
      exercises: this.exerciseService.getAll(),
      workoutPlans: this.workoutPlanService.getAll(),
      workouts: this.workoutService.getAll(),
      diets: this.dietService.getAll(),
    }).subscribe({
      next: (data) => {
        const counts = {
          muscleGroups: data.muscleGroups.length,
          exercises: data.exercises.length,
          workoutPlans: data.workoutPlans.length,
          workouts: data.workouts.length,
          diets: data.diets.length,
          activeUsers: 0,
          totalUsers: 0,
        };
        this.counts.set(counts);
        this.chartData.set([
          { label: 'Grupos',     value: counts.muscleGroups },
          { label: 'Exercícios', value: counts.exercises },
          { label: 'Planos',     value: counts.workoutPlans },
          { label: 'Treinos',    value: counts.workouts },
          { label: 'Dietas',     value: counts.diets },
        ]);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.status === 0
          ? `Não foi possível conectar à API. Verifique se ela está rodando em ${environment.apiUrl}`
          : 'Erro ao carregar dados do dashboard. Recarregue a página.');
        this.loading.set(false);
      }
    });

    this.userService.getAll().subscribe({
      next: (users) => {
        const activeUsers = users.filter((u: any) => u.isActive).length;
        this.counts.update(c => ({ ...c, activeUsers, totalUsers: users.length }));
        this.chartData.update(d => [...d, { label: 'Usuários', value: users.length }]);
      },
      error: () => {}
    });

    this.userService.countByState().subscribe({
      next: (data) => this.usersByState.set(data),
      error: () => {}
    });

    this.workoutLogService.getAdminStats().subscribe({
      next: (stats) => {
        this.recentActivity.set(stats.recentActivity);
        this.popularPlans.set(stats.popularPlans);
      },
      error: () => {}
    });

    this.workoutLogService.getUserStats().subscribe({
      next: (users) => {
        const trained    = users.filter(u => u.logsThisWeek > 0).length;
        const notTrained = users.filter(u => u.logsThisWeek === 0).length;
        this.engagementSlices.set([
          { label: 'Treinaram',     value: trained,    color: '#16a34a' },
          { label: 'Não treinaram', value: notTrained, color: '#dc2626' },
        ]);
      },
      error: () => {}
    });
  }

  chartSwitching = signal(false);
  private switchTimer?: ReturnType<typeof setTimeout>;

  setChartMode(mode: 'bar' | 'donut') {
    if (mode === this.chartMode()) return;
    this.chartMode.set(mode);
    this.chartSwitching.set(true);
    clearTimeout(this.switchTimer);
    this.switchTimer = setTimeout(() => this.chartSwitching.set(false), 450);
    try { localStorage.setItem('dashboard_chart_mode', mode); } catch {}
  }

  private loadChartMode(): 'bar' | 'donut' {
    try { return localStorage.getItem('dashboard_chart_mode') === 'donut' ? 'donut' : 'bar'; } catch { return 'bar'; }
  }

  engPct(value: number): number {
    const total = this.engagementSlices().reduce((s, x) => s + x.value, 0);
    return total ? Math.round((value / total) * 100) : 0;
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Hoje';
    if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
  }
}
