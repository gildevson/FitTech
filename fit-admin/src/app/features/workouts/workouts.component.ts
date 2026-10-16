import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { WorkoutService } from '../../core/services/workout.service';
import { WorkoutPlanService } from '../../core/services/workout-plan.service';
import { WorkoutExerciseService } from '../../core/services/workout-exercise.service';
import { ExerciseService } from '../../core/services/exercise.service';
import { MuscleGroupService } from '../../core/services/muscle-group.service';
import { UserService } from '../../core/services/user.service';
import { WorkoutAssignmentService } from '../../core/services/workout-assignment.service';
import { Workout, WorkoutPlan, AppUser, WorkoutAssignee, WorkoutExercise, Exercise, MuscleGroup } from '../../core/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { TableCardComponent } from '../../shared/components/table-card/table-card.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { DrawerComponent } from '../../shared/components/drawer/drawer.component';

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAY_NAMES_FULL = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

@Component({
  selector: 'app-workouts',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ButtonComponent, TableCardComponent, BadgeComponent, DrawerComponent],
  styles: [`
    .empty-state { text-align: center; padding: 40px; color: var(--color-text-muted); }
    .loading { text-align: center; padding: 40px; color: var(--color-text-muted); }
    .alert { padding: 12px 16px; border-radius: var(--radius-sm); margin-bottom: 16px; font-size: 0.9rem; }
    .alert-success { background: var(--color-success-soft); border: 1px solid var(--color-success); color: var(--color-success); }
    .alert-error { background: var(--color-danger-soft); border: 1px solid var(--color-danger); color: var(--color-danger); }
    .drawer-title { margin: 0 0 4px; color: var(--color-text); font-size: 1.15rem; font-weight: 700; }
    .drawer-sub { margin: 0 0 20px; color: var(--color-text-muted); font-size: 0.82rem; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 6px; color: var(--color-text-muted); font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
    .form-group input, .form-group select {
      width: 100%; box-sizing: border-box;
      background: var(--color-card-bg); border: 1px solid var(--color-border); border-radius: var(--radius-sm);
      color: var(--color-text); padding: 10px 14px; font-size: 0.92rem; font-family: var(--font-family);
      transition: border-color 0.15s;
    }
    .form-group input:focus, .form-group select:focus { outline: none; border-color: var(--color-primary); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    /* ── Two-column editor layout (wide drawer) ── */
    .editor-layout {
      display: grid; grid-template-columns: 1fr 1fr; gap: 32px;
      align-items: start;
    }
    .editor-col { min-width: 0; }

    /* ── Exercises section ── */
    .section-divider { border: none; border-top: 1px solid var(--color-border); margin: 20px 0 14px; }
    .section-title {
      font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.06em; color: var(--color-text-muted); margin: 0 0 10px;
    }

    /* Added exercises list */
    .ex-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    .ex-row {
      display: flex; align-items: center; gap: 10px; padding: 10px 12px;
      background: var(--color-surface-hover); border: 1px solid var(--color-border);
      border-left: 3px solid var(--color-primary); border-radius: var(--radius-sm);
    }
    .ex-order {
      width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
      background: color-mix(in srgb, var(--color-primary) 12%, transparent);
      color: var(--color-primary); font-size: 0.65rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }
    .ex-thumb {
      width: 36px; height: 36px; border-radius: 6px; flex-shrink: 0;
      overflow: hidden; background: var(--color-surface-hover);
      border: 1px solid var(--color-border);
      display: flex; align-items: center; justify-content: center;
    }
    .ex-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .ex-thumb-av {
      font-size: 1rem; font-weight: 800;
      color: var(--color-primary);
    }
    .ex-info { flex: 1; min-width: 0; }
    .ex-name { font-size: 0.85rem; font-weight: 700; color: var(--color-text); }
    .ex-meta { font-size: 0.7rem; color: var(--color-text-muted); margin-top: 1px; }
    .ex-remove {
      background: none; border: none; cursor: pointer; color: var(--color-danger);
      font-size: 1rem; opacity: 0.5; transition: opacity 0.15s; padding: 2px 6px;
    }
    .ex-remove:hover { opacity: 1; }
    .ex-empty {
      text-align: center; padding: 14px; color: var(--color-text-muted); font-size: 0.82rem;
      border: 1px dashed var(--color-border); border-radius: var(--radius-sm); margin-bottom: 14px;
    }

    /* ── Exercise picker ── */
    .ex-picker {
      border: 1px solid var(--color-border); border-radius: var(--radius-sm);
      overflow: hidden;
    }
    .ex-picker-top {
      padding: 10px; border-bottom: 1px solid var(--color-border);
      background: var(--color-surface-hover);
    }
    .ex-search {
      width: 100%; box-sizing: border-box;
      padding: 8px 12px; border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
      background: var(--color-card-bg); color: var(--color-text);
      font-size: 0.88rem; font-family: var(--font-family); outline: none;
      transition: border-color 0.15s;
    }
    .ex-search:focus { border-color: var(--color-primary); }

    /* Muscle group chips */
    .muscle-chips {
      display: flex; gap: 6px; padding: 8px 10px; overflow-x: auto;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-surface-hover);
      scrollbar-width: none;
    }
    .muscle-chips::-webkit-scrollbar { display: none; }
    .mg-chip {
      flex-shrink: 0; padding: 4px 12px; border-radius: 20px;
      font-size: 0.72rem; font-weight: 600; cursor: pointer;
      border: 1px solid var(--color-border);
      background: var(--color-card-bg); color: var(--color-text-muted);
      transition: all 0.15s; white-space: nowrap;
    }
    .mg-chip.active {
      background: var(--color-primary); color: #fff; border-color: var(--color-primary);
    }

    /* Exercise list */
    .ex-grid {
      display: flex; flex-direction: column; gap: 6px;
      max-height: calc(100vh - 280px); overflow-y: auto; padding: 10px;
    }
    .ex-card {
      border: 1px solid var(--color-border); border-radius: var(--radius-sm);
      transition: border-color 0.15s, background 0.15s; cursor: pointer;
      background: var(--color-card-bg); overflow: hidden;
    }
    .ex-card:hover { border-color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 3%, transparent); }
    .ex-card.active { border-color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 6%, transparent); }
    .ex-card-row {
      display: flex; align-items: center; gap: 12px; padding: 8px 10px;
    }
    .ex-card-img {
      flex-shrink: 0; width: 48px; height: 48px; border-radius: 6px; overflow: hidden;
      background: #fff; border: 1px solid var(--color-border);
      display: flex; align-items: center; justify-content: center;
    }
    .ex-card-img img { width: 100%; height: 100%; object-fit: contain; }
    .ex-card-img-av {
      font-size: 1.2rem; font-weight: 900;
      color: var(--color-primary); opacity: 0.35;
    }
    .ex-card-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
    .ex-card-name {
      font-size: 0.86rem; font-weight: 700; color: var(--color-text); line-height: 1.2;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .ex-card-muscle {
      font-size: 0.65rem; font-weight: 600;
      color: var(--color-primary);
      background: color-mix(in srgb, var(--color-primary) 10%, transparent);
      border-radius: 20px; padding: 2px 8px;
      display: inline-block; align-self: flex-start;
    }
    .ex-card-add {
      flex-shrink: 0; box-sizing: border-box; margin: 0; padding: 0;
      width: 28px; height: 28px; min-width: 28px; min-height: 28px; border-radius: 50%;
      background: var(--color-primary); color: #fff;
      border: none; font-size: 1.1rem; font-weight: 700; line-height: 1;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: transform 0.15s, background 0.15s;
    }
    .ex-card-add:hover { transform: scale(1.1); }
    .ex-card.active .ex-card-add { background: #16a34a; }
    .ex-grid-empty {
      padding: 28px; text-align: center;
      color: var(--color-text-muted); font-size: 0.82rem;
    }

    /* Inline params (inside card) */
    .ex-card-params {
      display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;
      padding: 8px 10px 10px; border-top: 1px solid var(--color-border);
    }
    .ex-param-group label { font-size: 0.6rem; color: var(--color-text-muted); font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 2px; }
    .ex-param-group input {
      width: 100%; box-sizing: border-box; padding: 5px 6px;
      border: 1px solid var(--color-border); border-radius: 4px;
      background: var(--color-card-bg); color: var(--color-text);
      font-size: 0.78rem; font-family: var(--font-family); outline: none;
    }
    .ex-param-group input:focus { border-color: var(--color-primary); }
    .ex-card-confirm {
      grid-column: 1/-1;
      display: flex; gap: 6px; margin-top: 4px;
    }
    .btn-confirm {
      flex: 1; padding: 6px; border-radius: 4px;
      background: var(--color-primary); color: #fff;
      border: none; font-size: 0.75rem; font-weight: 700; cursor: pointer;
      transition: opacity 0.15s;
    }
    .btn-confirm:hover { opacity: 0.85; }
    .btn-cancel {
      padding: 6px 10px; border-radius: 4px;
      background: var(--color-surface-hover); color: var(--color-text-muted);
      border: 1px solid var(--color-border); font-size: 0.75rem; cursor: pointer;
    }
    .ex-loading { font-size: 0.78rem; color: var(--color-text-muted); padding: 8px 0; }
    .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }

    /* Assign button */
    .assign-btn {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 12px; border-radius: var(--radius-sm);
      font-size: 0.75rem; font-weight: 700; cursor: pointer;
      border: 1.5px solid var(--color-primary);
      background: color-mix(in srgb, var(--color-primary) 10%, transparent);
      color: var(--color-primary);
      transition: background 0.15s;
      white-space: nowrap;
    }
    .assign-btn:hover { background: color-mix(in srgb, var(--color-primary) 18%, transparent); }
    .assign-count {
      background: var(--color-primary);
      color: #fff;
      border-radius: 20px;
      padding: 1px 6px;
      font-size: 0.65rem;
      font-weight: 700;
    }

    /* Assign modal */
    .assign-section { margin-bottom: 18px; }
    .assign-section-title {
      font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.06em; color: var(--color-text-muted); margin-bottom: 8px;
    }
    .user-pick-list {
      display: flex; flex-direction: column; gap: 4px;
      max-height: 280px; overflow-y: auto;
      border: 1px solid var(--color-border); border-radius: var(--radius-sm);
    }
    .user-pick-row {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px; cursor: pointer;
      border-bottom: 1px solid var(--color-border);
      transition: background 0.1s;
    }
    .user-pick-row:last-child { border-bottom: none; }
    .user-pick-row:hover { background: var(--color-surface-hover); }
    .user-pick-row.selected { background: color-mix(in srgb, var(--color-primary) 8%, transparent); }
    .user-check {
      width: 18px; height: 18px; border-radius: 4px; flex-shrink: 0;
      border: 2px solid var(--color-border);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.7rem; color: #fff;
      transition: background 0.15s, border-color 0.15s;
    }
    .user-check.on { background: var(--color-primary); border-color: var(--color-primary); }
    .user-avatar {
      width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
      background: color-mix(in srgb, var(--color-primary) 12%, transparent);
      color: var(--color-primary);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 800;
    }
    .user-info { flex: 1; min-width: 0; }
    .user-name { font-size: 0.85rem; font-weight: 600; color: var(--color-text); }
    .user-email { font-size: 0.72rem; color: var(--color-text-muted); }

    .assignee-list { display: flex; flex-direction: column; gap: 6px; }
    .assignee-row {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 12px;
      background: var(--color-surface-hover);
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
    }
    .assignee-avatar {
      width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
      background: color-mix(in srgb, var(--color-success) 12%, transparent);
      color: var(--color-success);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.7rem; font-weight: 800;
    }
    .assignee-info { flex: 1; min-width: 0; }
    .assignee-name { font-size: 0.82rem; font-weight: 600; color: var(--color-text); }
    .assignee-email { font-size: 0.68rem; color: var(--color-text-muted); }
    .remove-btn {
      background: none; border: none; cursor: pointer;
      color: var(--color-danger); font-size: 0.8rem; font-weight: 700;
      padding: 3px 8px; border-radius: 4px;
      opacity: 0.7; transition: opacity 0.15s;
    }
    .remove-btn:hover { opacity: 1; }
    .no-assignees { color: var(--color-text-muted); font-size: 0.82rem; padding: 12px 0; }
    .assign-search {
      width: 100%; box-sizing: border-box;
      background: var(--color-card-bg); border: 1px solid var(--color-border);
      border-radius: var(--radius-sm); padding: 8px 12px;
      font-size: 0.88rem; color: var(--color-text); outline: none;
      margin-bottom: 8px; transition: border-color 0.15s;
    }
    .assign-search:focus { border-color: var(--color-primary); }
    .divider { border: none; border-top: 1px solid var(--color-border); margin: 16px 0; }
  `],
  template: `
    <ui-page-header title="Treinos" subtitle="Treinos dos planos do sistema">
      <ui-button (click)="openCreate()">+ Novo Treino</ui-button>
    </ui-page-header>

    @if (successMsg()) {
      <div class="alert alert-success">{{ successMsg() }}</div>
    }
    @if (errorMsg()) {
      <div class="alert alert-error">{{ errorMsg() }}</div>
    }

    <ui-table-card>
      @if (loading()) {
        <div class="loading">Carregando...</div>
      } @else if (items().length === 0) {
        <div class="empty-state">Nenhum treino cadastrado.</div>
      } @else {
        <table class="ui-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Plano / Modalidade</th>
              <th>Dia</th>
              <th>Atribuições</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.id) {
              <tr (click)="openEdit(item)" style="cursor:pointer;">
                <td><strong>{{ item.name }}</strong></td>
                <td><ui-badge variant="primary">{{ item.workoutPlanName || getPlanName(item.workoutPlanId) }}</ui-badge></td>
                <td><ui-badge variant="warning">{{ getDayName(item.dayOfWeek) }}</ui-badge></td>
                <td>
                  <span class="assign-count">{{ assigneeCounts()[item.id] }} alunos</span>
                </td>
                <td (click)="$event.stopPropagation()">
                  <button class="assign-btn" (click)="openAssign(item)">
                    👤 Atribuir
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </ui-table-card>

    <!-- Edit/Create drawer -->
    @if (showModal()) {
      <ui-drawer [size]="editingId() ? 'full' : 'md'" (close)="closeModal()">
        <h2 class="drawer-title">{{ editingId() ? 'Editar Treino' : 'Novo Treino' }}</h2>
        <p class="drawer-sub">Preencha os dados do treino</p>

        @if (!editingId()) {
          <div class="form-group">
            <label>Nome *</label>
            <input type="text" [(ngModel)]="form.name" placeholder="Ex: Treino A - Peito e Tríceps" />
          </div>
          <div class="form-group">
            <label>Plano de Treino *</label>
            <select [(ngModel)]="form.workoutPlanId">
              <option [ngValue]="''" disabled>Selecione...</option>
              @for (plan of workoutPlans(); track plan.id) {
                <option [ngValue]="plan.id">{{ plan.name }}</option>
              }
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Dia da Semana *</label>
              <select [(ngModel)]="form.dayOfWeek">
                @for (day of days; track day.value) {
                  <option [ngValue]="day.value">{{ day.label }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label>Ordem</label>
              <input type="number" [(ngModel)]="form.orderIndex" min="0" />
            </div>
          </div>
          <div class="modal-actions">
            <ui-button variant="ghost" (click)="closeModal()">Cancelar</ui-button>
            <ui-button (click)="save()" [disabled]="saving()">{{ saving() ? 'Salvando...' : 'Salvar' }}</ui-button>
          </div>
        }

        @if (editingId()) {
          <div class="editor-layout">
            <!-- Left: workout data + added exercises -->
            <div class="editor-col">
              <div class="form-group">
                <label>Nome *</label>
                <input type="text" [(ngModel)]="form.name" placeholder="Ex: Treino A - Peito e Tríceps" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Plano de Treino *</label>
                  <select [(ngModel)]="form.workoutPlanId">
                    <option [ngValue]="''" disabled>Selecione...</option>
                    @for (plan of workoutPlans(); track plan.id) {
                      <option [ngValue]="plan.id">{{ plan.name }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>Dia da Semana *</label>
                  <select [(ngModel)]="form.dayOfWeek">
                    @for (day of days; track day.value) {
                      <option [ngValue]="day.value">{{ day.label }}</option>
                    }
                  </select>
                </div>
              </div>
              <div class="form-group" style="max-width: 140px;">
                <label>Ordem</label>
                <input type="number" [(ngModel)]="form.orderIndex" min="0" />
              </div>

              <div class="modal-actions">
                <ui-button variant="danger" (click)="confirmDelete()" style="margin-right: auto;">Excluir</ui-button>
                <ui-button variant="ghost" (click)="closeModal()">Cancelar</ui-button>
                <ui-button (click)="save()" [disabled]="saving()">{{ saving() ? 'Salvando...' : 'Salvar' }}</ui-button>
              </div>

              <hr class="section-divider" />
              <p class="section-title">Exercícios do Treino ({{ workoutExercises().length }})</p>

              @if (loadingExercises()) {
                <p class="ex-loading">Carregando exercícios...</p>
              } @else if (workoutExercises().length === 0) {
                <div class="ex-empty">Nenhum exercício adicionado. Selecione exercícios ao lado.</div>
              } @else {
                <div class="ex-list">
                  @for (we of workoutExercises(); track we.id; let i = $index) {
                    <div class="ex-row">
                      <div class="ex-order">{{ i + 1 }}</div>
                      <div class="ex-thumb">
                        @if (we.imageUrl) {
                          <img [src]="we.imageUrl" [alt]="we.exerciseName" />
                        } @else {
                          <span class="ex-thumb-av">{{ we.exerciseName?.charAt(0) }}</span>
                        }
                      </div>
                      <div class="ex-info">
                        <div class="ex-name">{{ we.exerciseName }}</div>
                        <div class="ex-meta">
                          {{ we.sets }}x{{ we.reps }}
                          @if (we.restSeconds) { · {{ we.restSeconds }}s }
                          @if (we.muscleGroupName) { · {{ we.muscleGroupName }} }
                        </div>
                      </div>
                      <button class="ex-remove" (click)="removeExercise(we)" title="Remover">✕</button>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Right: exercise picker -->
            <div class="editor-col">
              <p class="section-title">Adicionar Exercício</p>
              <div class="ex-picker">
                <div class="ex-picker-top">
                  <input class="ex-search" type="text" placeholder="Buscar exercício..."
                    [ngModel]="exSearch()" (ngModelChange)="exSearch.set($event)" />
                </div>
                <div class="muscle-chips">
                  <button class="mg-chip" [class.active]="!filterMuscle()"
                    (click)="filterMuscle.set('')">Todos</button>
                  @for (mg of muscleGroups(); track mg.id) {
                    <button class="mg-chip" [class.active]="filterMuscle() === mg.id"
                      (click)="filterMuscle.set(mg.id)">{{ mg.name }}</button>
                  }
                </div>
                <div class="ex-grid">
                  @if (filteredAllExercises().length === 0) {
                    <div class="ex-grid-empty">
                      {{ allExercises().length === 0 ? 'Carregando...' : 'Nenhum exercício encontrado.' }}
                    </div>
                  }
                  @for (ex of filteredAllExercises(); track ex.id) {
                    <div class="ex-card" [class.active]="addExForm.exerciseId === ex.id"
                      (click)="selectExercise(ex)">
                      <div class="ex-card-row">
                        <div class="ex-card-img">
                          @if (ex.imageUrl) {
                            <img [src]="ex.imageUrl" [alt]="ex.name" />
                          } @else {
                            <span class="ex-card-img-av">{{ ex.name.charAt(0) }}</span>
                          }
                        </div>
                        <div class="ex-card-info">
                          <div class="ex-card-name">{{ ex.name }}</div>
                          @if (ex.muscleGroupName) {
                            <span class="ex-card-muscle">{{ ex.muscleGroupName }}</span>
                          }
                        </div>
                        <button class="ex-card-add"
                          (click)="$event.stopPropagation(); selectExercise(ex)">
                          {{ addExForm.exerciseId === ex.id ? '✓' : '+' }}
                        </button>
                      </div>
                      @if (addExForm.exerciseId === ex.id) {
                        <div class="ex-card-params" (click)="$event.stopPropagation()">
                          <div class="ex-param-group">
                            <label>Séries</label>
                            <input type="number" min="1" [(ngModel)]="addExForm.sets" />
                          </div>
                          <div class="ex-param-group">
                            <label>Reps</label>
                            <input type="text" placeholder="8-12" [(ngModel)]="addExForm.reps" />
                          </div>
                          <div class="ex-param-group">
                            <label>Descanso s</label>
                            <input type="number" min="0" [(ngModel)]="addExForm.restSeconds" />
                          </div>
                          <div class="ex-card-confirm">
                            <button class="btn-confirm" (click)="addExercise()" [disabled]="addingExercise()">
                              {{ addingExercise() ? '...' : 'Adicionar' }}
                            </button>
                            <button class="btn-cancel" (click)="addExForm.exerciseId = ''">✕</button>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        }
      </ui-drawer>
    }

    <!-- Assign drawer -->
    @if (showAssign()) {
      <ui-drawer size="md" (close)="closeAssign()">
        <h2 class="drawer-title">Atribuir Treino</h2>
        <p class="drawer-sub">{{ assigningWorkout()?.name }} · {{ getDayName(assigningWorkout()?.dayOfWeek ?? 0) }}</p>

        <!-- Already assigned -->
        <div class="assign-section">
          <div class="assign-section-title">Alunos com este treino ({{ assignees().length }})</div>
          @if (assignees().length === 0) {
            <p class="no-assignees">Nenhum aluno atribuído ainda.</p>
          } @else {
            <div class="assignee-list">
              @for (a of assignees(); track a.assignmentId) {
                <div class="assignee-row">
                  <div class="assignee-avatar">{{ a.userName.charAt(0).toUpperCase() }}</div>
                  <div class="assignee-info">
                    <div class="assignee-name">{{ a.userName }}</div>
                    <div class="assignee-email">{{ a.userEmail }}</div>
                  </div>
                  <button class="remove-btn" (click)="removeAssignee(a)">✕ Remover</button>
                </div>
              }
            </div>
          }
        </div>

        <hr class="divider" />

        <!-- Add users -->
        <div class="assign-section">
          <div class="assign-section-title">Adicionar alunos</div>
          <input class="assign-search" type="text" placeholder="Buscar por nome ou email..."
            [(ngModel)]="userSearch" />
          <div class="user-pick-list">
            @for (user of filteredUsers(); track user.id) {
              <div class="user-pick-row" [class.selected]="isSelected(user.id)" (click)="toggleUser(user.id)">
                <div class="user-check" [class.on]="isSelected(user.id)">{{ isSelected(user.id) ? '✓' : '' }}</div>
                <div class="user-avatar">{{ user.name.charAt(0).toUpperCase() }}</div>
                <div class="user-info">
                  <div class="user-name">{{ user.name }}</div>
                  <div class="user-email">{{ user.email }}</div>
                </div>
              </div>
            }
          </div>
        </div>

        <div class="modal-actions">
          <ui-button variant="ghost" (click)="closeAssign()">Fechar</ui-button>
          <ui-button (click)="saveAssign()" [disabled]="selectedUserIds().size === 0 || assignSaving()">
            {{ assignSaving() ? 'Salvando...' : 'Atribuir ' + selectedUserIds().size + ' aluno(s)' }}
          </ui-button>
        </div>
      </ui-drawer>
    }
  `
})
export class WorkoutsComponent implements OnInit {
  private workoutService = inject(WorkoutService);
  private workoutPlanService = inject(WorkoutPlanService);
  private workoutExerciseService = inject(WorkoutExerciseService);
  private exerciseService = inject(ExerciseService);
  private muscleGroupService = inject(MuscleGroupService);
  private userService = inject(UserService);
  private assignService = inject(WorkoutAssignmentService);

