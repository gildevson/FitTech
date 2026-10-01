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

    ion-searchbar {
      --background: #16213e;
      --color: #e0e0e0;
      --placeholder-color: #6b7280;
      --icon-color: #e94560;
      --clear-button-color: #8892b0;
      --border-radius: 10px;
      padding: 12px 16px 4px;
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
      --background: rgba(233, 69, 96, 0.1);
      --color: #8892b0;
      border: 1px solid rgba(233, 69, 96, 0.2);
      font-size: 0.8rem;
      font-weight: 500;
      flex-shrink: 0;
      transition: all 0.2s;
    }

    ion-chip.active-chip {
      --background: rgba(233, 69, 96, 0.25);
      --color: #e94560;
      border-color: rgba(233, 69, 96, 0.5);
      font-weight: 700;
    }

    ion-list {
      background: transparent;
      padding: 0 8px;
    }

    ion-item {
      --background: #16213e;
      --color: #e0e0e0;
      --border-color: rgba(255, 255, 255, 0.05);
      --padding-start: 16px;
      --padding-end: 16px;
      --inner-padding-end: 0;
      border-radius: 10px;
      margin-bottom: 8px;
      border: 1px solid rgba(233, 69, 96, 0.1);
    }

    .exercise-icon {
      width: 44px;
      height: 44px;
      background: rgba(233, 69, 96, 0.12);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      flex-shrink: 0;
    }

    .exercise-icon ion-icon {
      color: #e94560;
      font-size: 1.3rem;
    }

    .exercise-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 12px 0;
      flex: 1;
    }

    .exercise-name {
      font-size: 0.95rem;
      font-weight: 600;
      color: #ffffff;
    }

    .muscle-group-tag {
      font-size: 0.76rem;
      font-weight: 600;
      color: #e94560;
      background: rgba(233, 69, 96, 0.1);
      padding: 2px 8px;
      border-radius: 4px;
      display: inline-block;
      align-self: flex-start;
    }

    .exercise-desc {
      font-size: 0.8rem;
      color: #8892b0;
      line-height: 1.4;
    }

    .section-info {
      padding: 4px 16px 8px;
      font-size: 0.82rem;
      color: #6b7280;
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

    .skeleton-item {
      background: #16213e;
      border-radius: 10px;
      padding: 16px;
      margin: 0 8px 8px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .skeleton-avatar {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      flex-shrink: 0;
    }

    .skeleton-lines {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    ion-skeleton-text {
      --background: rgba(255, 255, 255, 0.08);
      border-radius: 4px;
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
          <ion-icon name="information-circle"></ion-icon>
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
  selectedMuscleGroup = signal<number | null>(null);

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

  selectMuscleGroup(id: number | null) {
    this.selectedMuscleGroup.set(id);
  }
}
