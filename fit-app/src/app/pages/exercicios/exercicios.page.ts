import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ProfileButtonComponent } from '../../shared/profile-button/profile-button.component';
import { PageTitleComponent } from '../../shared/page-title/page-title.component';
import { TPipe } from "../../core/i18n/t.pipe";
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonSkeletonText,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
  IonModal,
  RefresherEventDetail
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barbell, close, bodyOutline, informationCircle, chevronForward,
  fitnessOutline, listOutline, buildOutline, chevronBack, thumbsUpOutline, thumbsDownOutline, chevronDown, checkmark
} from 'ionicons/icons';
import { ApiService } from '../../core/services/api.service';
import { Exercise, MuscleGroup } from '../../core/models';

@Component({
  selector: 'app-exercicios',
  standalone: true,
  imports: [
    TPipe,
    ProfileButtonComponent,
    PageTitleComponent,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonSearchbar, IonSkeletonText,
    IonRefresher, IonRefresherContent, IonIcon,
    IonModal
  ],
  styles: [`
    ion-searchbar {
      --background: var(--ft-surface);
      --box-shadow: inset 0 0 0 1px var(--ft-border);
      --border-radius: var(--ft-radius);
      --clear-button-color: var(--ft-text-muted);
      padding: 14px 16px 4px;
    }

    /* Filtro por grupo muscular: botão + lista própria (a lista nativa do navegador não aceita estilo) */
    .group-pick { position: relative; margin: 8px 16px 12px; z-index: 5; }
    .gp-trigger {
      width: 100%; height: 48px; display: flex; align-items: center; gap: 10px; padding: 0 14px; cursor: pointer;
      background: var(--ft-surface); color: var(--ft-text); text-align: left;
      border: 1px solid var(--ft-border); border-radius: var(--ft-radius);
      font-family: inherit; font-size: 0.92rem; font-weight: 700;
      transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .gp-trigger:focus-visible { outline: 2px solid var(--ft-accent-ring); outline-offset: 1px; }
    .group-pick.filtered .gp-trigger { border-color: var(--ft-accent); background: var(--ft-accent-soft); }
    .group-pick.open .gp-trigger { border-color: var(--ft-accent); box-shadow: 0 0 0 3px var(--ft-accent-soft); }
    .gp-icon { font-size: 1.15rem; color: var(--ft-text-faint); }
    .group-pick.filtered .gp-icon, .group-pick.open .gp-icon { color: var(--ft-accent); }
    .gp-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .gp-count {
      font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 999px;
      background: var(--ft-bg-elevated); color: var(--ft-text-muted); font-variant-numeric: tabular-nums;
    }
    .group-pick.filtered .gp-count { background: var(--ft-accent); color: #fff; }
    .gp-chev { font-size: 1rem; color: var(--ft-text-muted); transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1); }
    .group-pick.open .gp-chev { transform: rotate(180deg); color: var(--ft-accent); }

    .gp-backdrop { position: fixed; inset: 0; z-index: 1; }
    .gp-menu {
      position: absolute; left: 0; right: 0; top: calc(100% + 6px); z-index: 2;
      max-height: min(360px, 55vh); overflow-y: auto; padding: 6px;
      background: var(--ft-surface); border: 1px solid var(--ft-border-strong); border-radius: var(--ft-radius-lg);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.22), var(--ft-shadow);
      transform-origin: top center; animation: gp-in 0.2s cubic-bezier(0.22, 1, 0.36, 1);
    }
    @keyframes gp-in { from { opacity: 0; transform: translateY(-6px) scale(0.98); } to { opacity: 1; transform: none; } }
    .gp-opt {
      width: 100%; display: flex; align-items: center; gap: 10px; padding: 11px 12px; border: 0; border-radius: 10px;
      background: transparent; color: var(--ft-text); font-family: inherit; font-size: 0.9rem; font-weight: 600;
      text-align: left; cursor: pointer; transition: background 0.12s;
    }
    .gp-opt:hover, .gp-opt:focus-visible { background: var(--ft-bg-elevated); outline: none; }
    .gp-opt.active { background: var(--ft-accent-soft); color: var(--ft-accent); }
    .gp-opt.empty { color: var(--ft-text-faint); font-weight: 500; }
    .gp-opt-name { flex: 1; }
    .gp-opt-count {
      min-width: 26px; text-align: center; font-size: 0.72rem; font-weight: 700; padding: 2px 7px; border-radius: 999px;
      background: var(--ft-bg-elevated); color: var(--ft-text-muted); font-variant-numeric: tabular-nums;
    }
    .gp-opt.active .gp-opt-count { background: var(--ft-accent); color: #fff; }
    .gp-check { font-size: 1.05rem; color: var(--ft-accent); visibility: hidden; }
    .gp-opt.active .gp-check { visibility: visible; }
    .gp-sep { height: 1px; margin: 4px 8px; background: var(--ft-border); }
    @media (prefers-reduced-motion: reduce) { .gp-menu { animation: none; } }

    .section-info {
      margin: 0;
      padding: 4px 20px 10px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--ft-text-faint);
    }

    .exercise-list { padding: 0 16px 80px; display: flex; flex-direction: column; gap: 10px; }

    .exercise-card {
      background: var(--ft-surface);
      border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius-lg);
      overflow: hidden;
      cursor: pointer;
      touch-action: pan-y;
      display: flex;
      align-items: stretch;
    }
    .exercise-card:active { opacity: 0.85; }

    .exercise-thumb {
      width: 80px;
      min-width: 80px;
      background: var(--ft-accent-soft);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    .exercise-thumb img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #ffffff;
      position: absolute;
      inset: 0;
    }
    .exercise-thumb ion-icon { color: var(--ft-accent); font-size: 2rem; z-index: 1; }

    .exercise-body {
      flex: 1;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .exercise-body-text { flex: 1; min-width: 0; }
    .exercise-name {
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--ft-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .muscle-group-tag {
      display: inline-block;
      font-size: 0.68rem;
      font-weight: 600;
      color: var(--ft-accent);
      background: var(--ft-accent-soft);
      padding: 2px 7px;
      border-radius: 6px;
      margin-top: 3px;
    }
    .exercise-desc-preview {
      font-size: 0.75rem;
      color: var(--ft-text-muted);
      margin-top: 4px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .chevron-icon { color: var(--ft-text-faint); font-size: 1.1rem; flex-shrink: 0; }

    .skeleton-card {
      background: var(--ft-surface);
      border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius-lg);
      margin: 0 16px 10px;
      padding: 14px;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .skeleton-thumb { width: 80px; height: 64px; border-radius: var(--ft-radius); flex-shrink: 0; }
    .skeleton-lines { flex: 1; display: flex; flex-direction: column; gap: 6px; }

    /* ---- Detail modal ---- */
    .detail-wrap {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: var(--ft-bg, #0f1117);
      overflow: hidden;
    }

    /* Image hero */
    .detail-hero {
      position: relative;
      background: #ffffff; /* as imagens dos exercícios têm fundo branco */
      flex-shrink: 0;
    }
    .detail-hero img {
      width: 100%;
      height: auto;
      max-height: 340px;
      object-fit: contain; /* mostra a imagem inteira, sem cortar */
      display: block;
    }
    .detail-hero-placeholder {
      width: 100%;
      height: 240px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(160deg, var(--ft-surface-2), var(--ft-bg));
    }
    .detail-hero-placeholder ion-icon {
      font-size: 5rem;
      color: var(--ft-accent);
      opacity: 0.35;
    }
    .detail-back-btn {
      position: absolute;
      top: 16px;
      left: 16px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(0,0,0,0.45);
      border: none;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1.1rem;
      backdrop-filter: blur(4px);
    }

    /* Info bar */
    .detail-info {
      padding: 18px 20px 12px;
      flex-shrink: 0;
    }
    .detail-tags {
      display: flex;
      gap: 8px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    .detail-tag {
      font-size: 0.73rem;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 20px;
      letter-spacing: 0.03em;
    }
    .detail-tag.muscle {
      background: var(--ft-accent-soft);
      color: var(--ft-accent);
    }
    .detail-tag.popular {
      background: rgba(34,197,94,0.15);
      color: #22c55e;
    }
    .detail-name {
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--ft-text);
      line-height: 1.2;
      margin-bottom: 4px;
    }

    /* Tab bar */
    .detail-tabs {
      display: flex;
      border-bottom: 1.5px solid var(--ft-border);
      flex-shrink: 0;
      padding: 0 20px;
      gap: 0;
    }
    .detail-tab {
      flex: 1;
      background: none;
      border: none;
      border-bottom: 2.5px solid transparent;
      padding: 10px 0;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--ft-text-faint);
      cursor: pointer;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      transition: color 0.15s, border-color 0.15s;
      margin-bottom: -1.5px;
    }
    .detail-tab.active {
      color: var(--ft-accent);
      border-bottom-color: var(--ft-accent);
    }

    /* Tab content */
    .detail-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }
    .detail-section-label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--ft-text-faint);
      margin-bottom: 10px;
    }
    .detail-description {
      font-size: 0.9rem;
      color: var(--ft-text-muted);
      line-height: 1.75;
      white-space: pre-line;
    }
    .detail-no-content {
      text-align: center;
      padding: 30px 0;
      color: var(--ft-text-faint);
      font-size: 0.85rem;
    }
    .muscle-highlight {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--ft-surface);
      border: 1px solid var(--ft-border);
      border-left: 3px solid var(--ft-accent);
      border-radius: var(--ft-radius);
      padding: 12px 16px;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--ft-text);
      margin-bottom: 12px;
      width: 100%;
      box-sizing: border-box;
    }
    .muscle-dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      background: var(--ft-accent);
      flex-shrink: 0;
    }
  `],
  template: `
    <ion-header [translucent]="false">
      <ion-toolbar>
        <ion-title><app-page-title [title]="'exercises.title' | t"></app-page-title></ion-title>
        <app-profile-button slot="end"></app-profile-button>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true" [scrollY]="true">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <ion-searchbar
        [placeholder]="'common.search_exercise' | t"
        [(ngModel)]="searchText"
        (ionInput)="onSearch()"
        [debounce]="300"
      ></ion-searchbar>

      @if (muscleGroups().length > 0) {
        <div class="group-pick" [class.filtered]="selectedMuscleGroup() !== null" [class.open]="groupMenuOpen()">
          <button type="button" class="gp-trigger" (click)="groupMenuOpen.set(!groupMenuOpen())"
                  aria-haspopup="listbox" [attr.aria-expanded]="groupMenuOpen()" [attr.aria-label]="'exercises.tab_muscle' | t">
            <ion-icon name="body-outline" class="gp-icon"></ion-icon>
            <span class="gp-label">{{ selectedGroupName() ?? ('common.all' | t) }}</span>
            <span class="gp-count">{{ filteredExercises().length }}</span>
            <ion-icon name="chevron-down" class="gp-chev"></ion-icon>
          </button>

          @if (groupMenuOpen()) {
            <!-- Toque fora fecha -->
            <div class="gp-backdrop" (click)="groupMenuOpen.set(false)"></div>
            <div class="gp-menu" role="listbox" (keydown.escape)="groupMenuOpen.set(false)">
              <button type="button" role="option" class="gp-opt" [class.active]="selectedMuscleGroup() === null"
                      [attr.aria-selected]="selectedMuscleGroup() === null" (click)="pickGroup(null)">
                <span class="gp-opt-name">{{ 'common.all' | t }}</span>
                <span class="gp-opt-count">{{ exercises().length }}</span>
                <ion-icon name="checkmark" class="gp-check"></ion-icon>
              </button>
              <div class="gp-sep"></div>
              @for (mg of sortedGroups(); track mg.id) {
                <button type="button" role="option" class="gp-opt" [class.active]="selectedMuscleGroup() === mg.id"
                        [class.empty]="!groupCounts()[mg.id]" [attr.aria-selected]="selectedMuscleGroup() === mg.id"
                        (click)="pickGroup(mg.id)">
                  <span class="gp-opt-name">{{ mg.name }}</span>
                  <span class="gp-opt-count">{{ groupCounts()[mg.id] || 0 }}</span>
                  <ion-icon name="checkmark" class="gp-check"></ion-icon>
                </button>
              }
            </div>
          }
        </div>
      }

      @if (loading()) {
        @for (i of [1,2,3,4,5]; track i) {
          <div class="skeleton-card">
            <ion-skeleton-text [animated]="true" class="skeleton-thumb"></ion-skeleton-text>
            <div class="skeleton-lines">
              <ion-skeleton-text [animated]="true" style="width: 65%; height: 16px;"></ion-skeleton-text>
              <ion-skeleton-text [animated]="true" style="width: 40%; height: 12px;"></ion-skeleton-text>
              <ion-skeleton-text [animated]="true" style="width: 80%; height: 11px;"></ion-skeleton-text>
            </div>
          </div>
        }
      } @else if (filteredExercises().length === 0) {
        <p style="text-align:center; padding: 40px 20px; color: var(--ft-text-faint); font-size: 0.88rem;">
          {{ 'common.no_exercise_found' | t }}
        </p>
      } @else {
        <p class="section-info">{{ 'exercises.count' | t: { n: filteredExercises().length } }}</p>
        <div class="exercise-list">
          @for (exercise of filteredExercises(); track exercise.id) {
            <div class="exercise-card" (click)="openDetail(exercise)">
              <div class="exercise-thumb">
                @if (exercise.imageUrl) {
                  <img [src]="exercise.imageUrl" [alt]="exercise.name" />
                } @else {
                  <ion-icon name="barbell"></ion-icon>
                }
              </div>
              <div class="exercise-body">
                <div class="exercise-body-text">
                  <div class="exercise-name">{{ exercise.name }}</div>
                  @if (exercise.muscleGroupName) {
                    <span class="muscle-group-tag">{{ exercise.muscleGroupName }}</span>
                  }
                  @if (exercise.description) {
                    <div class="exercise-desc-preview">{{ exercise.description }}</div>
                  }
                </div>
                <ion-icon name="chevron-forward" class="chevron-icon"></ion-icon>
              </div>
            </div>
          }
        </div>
      }
    </ion-content>

    <!-- Detail modal: full screen -->
    <ion-modal [isOpen]="showDetail()" (didDismiss)="closeDetail()" [breakpoints]="[0, 1]" [initialBreakpoint]="1">
      <ng-template>
        @if (selectedExercise(); as ex) {
          <div class="detail-wrap">

            <!-- Hero image -->
            <div class="detail-hero">
              @if (ex.imageUrl) {
                <img [src]="ex.imageUrl" [alt]="ex.name" />
              } @else {
                <div class="detail-hero-placeholder">
                  <ion-icon name="barbell"></ion-icon>
                </div>
              }
              <button class="detail-back-btn" (click)="closeDetail()">
                <ion-icon name="chevron-back"></ion-icon>
              </button>
            </div>

            <!-- Info -->
            <div class="detail-info">
              <div class="detail-tags">
                @if (ex.muscleGroupName) {
                  <span class="detail-tag muscle">{{ ex.muscleGroupName.toUpperCase() }}</span>
                }
              </div>
              <div class="detail-name">{{ ex.name }}</div>
            </div>

            <!-- Tabs -->
            <div class="detail-tabs">
              <button class="detail-tab" [class.active]="activeTab() === 'musculo'" (click)="activeTab.set('musculo')">{{ 'exercises.tab_muscle' | t }}</button>
              <button class="detail-tab" [class.active]="activeTab() === 'instrucoes'" (click)="activeTab.set('instrucoes')">{{ 'exercises.tab_instructions' | t }}</button>
              <button class="detail-tab" [class.active]="activeTab() === 'equipamento'" (click)="activeTab.set('equipamento')">{{ 'exercises.tab_equipment' | t }}</button>
            </div>

            <!-- Tab content -->
            <div class="detail-content">

              @if (activeTab() === 'musculo') {
                @if (ex.muscleGroupName) {
                  <div class="detail-section-label">{{ 'exercises.main_group' | t }}</div>
                  <div class="muscle-highlight">
                    <span class="muscle-dot"></span>
                    {{ ex.muscleGroupName }}
                  </div>
                } @else {
                  <div class="detail-no-content">{{ 'exercises.no_group' | t }}</div>
                }
              }

              @if (activeTab() === 'instrucoes') {
                <div class="detail-section-label">{{ 'exercises.how_to' | t }}</div>
                @if (ex.description) {
                  <div class="detail-description">{{ ex.description }}</div>
                } @else {
                  <div class="detail-no-content">{{ 'exercises.no_instructions' | t }}</div>
                }
              }

              @if (activeTab() === 'equipamento') {
                <div class="detail-no-content">{{ 'exercises.equipment_soon' | t }}</div>
              }

            </div>
          </div>
        }
      </ng-template>
    </ion-modal>
  `
})
export class ExerciciosPage implements OnInit {
  private readonly api = inject(ApiService);

