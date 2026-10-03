import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MuscleGroupService } from '../../core/services/muscle-group.service';
import { ExerciseService } from '../../core/services/exercise.service';
import { WorkoutPlanService } from '../../core/services/workout-plan.service';
import { WorkoutService } from '../../core/services/workout.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { BarChartComponent, BarChartPoint } from '../../shared/components/bar-chart/bar-chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, StatCardComponent, CardComponent, BarChartComponent],
  styles: [`
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }
    .chart-card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .chart-card h3 {
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: 4px;
    }
    .chart-card p {
      color: var(--color-text-muted);
      font-size: 0.85rem;
      margin: 0;
    }
    .chart-period {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--color-text-muted);
      background: var(--color-surface-hover);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 5px 10px;
      white-space: nowrap;
    }
    .loading {
      color: var(--color-text-muted);
      text-align: center;
      padding: 40px;
    }
    .error-msg {
      color: var(--color-danger);
      background: var(--color-danger-soft);
      border: 1px solid var(--color-danger);
      border-radius: var(--radius-sm);
      padding: 12px 16px;
      margin-bottom: 20px;
    }
  `],
  template: `
    <ui-page-header title="Dashboard" subtitle="Visão geral do sistema GordoFit" />

    @if (error()) {
      <div class="error-msg">{{ error() }}</div>
    }

    @if (loading()) {
      <div class="loading">Carregando dados...</div>
    } @else {
      <div class="cards-grid">
        <ui-stat-card label="Grupos Musculares" [value]="counts().muscleGroups" iconName="muscle-group" accent="var(--color-primary)" />
        <ui-stat-card label="Exercícios" [value]="counts().exercises" iconName="exercise" accent="var(--color-success)" />
        <ui-stat-card label="Planos de Treino" [value]="counts().workoutPlans" iconName="workout-plan" accent="var(--color-warning)" />
        <ui-stat-card label="Treinos" [value]="counts().workouts" iconName="workout" accent="var(--color-danger)" />
      </div>

      <ui-card class="chart-card">
        <div class="chart-card-header">
          <div>
            <h3>Conteúdo cadastrado</h3>
            <p>Comparativo geral entre as entidades do sistema</p>
          </div>
          <span class="chart-period">Total acumulado</span>
        </div>
        <ui-bar-chart [data]="chartData()" />
      </ui-card>
    }
  `
})
export class DashboardComponent implements OnInit {
  private muscleGroupService = inject(MuscleGroupService);
  private exerciseService = inject(ExerciseService);
  private workoutPlanService = inject(WorkoutPlanService);
  private workoutService = inject(WorkoutService);

  loading = signal(true);
  error = signal('');
  counts = signal({ muscleGroups: 0, exercises: 0, workoutPlans: 0, workouts: 0 });
  chartData = signal<BarChartPoint[]>([]);

  ngOnInit() {
    forkJoin({
      muscleGroups: this.muscleGroupService.getAll(),
      exercises: this.exerciseService.getAll(),
      workoutPlans: this.workoutPlanService.getAll(),
      workouts: this.workoutService.getAll(),
    }).subscribe({
      next: (data) => {
        const counts = {
          muscleGroups: data.muscleGroups.length,
          exercises: data.exercises.length,
          workoutPlans: data.workoutPlans.length,
          workouts: data.workouts.length,
        };
        this.counts.set(counts);
        this.chartData.set([
          { label: 'Grupos', value: counts.muscleGroups },
          { label: 'Exercícios', value: counts.exercises },
          { label: 'Planos', value: counts.workoutPlans },
          { label: 'Treinos', value: counts.workouts },
        ]);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Erro ao carregar dados. Verifique se a API está rodando em http://localhost:5000');
        this.loading.set(false);
      }
    });
  }
}
