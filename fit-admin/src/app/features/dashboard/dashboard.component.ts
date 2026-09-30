import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MuscleGroupService } from '../../core/services/muscle-group.service';
import { ExerciseService } from '../../core/services/exercise.service';
import { WorkoutPlanService } from '../../core/services/workout-plan.service';
import { WorkoutService } from '../../core/services/workout.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .page-header {
      margin-bottom: 32px;
    }
    .page-header h1 {
      font-size: 1.8rem;
      color: #ffffff;
      margin: 0 0 6px 0;
    }
    .page-header p {
      color: #6060a0;
      margin: 0;
      font-size: 0.9rem;
    }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 20px;
    }
    .stat-card {
      background: #16213e;
      border: 1px solid #0f3460;
      border-radius: 12px;
      padding: 28px 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    }
    .stat-icon {
      font-size: 2rem;
    }
    .stat-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: #e94560;
      line-height: 1;
    }
    .stat-label {
      font-size: 0.9rem;
      color: #8080a0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .loading {
      color: #6060a0;
      text-align: center;
      padding: 40px;
    }
    .error-msg {
      color: #e94560;
      background: rgba(233,69,96,0.1);
      border: 1px solid rgba(233,69,96,0.3);
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
    }
  `],
  template: `
    <div class="page-header">
      <h1>Dashboard</h1>
      <p>Visão geral do sistema FitTech</p>
    </div>

    @if (error()) {
      <div class="error-msg">{{ error() }}</div>
    }

    @if (loading()) {
      <div class="loading">Carregando dados...</div>
    } @else {
      <div class="cards-grid">
        <div class="stat-card">
          <div class="stat-icon">&#9670;</div>
          <div class="stat-value">{{ counts().muscleGroups }}</div>
          <div class="stat-label">Grupos Musculares</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">&#9651;</div>
          <div class="stat-value">{{ counts().exercises }}</div>
          <div class="stat-label">Exercícios</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">&#9654;</div>
          <div class="stat-value">{{ counts().workoutPlans }}</div>
          <div class="stat-label">Planos de Treino</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">&#9733;</div>
          <div class="stat-value">{{ counts().workouts }}</div>
          <div class="stat-label">Treinos</div>
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

  loading = signal(true);
  error = signal('');
  counts = signal({ muscleGroups: 0, exercises: 0, workoutPlans: 0, workouts: 0 });

  ngOnInit() {
    forkJoin({
      muscleGroups: this.muscleGroupService.getAll(),
      exercises: this.exerciseService.getAll(),
      workoutPlans: this.workoutPlanService.getAll(),
      workouts: this.workoutService.getAll(),
    }).subscribe({
      next: (data) => {
        this.counts.set({
          muscleGroups: data.muscleGroups.length,
          exercises: data.exercises.length,
          workoutPlans: data.workoutPlans.length,
          workouts: data.workouts.length,
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Erro ao carregar dados. Verifique se a API está rodando em http://localhost:5000');
        this.loading.set(false);
      }
    });
  }
}