  exercises = signal<Exercise[]>([]);
  muscleGroups = signal<MuscleGroup[]>([]);
  loading = signal(true);
  searchText = '';
  selectedMuscleGroup = signal<string | null>(null);
  selectedExercise = signal<Exercise | null>(null);
  showDetail = signal(false);
  activeTab = signal<'musculo' | 'instrucoes' | 'equipamento'>('musculo');

  /** Quantos exercícios há em cada grupo muscular (mostrado na lista de filtro) */
  groupCounts = computed(() => {
    const counts: Record<string, number> = {};
    for (const e of this.exercises()) {
      if (e.muscleGroupId) counts[e.muscleGroupId] = (counts[e.muscleGroupId] ?? 0) + 1;
    }
    return counts;
  });

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
    addIcons({ barbell, close, bodyOutline, informationCircle, chevronForward, fitnessOutline, listOutline, buildOutline, chevronBack, thumbsUpOutline, thumbsDownOutline, chevronDown, checkmark });
  }

  ngOnInit() { this.loadData(); }

  loadData() {
    this.loading.set(true);
    this.api.get<MuscleGroup[]>('/api/musclegroups').subscribe({
      next: (groups) => this.muscleGroups.set(groups),
      error: () => this.muscleGroups.set([])
    });
    this.api.get<Exercise[]>('/api/exercises').subscribe({
      next: (exercises) => { this.exercises.set(exercises); this.loading.set(false); },
      error: () => { this.exercises.set([]); this.loading.set(false); }
    });
  }

  handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    this.loadData();
    setTimeout(() => event.detail.complete(), 1000);
  }

  onSearch() {}

  selectMuscleGroup(id: string | null) { this.selectedMuscleGroup.set(id); }

  groupMenuOpen = signal(false);

  pickGroup(id: string | null) {
    this.selectMuscleGroup(id);
    this.groupMenuOpen.set(false);
  }

  selectedGroupName = computed(() => this.muscleGroups().find(g => g.id === this.selectedMuscleGroup())?.name ?? null);

  /** Grupos com exercícios primeiro (em ordem alfabética); os vazios vão para o fim */
  sortedGroups = computed(() => {
    const counts = this.groupCounts();
    return [...this.muscleGroups()].sort((a, b) =>
      Number(!counts[a.id]) - Number(!counts[b.id]) || a.name.localeCompare(b.name));
  });

  openDetail(exercise: Exercise) {
    this.selectedExercise.set(exercise);
    this.activeTab.set('musculo');
    this.showDetail.set(true);
  }

  closeDetail() {
    this.showDetail.set(false);
    this.selectedExercise.set(null);
  }
}
