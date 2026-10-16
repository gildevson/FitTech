import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { DietService } from '../../core/services/diet.service';
import { WorkoutAssignmentService } from '../../core/services/workout-assignment.service';
import { AppUser, Diet, AssignedWorkout } from '../../core/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface UserRow {
  user: AppUser;
  expanded: boolean;
  activeTab: 'dietas' | 'treinos';
  // dietas
  diets: Diet[];
  dietsLoading: boolean;
  // treinos
  workouts: AssignedWorkout[];
  workoutsLoading: boolean;
}

@Component({
  selector: 'app-alunos',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ButtonComponent, BadgeComponent],
  styles: [`
    :host { display: block; }

    .user-list { display: flex; flex-direction: column; gap: 10px; }

    .user-card {
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
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

    .user-meta { min-width: 0; }
    .user-name { font-size: 0.95rem; font-weight: 700; color: var(--color-text); }
    .user-email { font-size: 0.8rem; color: var(--color-text-muted); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .user-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

    .chevron {
      width: 18px; height: 18px; color: var(--color-text-muted);
      transition: transform 0.2s; flex-shrink: 0;
    }
    .chevron.open { transform: rotate(180deg); }

    /* Panel */
    .user-panel {
      border-top: 1px solid var(--color-border);
      background: var(--color-surface);
    }

    /* Tabs */
    .tab-bar {
      display: flex;
      border-bottom: 1px solid var(--color-border);
      padding: 0 20px;
    }
    .tab-btn {
      padding: 10px 16px;
      font-size: 0.82rem; font-weight: 600;
      color: var(--color-text-muted);
      background: none; border: none; cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: color 0.15s, border-color 0.15s;
    }
    .tab-btn.active {
      color: var(--color-primary);
      border-bottom-color: var(--color-primary);
    }

    /* Tab content */
    .tab-content { padding: 18px 20px 20px; }

    .section-label {
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: var(--color-text-muted); margin-bottom: 10px;
    }

    /* Assign row */
    .assign-row { display: flex; gap: 8px; margin-bottom: 16px; }
    .assign-select {
      flex: 1; padding: 9px 12px;
      background: var(--color-card-bg); border: 1px solid var(--color-border);
      border-radius: var(--radius-sm); color: var(--color-text);
      font-size: 0.88rem; font-family: var(--font-family); outline: none;
      transition: border-color 0.15s;
    }
    .assign-select:focus { border-color: var(--color-primary); }

    /* Items */
    .item-list { display: flex; flex-direction: column; gap: 8px; }
    .item-row {
      display: flex; align-items: center; gap: 12px;
      padding: 11px 16px;
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
    }
    .item-row.diet-row { border-left: 3px solid var(--color-primary); }
    .item-row.workout-row { border-left: 3px solid #a855f7; }

    .item-info { flex: 1; min-width: 0; }
    .item-name { font-size: 0.9rem; font-weight: 700; color: var(--color-text); }
    .item-sub { font-size: 0.74rem; color: var(--color-text-muted); margin-top: 2px; }

    .day-badge {
      font-size: 0.68rem; font-weight: 700; white-space: nowrap;
      color: #a855f7;
      background: color-mix(in srgb, #a855f7 12%, transparent);
      border: 1px solid color-mix(in srgb, #a855f7 30%, transparent);
      border-radius: 20px; padding: 3px 10px;
    }

    .kcal-badge {
      font-size: 0.68rem; font-weight: 700; white-space: nowrap;
      color: var(--color-warning, #f59e0b);
      background: color-mix(in srgb, var(--color-warning, #f59e0b) 12%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-warning, #f59e0b) 30%, transparent);
      border-radius: 20px; padding: 3px 10px;
    }

    .btn-remove {
      background: transparent; border: 1px solid var(--color-border);
      border-radius: var(--radius-sm); color: var(--color-text-muted);
      cursor: pointer; padding: 5px 10px; font-size: 0.78rem;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .btn-remove:hover {
      background: var(--color-danger-soft); color: var(--color-danger);
      border-color: var(--color-danger);
    }

    .empty-msg {
      text-align: center; padding: 14px;
      color: var(--color-text-muted); font-size: 0.85rem;
      background: var(--color-card-bg);
      border: 1px dashed var(--color-border); border-radius: var(--radius-sm);
    }
    .loading-msg { color: var(--color-text-muted); padding: 40px; text-align: center; }
  `],
  template: `
    <ui-page-header title="Gestão de Alunos" subtitle="Gerencie dietas e treinos atribuídos a cada aluno" />

    @if (loading()) {
      <p class="loading-msg">Carregando...</p>
    } @else {
      <div class="user-list">
        @for (item of rows(); track item.user.id) {
          <div class="user-card">

            <div class="user-row" (click)="toggle(item)">
              <div class="user-left">
                <div class="avatar">{{ item.user.name.charAt(0).toUpperCase() }}</div>
                <div class="user-meta">
                  <div class="user-name">{{ item.user.name }}</div>
                  <div class="user-email">{{ item.user.email }}</div>
                </div>
              </div>
              <div class="user-right">
                <ui-badge variant="neutral">{{ item.diets.length }} dietas</ui-badge>
                <ui-badge variant="primary">{{ item.workouts.length }} treinos</ui-badge>
                <svg class="chevron" [class.open]="item.expanded" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>

            @if (item.expanded) {
              <div class="user-panel">
                <div class="tab-bar">
                  <button class="tab-btn" [class.active]="item.activeTab === 'dietas'" (click)="setTab(item, 'dietas')">
                    🥗 Dietas
                  </button>
                  <button class="tab-btn" [class.active]="item.activeTab === 'treinos'" (click)="setTab(item, 'treinos')">
                    💪 Treinos Atribuídos
                  </button>
                </div>

                <div class="tab-content">

                  @if (item.activeTab === 'dietas') {
                    <!-- Atribuir dieta -->
                    <p class="section-label">Atribuir Dieta</p>
                    <div class="assign-row">
                      <select class="assign-select"
                        [(ngModel)]="dietSelections[item.user.id]"
                        [name]="'diet-' + item.user.id">
                        <option value="">Selecione uma dieta...</option>
                        @for (d of allDiets(); track d.id) {
                          <option [value]="d.id">{{ d.name }}</option>
                        }
                      </select>
                      <ui-button [disabled]="!dietSelections[item.user.id]" (click)="assignDiet(item)">
                        + Atribuir
                      </ui-button>
                    </div>

                    <p class="section-label">Dietas Atribuídas</p>
                    @if (item.dietsLoading) {
                      <p class="empty-msg">Carregando...</p>
                    } @else if (item.diets.length === 0) {
                      <p class="empty-msg">Nenhuma dieta atribuída a este aluno.</p>
                    } @else {
                      <div class="item-list">
                        @for (diet of item.diets; track diet.id) {
                          <div class="item-row diet-row">
                            <div class="item-info">
                              <div class="item-name">{{ diet.name }}</div>
                              @if (diet.description) {
                                <div class="item-sub">{{ diet.description }}</div>
                              }
                            </div>
                            <span class="kcal-badge">{{ getDietKcal(diet) }} kcal</span>
                            <button class="btn-remove" (click)="unassignDiet(item, diet.id)">Remover</button>
                          </div>
                        }
                      </div>
                    }
                  }

                  @if (item.activeTab === 'treinos') {
                    <p class="section-label">Treinos Atribuídos pelo Personal</p>
                    @if (item.workoutsLoading) {
                      <p class="empty-msg">Carregando...</p>
                    } @else if (item.workouts.length === 0) {
                      <p class="empty-msg">Nenhum treino atribuído a este aluno. Use a página "Treinos" para atribuir.</p>
                    } @else {
                      <div class="item-list">
                        @for (w of item.workouts; track w.id) {
                          <div class="item-row workout-row">
                            <div class="item-info">
                              <div class="item-name">{{ w.workoutName }}</div>
                              <div class="item-sub">{{ w.planName }}</div>
                            </div>
                            <span class="day-badge">{{ getDayName(w.dayOfWeek) }}</span>
                            <button class="btn-remove" (click)="unassignWorkout(item, w)">Remover</button>
                          </div>
                        }
                      </div>
                    }
                  }

                </div>
              </div>
            }
          </div>
        }
      </div>
    }
  `
})
export class AlunosComponent implements OnInit {
  private userService = inject(UserService);
  private dietService = inject(DietService);
  private assignService = inject(WorkoutAssignmentService);

