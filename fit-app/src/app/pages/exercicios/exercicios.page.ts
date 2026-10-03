import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonChip,
  IonSkeletonText,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
  RefresherEventDetail
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { barbell, bodyOutline, informationCircle, search } from 'ionicons/icons';
import { ApiService } from '../../core/services/api.service';
import { Exercise, MuscleGroup } from '../../core/models';

@Component({
  selector: 'app-exercicios',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    IonChip,
    IonSkeletonText,
    IonRefresher,
    IonRefresherContent,
    IonIcon
  ],
  styles: [`
    ion-searchbar {
      --background: var(--ft-surface);
      --box-shadow: inset 0 0 0 1px var(--ft-border);
      --border-radius: var(--ft-radius);
      --clear-button-color: var(--ft-text-muted);
      padding: 14px 16px 4px;
    }

    .filter-chips {
      display: flex;
      gap: 8px;
      padding: 8px 16px 12px;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .filter-chips::-webkit-scrollbar {
      display: none;
    }

    ion-chip {
      --background: var(--ft-surface);
      --color: var(--ft-text-muted);
      border: 1px solid var(--ft-border);
      margin: 0;
      font-size: 0.8rem;
      font-weight: 500;
      flex-shrink: 0;
      cursor: pointer;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }

    ion-chip.active-chip {
      --background: var(--ft-accent);
      --color: #ffffff;
      border-color: var(--ft-accent);
      font-weight: 600;
    }

    ion-list {
      padding: 0 16px 16px;
    }

    ion-item {
      --background: var(--ft-surface);
      --color: var(--ft-text);
      --padding-start: 14px;
      --padding-end: 14px;
      --inner-padding-end: 0;
      border-radius: var(--ft-radius);
      margin-bottom: 8px;
      border: 1px solid var(--ft-border);
    }

    .exercise-icon {
      width: 44px;
      height: 44px;
      background: var(--ft-accent-soft);
      border-radius: var(--ft-radius);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 14px;
      flex-shrink: 0;
    }

    .exercise-icon ion-icon {
      color: var(--ft-accent);
      font-size: 1.25rem;
    }

    .exercise-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px 0;
      flex: 1;
    }

    .exercise-name {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--ft-text);
    }

    .muscle-group-tag {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--ft-accent);
      background: var(--ft-accent-soft);
      padding: 2px 8px;
      border-radius: 6px;
      letter-spacing: 0.02em;
      display: inline-block;
      align-self: flex-start;
    }

    .exercise-desc {
      font-size: 0.8rem;
      color: var(--ft-text-muted);
      line-height: 1.45;
      white-space: normal;
    }

    .section-info {
      margin: 0;
      padding: 4px 20px 10px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--ft-text-faint);
    }

    .skeleton-item {
      background: var(--ft-surface);
      border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius);
      padding: 14px;
      margin: 0 16px 8px;
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .skeleton-avatar {
      width: 44px;
      height: 44px;
      border-radius: var(--ft-radius);
      flex-shrink: 0;
    }

    .skeleton-lines {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
  `],
  template: `
    <ion-header [translucent]="false">
      <ion-toolbar>
        <ion-title>Exercícios</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <ion-searchbar
        placeholder="Buscar exercício..."
        [(ngModel)]="searchText"
        (ionInput)="onSearch()"
        [debounce]="300"
      ></ion-searchbar>

      @if (muscleGroups().length > 0) {
        <div class="filter-chips">
          <ion-chip
            [class.active-chip]="selectedMuscleGroup() === null"
            (click)="selectMuscleGroup(null)"
          >
            Todos
          </ion-chip>
          @for (mg of muscleGroups(); track mg.id) {
            <ion-chip
              [class.active-chip]="selectedMuscleGroup() === mg.id"
              (click)="selectMuscleGroup(mg.id)"
            >
              {{ mg.name }}
            </ion-chip>
          }
        </div>
      }

      @if (loading()) {
        @for (i of [1,2,3,4,5]; track i) {
          <div class="skeleton-item">
            <ion-skeleton-text [animated]="true" class="skeleton-avatar"></ion-skeleton-text>
            <div class="skeleton-lines">
              <ion-skeleton-text [animated]="true" style="width: 65%; height: 16px;"></ion-skeleton-text>
              <ion-skeleton-text [animated]="true" style="width: 40%; height: 12px;"></ion-skeleton-text>
            </div>
          </div>
        }
      } @else if (filteredExercises().length === 0) {
        <div class="empty-state">
          <div class="empty-icon"><ion-icon name="information-circle"></ion-icon></div>
          <p>Nenhum exercício encontrado.</p>
        </div>
      } @else {
        <p class="section-info">{{ filteredExercises().length }} exercício(s) encontrado(s)</p>
        <ion-list lines="none">
          @for (exercise of filteredExercises(); track exercise.id) {
            <ion-item>
              <div class="exercise-icon" slot="start">
                <ion-icon name="barbell"></ion-icon>
              </div>
              <div class="exercise-info">
                <span class="exercise-name">{{ exercise.name }}</span>
                @if (exercise.muscleGroupName) {
                  <span class="muscle-group-tag">{{ exercise.muscleGroupName }}</span>
                }
                @if (exercise.description) {
                  <span class="exercise-desc">{{ exercise.description }}</span>
                }
              </div>
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `
})
export class ExerciciosPage implements OnInit {
  private readonly api = inject(ApiService);

  exercises = signal<Exercise[]>([]);
  muscleGroups = signal<MuscleGroup[]>([]);
  loading = signal(true);
  searchText = '';
  selectedMuscleGroup = signal<string | null>(null);

  filteredExercises = computed(() => {
    let list = this.exercises();

    if (this.selectedMuscleGroup() !== null) {
      list = list.filter(e => e.muscleGroupId === this.selectedMuscleGroup());
    }

    const text = this.searchText.toLowerCase().trim();
    if (text) {
      list = list.filter(e =>
        e.name.toLowerCase().includes(text) ||
        (e.muscleGroupName ?? '').toLowerCase().includes(text) ||
        (e.description ?? '').toLowerCase().includes(text)
      );
    }

    return list;
  });

  constructor() {
    addIcons({ barbell, bodyOutline, informationCircle, search });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);

    this.api.get<MuscleGroup[]>('/api/muscle-groups').subscribe({
      next: (groups) => this.muscleGroups.set(groups),
      error: () => this.muscleGroups.set([])
    });

    this.api.get<Exercise[]>('/api/exercises').subscribe({
      next: (exercises) => {
        this.exercises.set(exercises);
        this.loading.set(false);
      },
      error: () => {
        this.exercises.set([]);
        this.loading.set(false);
      }
    });
  }

  handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    this.loadData();
    setTimeout(() => event.detail.complete(), 1000);
  }

  onSearch() {
    // computed signal reacts automatically via filteredExercises
  }

  selectMuscleGroup(id: string | null) {
    this.selectedMuscleGroup.set(id);
  }
}
