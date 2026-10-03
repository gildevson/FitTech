import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkoutService } from '../../core/services/workout.service';
import { WorkoutPlanService } from '../../core/services/workout-plan.service';
import { Workout, WorkoutPlan } from '../../core/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { TableCardComponent } from '../../shared/components/table-card/table-card.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { DrawerComponent } from '../../shared/components/drawer/drawer.component';

const DAY_NAMES = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

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
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: var(--color-surface-hover); }
    .drawer-title { margin: 0 0 24px 0; color: var(--color-text); font-size: 1.25rem; }
    .form-group { margin-bottom: 18px; }
    .form-group label { display: block; margin-bottom: 6px; color: var(--color-text-muted); font-size: 0.85rem; font-weight: 500; }
    .form-group input, .form-group select {
      width: 100%; box-sizing: border-box;
      background: var(--color-card-bg); border: 1px solid var(--color-border); border-radius: var(--radius-sm);
      color: var(--color-text); padding: 10px 14px; font-size: 0.92rem; font-family: var(--font-family);
      transition: border-color 0.15s;
    }
    .form-group input:focus, .form-group select:focus { outline: none; border-color: var(--color-primary); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
  `],
  template: `
    <ui-page-header title="Treinos">
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
              <th>Plano</th>
              <th>Dia da Semana</th>
              <th>Ordem</th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.id) {
              <tr class="clickable-row" (click)="openEdit(item)">
                <td>{{ item.name }}</td>
                <td><ui-badge variant="primary">{{ item.workoutPlanName || getPlanName(item.workoutPlanId) }}</ui-badge></td>
                <td><ui-badge variant="warning">{{ getDayName(item.dayOfWeek) }}</ui-badge></td>
                <td>{{ item.orderIndex }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </ui-table-card>

    @if (showModal()) {
      <ui-drawer size="md" (close)="closeModal()">
        <h2 class="drawer-title">{{ editingId() ? 'Editar Treino' : 'Novo Treino' }}</h2>
        <div class="form-group">
          <label>Nome *</label>
          <input type="text" [(ngModel)]="form.name" placeholder="Ex: Treino A - Peito e Tríceps..." />
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
            <label>Índice de Ordem</label>
            <input type="number" [(ngModel)]="form.orderIndex" min="0" />
          </div>
        </div>
        <div class="modal-actions">
          @if (editingId()) {
            <ui-button variant="danger" (click)="confirmDelete()" style="margin-right: auto;">Excluir</ui-button>
          }
          <ui-button variant="ghost" (click)="closeModal()">Cancelar</ui-button>
          <ui-button (click)="save()" [disabled]="saving()">
            {{ saving() ? 'Salvando...' : 'Salvar' }}
          </ui-button>
        </div>
      </ui-drawer>
    }
  `
})
export class WorkoutsComponent implements OnInit {
  private workoutService = inject(WorkoutService);
  private workoutPlanService = inject(WorkoutPlanService);

  items = signal<Workout[]>([]);
  workoutPlans = signal<WorkoutPlan[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editingId = signal<string | null>(null);
  saving = signal(false);
  successMsg = signal('');
  errorMsg = signal('');

  days = DAY_NAMES.map((label, i) => ({ value: i, label }));

  form = { name: '', workoutPlanId: '', dayOfWeek: 0, orderIndex: 0 };

  ngOnInit() {
    this.workoutPlanService.getAll().subscribe({ next: (data) => this.workoutPlans.set(data) });
    this.load();
  }

  load() {
    this.loading.set(true);
    this.workoutService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.loading.set(false); },
      error: () => { this.errorMsg.set('Erro ao carregar treinos.'); this.loading.set(false); }
    });
  }

  getDayName(day: number): string {
    return DAY_NAMES[day] ?? String(day);
  }

  getPlanName(id: string): string {
    return this.workoutPlans().find(p => p.id === id)?.name || id;
  }

  openCreate() {
    this.editingId.set(null);
    this.form = { name: '', workoutPlanId: '', dayOfWeek: 0, orderIndex: 0 };
    this.showModal.set(true);
  }

  openEdit(item: Workout) {
    this.editingId.set(item.id);
    this.form = {
      name: item.name,
      workoutPlanId: item.workoutPlanId,
      dayOfWeek: item.dayOfWeek,
      orderIndex: item.orderIndex,
    };
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  save() {
    if (!this.form.name.trim()) { this.errorMsg.set('Nome é obrigatório.'); return; }
    if (!this.form.workoutPlanId) { this.errorMsg.set('Selecione um plano de treino.'); return; }
    this.saving.set(true);
    this.errorMsg.set('');

    const id = this.editingId();
    const obs = id
      ? this.workoutService.update(id, this.form)
      : this.workoutService.create(this.form);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.showModal.set(false);
        this.successMsg.set(id ? 'Treino atualizado!' : 'Treino criado!');
        setTimeout(() => this.successMsg.set(''), 3000);
        this.load();
      },
      error: () => { this.saving.set(false); this.errorMsg.set('Erro ao salvar.'); }
    });
  }

  confirmDelete() {
    const id = this.editingId();
    if (!id) return;
    if (!confirm(`Excluir "${this.form.name}"?`)) return;
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
}