  loading = signal(true);
  rows = signal<UserRow[]>([]);
  allDiets = signal<Diet[]>([]);
  dietSelections: Record<string, string> = {};

  ngOnInit() {
    forkJoin({
      users: this.userService.getAll(),
      diets: this.dietService.getAll(),
    }).subscribe({
      next: ({ users, diets }) => {
        const alunos = users.filter((u: AppUser) => u.role === 'user');
        this.allDiets.set(diets);
        this.rows.set(alunos.map((u: AppUser) => ({
          user: u,
          expanded: false,
          activeTab: 'dietas',
          diets: [],
          dietsLoading: false,
          workouts: [],
          workoutsLoading: false,
        })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  toggle(item: UserRow) {
    item.expanded = !item.expanded;
    if (item.expanded) {
      if (item.diets.length === 0 && !item.dietsLoading) this.loadDiets(item);
      if (item.workouts.length === 0 && !item.workoutsLoading) this.loadWorkouts(item);
    }
    this.rows.update(r => [...r]);
  }

  setTab(item: UserRow, tab: 'dietas' | 'treinos') {
    item.activeTab = tab;
    this.rows.update(r => [...r]);
  }

  loadDiets(item: UserRow) {
    item.dietsLoading = true;
    this.rows.update(r => [...r]);
    this.dietService.getUserDiets(item.user.id).subscribe({
      next: (diets) => {
        Promise.all(
          diets.map(d => new Promise<Diet>(resolve => {
            this.dietService.getById(d.id).subscribe({
              next: full => resolve(full),
              error: () => resolve({ ...d, meals: [] })
            });
          }))
        ).then(full => {
          item.diets = full;
          item.dietsLoading = false;
          this.rows.update(r => [...r]);
        });
      },
      error: () => { item.dietsLoading = false; this.rows.update(r => [...r]); }
    });
  }

  loadWorkouts(item: UserRow) {
    item.workoutsLoading = true;
    this.rows.update(r => [...r]);
    this.assignService.getAssignmentsForUser(item.user.id).subscribe({
      next: (workouts) => {
        item.workouts = workouts;
        item.workoutsLoading = false;
        this.rows.update(r => [...r]);
      },
      error: () => { item.workoutsLoading = false; this.rows.update(r => [...r]); }
    });
  }

  assignDiet(item: UserRow) {
    const dietId = this.dietSelections[item.user.id];
    if (!dietId) return;
    this.dietService.assignToUser({ userId: item.user.id, dietId }).subscribe({
      next: () => {
        this.dietSelections[item.user.id] = '';
        item.diets = [];
        this.loadDiets(item);
      }
    });
  }

  unassignDiet(item: UserRow, dietId: string) {
    this.dietService.unassignFromUser(item.user.id, dietId).subscribe({
      next: () => { item.diets = []; this.loadDiets(item); }
    });
  }

  unassignWorkout(item: UserRow, w: AssignedWorkout) {
    this.assignService.unassign(w.workoutId, item.user.id).subscribe({
      next: () => { item.workouts = []; this.loadWorkouts(item); }
    });
  }

  getDayName(day: number): string {
    return DAY_NAMES[day] ?? String(day);
  }

  getDietKcal(diet: Diet): number {
    return (diet.meals ?? []).reduce((t, m) =>
      t + (m.foods ?? []).reduce((s, f) => s + (f.calories || 0), 0), 0);
  }
}
