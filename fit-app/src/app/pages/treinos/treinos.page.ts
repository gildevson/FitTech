import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonSkeletonText,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
  RefresherEventDetail
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { flame, calendar, list, chevronForward, informationCircle } from 'ionicons/icons';
import { ApiService } from '../../core/services/api.service';
import { WorkoutPlan, Workout } from '../../core/models';

const DAY_NAMES: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado'
};

@Component({
  selector: 'app-treinos',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonSkeletonText,
    IonRefresher,
    IonRefresherContent,
    IonIcon
  ],
  styles: [`
    ion-header ion-toolbar {
      --background: #16213e;
      --color: #ffffff;
      --border-color: rgba(233, 69, 96, 0.3);
    }

    ion-toolbar ion-title {
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #ffffff;
    }

    .title-accent {
      color: #e94560;
    }

    ion-content {
      --background: #1a1a2e;
    }

    .section-header {
      padding: 20px 16px 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-header ion-icon {
      color: #e94560;
      font-size: 1.2rem;
    }

    .section-header h2 {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      color: #ccd6f6;
      letter-spacing: 0.3px;
    }

    ion-card {
      --background: #16213e;
      border: 1px solid rgba(233, 69, 96, 0.15);
      border-radius: 12px;
      margin: 8px 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    ion-card-header {
      padding-bottom: 4px;
    }

    ion-card-title {
      font-size: 1rem;
      font-weight: 700;
      color: #ffffff;
    }

    ion-card-subtitle {
      font-size: 0.8rem;
      color: #8892b0;
      margin-top: 4px;
    }

    ion-card-content {
      padding-top: 8px;
    }

    .workout-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .workout-item {
      background: rgba(255, 255, 255, 0.04);
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .workout-item-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .workout-name {
      font-size: 0.9rem;
      font-weight: 600;
      color: #e0e0e0;
    }

    .workout-day {
      font-size: 0.78rem;
      color: #e94560;
      font-weight: 500;
    }

    .workout-item ion-icon {
      color: #4a5568;
      font-size: 1rem;
    }

    .empty-state {
      text-align: center;
      padding: 60px 32px;
      color: #8892b0;
    }

    .empty-state ion-icon {
      font-size: 3rem;
      color: #2d3748;
      display: block;
      margin-bottom: 16px;
    }

    .empty-state p {
      margin: 0;
      font-size: 0.9rem;
    }

    .skeleton-card {
      --background: #16213e;
      border: 1px solid rgba(233, 69, 96, 0.1);
      border-radius: 12px;
      margin: 8px 16px;
      padding: 16px;
    }

    ion-skeleton-text {
      --background: rgba(255, 255, 255, 0.08);
      --background-rgb: 255, 255, 255;
      border-radius: 4px;
    }

    .plan-count-badge {
      --background: rgba(233, 69, 96, 0.15);
      --color: #e94560;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
    }
  `],
  template: `
    <ion-header [translucent]="false">
      <ion-toolbar>
        <ion-title>Fit<span class="title-accent">Tech</span> — Treinos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (loading()) {
        @for (i of [1,2,3]; track i) {
          <div class="skeleton-card">
            <ion-skeleton-text [animated]="true" style="width: 60%; height: 18px; margin-bottom: 8px;"></ion-skeleton-text>
            <ion-skeleton-text [animated]="true" style="width: 80%; height: 14px; margin-bottom: 16px;"></ion-skeleton-text>
            <ion-skeleton-text [animated]="true" style="width: 100%; height: 40px;"></ion-skeleton-text>
          </div>
        }
      } @else if (workoutPlans().length === 0) {
        <div class="empty-state">
          <ion-icon name="information-circle"></ion-icon>
          <p>Nenhum plano de treino encontrado.</p>
        </div>
      } @else {
        <div class="section-header">
          <ion-icon name="flame"></ion-icon>
          <h2>Planos de Treino ({{ workoutPlans().length }})</h2>
        </div>

        @for (plan of workoutPlans(); track plan.id) {
          <ion-card>
            <ion-card-header>
              <ion-card-title>{{ plan.name }}</ion-card-title>
              @if (plan.description) {
                <ion-card-subtitle>{{ plan.description }}</ion-card-subtitle>
              }
            </ion-card-header>
            <ion-card-content>
              @if (getWorkoutsForPlan(plan.id).length > 0) {
                <div class="workout-list">
                  @for (workout of getWorkoutsForPlan(plan.id); track workout.id) {
                    <div class="workout-item">
                      <div class="workout-item-info">
                        <span class="workout-name">{{ workout.name }}</span>
                        <span class="workout-day">{{ getDayName(workout.dayOfWeek) }}</span>
                      </div>
                      <ion-icon name="chevron-forward"></ion-icon>
                    </div>
                  }
                </div>
              } @else {
                <p style="color: #6b7280; font-size: 0.85rem; margin: 0;">
                  Nenhum treino cadastrado neste plano.
                </p>
              }
            </ion-card-content>
          </ion-card>
        }
      }
    </ion-content>
  `
})
export class TreinosPage implements OnInit {
  private readonly api = inject(ApiService);

  workoutPlans = signal<WorkoutPlan[]>([]);
  workouts = signal<Workout[]>([]);
  loading = signal(true);

  constructor() {
    addIcons({ flame, calendar, list, chevronForward, informationCircle });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);

    this.api.get<WorkoutPlan[]>('/api/workout-plans').subscribe({
      next: (plans) => this.workoutPlans.set(plans),
      error: () => this.workoutPlans.set([])
    });

    this.api.get<Workout[]>('/api/workouts').subscribe({
      next: (workouts) => {
        this.workouts.set(workouts);
        this.loading.set(false);
      },
      error: () => {
        this.workouts.set([]);
        this.loading.set(false);
      }
    });
  }

  handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    this.loadData();
    setTimeout(() => event.detail.complete(), 1000);
  }

  getWorkoutsForPlan(planId: number): Workout[] {
    return this.workouts().filter(w => w.workoutPlanId === planId);
  }

  getDayName(day: number): string {
    return DAY_NAMES[day] ?? `Dia ${day}`;
  }
}