  items = signal<Workout[]>([]);
  workoutPlans = signal<WorkoutPlan[]>([]);
  allUsers = signal<AppUser[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editingId = signal<string | null>(null);
  saving = signal(false);
  successMsg = signal('');
  errorMsg = signal('');
  assigneeCounts = signal<Record<string, number>>({});

  // Assign drawer
  showAssign = signal(false);
  assigningWorkout = signal<Workout | null>(null);
  assignees = signal<WorkoutAssignee[]>([]);
  selectedUserIds = signal<Set<string>>(new Set());
  userSearch = '';
  assignSaving = signal(false);

  days = DAY_NAMES_FULL.map((label, i) => ({ value: i, label }));
  form = { name: '', workoutPlanId: '', dayOfWeek: 0, orderIndex: 0 };

  // Exercises
  workoutExercises = signal<WorkoutExercise[]>([]);
  allExercises = signal<Exercise[]>([]);
  muscleGroups = signal<MuscleGroup[]>([]);
  loadingExercises = signal(false);
  addingExercise = signal(false);
  exSearch = signal('');
  filterMuscle = signal('');
  addExForm = { exerciseId: '', exerciseName: '', sets: 3, reps: '8-12', restSeconds: 60 };

  filteredAllExercises = computed(() => {
    const q = this.exSearch().toLowerCase();
    const mg = this.filterMuscle();
    const already = new Set(this.workoutExercises().map(we => we.exerciseId));
    return this.allExercises()
      .filter(e => !already.has(e.id))
      .filter(e => !mg || e.muscleGroupId === mg)
      .filter(e => !q || e.name.toLowerCase().includes(q) || (e.muscleGroupName ?? '').toLowerCase().includes(q))
      .slice(0, 40);
  });

  filteredUsers = () => {
    const q = this.userSearch.toLowerCase();
    const assignedIds = new Set(this.assignees().map(a => a.userId));
    return this.allUsers()
      .filter(u => u.role === 'user')
      .filter(u => !assignedIds.has(u.id))
      .filter(u => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  };

  ngOnInit() {
    forkJoin({
      plans: this.workoutPlanService.getAll(true),
      users: this.userService.getAll(),
    }).subscribe(({ plans, users }) => {
      this.workoutPlans.set(plans);
      this.allUsers.set(users);
      this.load();
    });
  }

  load() {
    this.loading.set(true);
    this.workoutService.getAll().subscribe({
      next: (data) => {
        const systemPlanIds = new Set(this.workoutPlans().map(p => p.id));
        this.items.set(data.filter(w => systemPlanIds.has(w.workoutPlanId)));
        this.loading.set(false);
        this.loadAssigneeCounts(data);
      },
      error: () => { this.errorMsg.set('Erro ao carregar treinos.'); this.loading.set(false); }
    });
  }

  loadAssigneeCounts(workouts: Workout[]) {
    const counts: Record<string, number> = {};
    workouts.forEach(w => counts[w.id] = 0);
    // Load assignees for each workout in parallel (only system plan workouts)
    const systemPlanIds = new Set(this.workoutPlans().map(p => p.id));
    const systemWorkouts = workouts.filter(w => systemPlanIds.has(w.workoutPlanId));
    forkJoin(
      systemWorkouts.reduce((acc, w) => {
        acc[w.id] = this.assignService.getAssignees(w.id);
        return acc;
      }, {} as Record<string, any>)
    ).subscribe({
      next: (results) => {
        const updated = { ...counts };
        Object.entries(results).forEach(([id, list]: [string, any]) => {
          updated[id] = (list as any[]).length;
        });
        this.assigneeCounts.set(updated);
      },
      error: () => {}
    });
  }

  getDayName(day: number): string { return DAY_NAMES[day] ?? String(day); }
  getPlanName(id: string): string { return this.workoutPlans().find(p => p.id === id)?.name || id; }

  openCreate() {
    this.editingId.set(null);
    this.form = { name: '', workoutPlanId: '', dayOfWeek: 0, orderIndex: 0 };
    this.showModal.set(true);
  }

  openEdit(item: Workout) {
    this.editingId.set(item.id);
    this.form = { name: item.name, workoutPlanId: item.workoutPlanId, dayOfWeek: item.dayOfWeek, orderIndex: item.orderIndex };
    this.workoutExercises.set([]);
    this.exSearch.set('');
    this.filterMuscle.set('');
    this.addExForm = { exerciseId: '', exerciseName: '', sets: 3, reps: '8-12', restSeconds: 60 };
    this.showModal.set(true);
    this.loadWorkoutExercises(item.id);
    if (this.allExercises().length === 0) {
      this.exerciseService.getAll().subscribe({ next: (list) => this.allExercises.set(list), error: () => {} });
    }
    if (this.muscleGroups().length === 0) {
      this.muscleGroupService.getAll().subscribe({ next: (list) => this.muscleGroups.set(list), error: () => {} });
    }
  }

  loadWorkoutExercises(workoutId: string) {
    this.loadingExercises.set(true);
    this.workoutExerciseService.getByWorkout(workoutId).subscribe({
      next: (list) => { this.workoutExercises.set(list); this.loadingExercises.set(false); },
      error: () => this.loadingExercises.set(false)
    });
  }

  selectExercise(ex: Exercise) {
    if (this.addExForm.exerciseId === ex.id) {
      this.addExForm.exerciseId = '';
      return;
    }
    this.addExForm.exerciseId = ex.id;
    this.addExForm.exerciseName = ex.name;
  }

  addExercise() {
    const workoutId = this.editingId();
    if (!workoutId || !this.addExForm.exerciseId) return;
    this.addingExercise.set(true);
    this.workoutExerciseService.create({
      workoutId,
      exerciseId: this.addExForm.exerciseId,
      sets: this.addExForm.sets,
      reps: this.addExForm.reps,
      restSeconds: this.addExForm.restSeconds,
      orderIndex: this.workoutExercises().length,
    }).subscribe({
      next: () => {
        this.addingExercise.set(false);
        this.addExForm = { exerciseId: '', exerciseName: '', sets: 3, reps: '8-12', restSeconds: 60 };
        this.exSearch.set('');
        this.loadWorkoutExercises(workoutId);
      },
      error: () => this.addingExercise.set(false)
    });
  }

  removeExercise(we: WorkoutExercise) {
    const workoutId = this.editingId();
    if (!workoutId) return;
    this.workoutExerciseService.delete(we.id).subscribe({
      next: () => this.loadWorkoutExercises(workoutId),
      error: () => {}
    });
  }

  closeModal() { this.showModal.set(false); }

  save() {
    if (!this.form.name.trim()) { this.errorMsg.set('Nome é obrigatório.'); return; }
    if (!this.form.workoutPlanId) { this.errorMsg.set('Selecione um plano de treino.'); return; }
    this.saving.set(true);
    this.errorMsg.set('');
    const id = this.editingId();
    const obs = id ? this.workoutService.update(id, this.form) : this.workoutService.create(this.form);
    obs.subscribe({
      next: () => {
        this.saving.set(false); this.showModal.set(false);
        this.successMsg.set(id ? 'Treino atualizado!' : 'Treino criado!');
        setTimeout(() => this.successMsg.set(''), 3000);
        this.load();
      },
      error: () => { this.saving.set(false); this.errorMsg.set('Erro ao salvar.'); }
    });
  }

  confirmDelete() {
    const id = this.editingId();
    if (!id || !confirm(`Excluir "${this.form.name}"?`)) return;
    this.workoutService.delete(id).subscribe({
      next: () => {
        this.showModal.set(false);
        this.successMsg.set('Treino excluído!');
        setTimeout(() => this.successMsg.set(''), 3000);
        this.load();
      },
      error: () => this.errorMsg.set('Erro ao excluir.')
    });
  }

  // --- Assign ---
  openAssign(workout: Workout) {
    this.assigningWorkout.set(workout);
    this.selectedUserIds.set(new Set());
    this.userSearch = '';
    this.showAssign.set(true);
    this.assignService.getAssignees(workout.id).subscribe({
      next: (list) => this.assignees.set(list),
      error: () => this.assignees.set([])
    });
  }

  closeAssign() { this.showAssign.set(false); }

  isSelected(userId: string): boolean { return this.selectedUserIds().has(userId); }

  toggleUser(userId: string) {
    this.selectedUserIds.update(set => {
      const next = new Set(set);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  }

  saveAssign() {
    const workout = this.assigningWorkout();
    if (!workout || this.selectedUserIds().size === 0) return;
    this.assignSaving.set(true);
    this.assignService.assign(workout.id, Array.from(this.selectedUserIds())).subscribe({
      next: () => {
        this.assignSaving.set(false);
        this.selectedUserIds.set(new Set());
        this.assignService.getAssignees(workout.id).subscribe(list => {
          this.assignees.set(list);
          this.assigneeCounts.update(c => ({ ...c, [workout.id]: list.length }));
        });
        this.successMsg.set('Treino atribuído com sucesso!');
        setTimeout(() => this.successMsg.set(''), 3000);
      },
      error: () => { this.assignSaving.set(false); this.errorMsg.set('Erro ao atribuir.'); }
    });
  }

  removeAssignee(assignee: WorkoutAssignee) {
    const workout = this.assigningWorkout();
    if (!workout) return;
    this.assignService.unassign(workout.id, assignee.userId).subscribe({
      next: () => {
        this.assignees.update(list => list.filter(a => a.assignmentId !== assignee.assignmentId));
        this.assigneeCounts.update(c => ({ ...c, [workout.id]: (c[workout.id] ?? 1) - 1 }));
      }
    });
  }
}
