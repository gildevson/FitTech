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
    .title-accent {
      color: var(--ft-accent);
    }

    .section-header {
      padding: 24px 20px 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .section-header h2 {
      margin: 0;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--ft-text-faint);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .plan-count-badge {
      background: var(--ft-accent-soft);
      color: var(--ft-accent);
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 20px;
    }

    ion-card {
      --background: var(--ft-surface);
      border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius-lg);
      margin: 10px 16px;
      box-shadow: var(--ft-shadow);
      overflow: hidden;
      position: relative;
    }

    ion-card::before {
      content: '';
      position: absolute;
      inset: 0 auto 0 0;
      width: 3px;
      background: var(--ft-gradient);
    }

    ion-card-header {
      padding: 18px 18px 4px;
    }

    ion-card-title {
      font-size: 1.05rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--ft-text);
    }

    ion-card-subtitle {
      font-size: 0.82rem;
      font-weight: 400;
      text-transform: none;
      letter-spacing: 0;
      color: var(--ft-text-muted);
      margin-top: 4px;
    }

    ion-card-content {
      padding: 12px 18px 18px;
    }

    .workout-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .workout-item {
      background: var(--ft-bg-elevated);
      border-radius: var(--ft-radius);
      padding: 12px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid var(--ft-border);
    }

    .workout-item-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .workout-name {
      font-size: 0.92rem;
      font-weight: 600;
      color: var(--ft-text);
    }

    .workout-day {
      align-self: flex-start;
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--ft-accent);
      background: var(--ft-accent-soft);
      padding: 2px 8px;
      border-radius: 6px;
      letter-spacing: 0.02em;
    }

    .workout-item ion-icon {
      color: var(--ft-text-faint);
      font-size: 1rem;
    }

    .plan-empty {
      color: var(--ft-text-faint);
      font-size: 0.85rem;
      margin: 0;
    }

    .skeleton-card {
      background: var(--ft-surface);
      border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius-lg);
      margin: 10px 16px;
      padding: 18px;
    }
  `],
  template: `
    <ion-header [translucent]="false">
      <ion-toolbar>
        <ion-title>Fit<span class="title-accent">Mob</span> · Treinos</ion-title>
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
            <ion-skeleton-text [animated]="true" style="width: 100%; height: 44px;"></ion-skeleton-text>
          </div>
        }
      } @else if (workoutPlans().length === 0) {
        <div class="empty-state">
          <div class="empty-icon"><ion-icon name="information-circle"></ion-icon></div>
          <p>Nenhum plano de treino encontrado.</p>
        </div>
      } @else {
        <div class="section-header">
          <h2>Planos de Treino</h2>
          <span class="plan-count-badge">{{ workoutPlans().length }}</span>
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
                <p class="plan-empty">
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

  getWorkoutsForPlan(planId: string): Workout[] {
    return this.workouts().filter(w => w.workoutPlanId === planId);
  }

  getDayName(day: number): string {
    return DAY_NAMES[day] ?? `Dia ${day}`;
  }
}
