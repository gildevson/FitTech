import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkoutService } from '../../core/services/workout.service';
import { WorkoutPlanService } from '../../core/services/workout-plan.service';
import { Workout, WorkoutPlan } from '../../core/models';

const DAY_NAMES = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

@Component({
  selector: 'app-workouts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
    .page-header h1 { font-size: 1.8rem; color: #fff; margin: 0; }
    .btn-primary {
      background: #e94560; color: #fff; border: none;
      padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: background 0.2s;
    }
    .btn-primary:hover { background: #c73652; }
    .btn-danger {
      background: transparent; color: #e94560; border: 1px solid #e94560;
      padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.82rem; transition: all 0.2s;
    }
    .btn-danger:hover { background: rgba(233,69,96,0.15); }
    .btn-edit {
      background: transparent; color: #7090e0; border: 1px solid #7090e0;
      padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.82rem; margin-right: 8px; transition: all 0.2s;
    }
    .btn-edit:hover { background: rgba(112,144,224,0.15); }
    .table-card { background: #16213e; border: 1px solid #0f3460; border-radius: 12px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    thead { background: #0f3460; }
    th { padding: 14px 16px; text-align: left; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.5px; color: #8090c0; }
    td { padding: 14px 16px; color: #d0d0e8; font-size: 0.92rem; border-top: 1px solid rgba(255,255,255,0.05); }
    tr:hover td { background: rgba(255,255,255,0.02); }
    .empty-state { text-align: center; padding: 40px; color: #6060a0; }
    .loading { text-align: center; padding: 40px; color: #6060a0; }
    .alert { padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 0.9rem; }
    .alert-success { background: rgba(46,213,115,0.1); border: 1px solid rgba(46,213,115,0.3); color: #2ed573; }
    .alert-error { background: rgba(233,69,96,0.1); border: 1px solid rgba(233,69,96,0.3); color: #e94560; }
    .badge { background: #0f3460; color: #8090c0; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; }
    .badge-day { background: rgba(233,69,96,0.15); color: #e94560; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; }
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.7);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal {
      background: #16213e; border: 1px solid #0f3460; border-radius: 12px;
      padding: 32px; width: 500px; max-width: 95vw;
    }
    .modal h2 { margin: 0 0 24px 0; color: #fff; font-size: 1.3rem; }
    .form-group { margin-bottom: 18px; }
    .form-group label { display: block; margin-bottom: 6px; color: #8090c0; font-size: 0.85rem; }
    .form-group input, .form-group select {
      width: 100%; box-sizing: border-box;
      background: #1a1a2e; border: 1px solid #0f3460; border-radius: 8px;
      color: #e0e0e0; padding: 10px 14px; font-size: 0.92rem; transition: border-color 0.2s;
    }
    .form-group input:focus, .form-group select:focus { outline: none; border-color: #e94560; }
    .form-group select option { background: #1a1a2e; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
    .btn-cancel {
      background: transparent; color: #8090c0; border: 1px solid #0f3460;
      padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 0.9rem;
    }
    .btn-cancel:hover { border-color: #8090c0; }
  `],
  template: `
    <div class="page-header">
      <h1>Treinos</h1>
      <button class="btn-primary" (click)="openCreate()">+ Novo Treino</button>
    </div>

    @if (successMsg()) {
      <div class="alert alert-success">{{ successMsg() }}</div>
    }
    @if (errorMsg()) {
      <div class="alert alert-error">{{ errorMsg() }}</div>
    }

    <div class="table-card">
      @if (loading()) {
        <div class="loading">Carregando...</div>
      } @else if (items().length === 0) {
        <div class="empty-state">Nenhum treino cadastrado.</div>
      } @else {
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Nome</th>
              <th>Plano</th>
              <th>Dia da Semana</th>
              <th>Ordem</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.id) {
              <tr>
                <td>{{ item.id }}</td>
                <td>{{ item.name }}</td>
                <td><span class="badge">{{ item.workoutPlanName || getPlanName(item.workoutPlanId) }}</span></td>
                <td><span class="badge-day">{{ getDayName(item.dayOfWeek) }}</span></td>
                <td>{{ item.orderIndex }}</td>
                <td>
                  <button class="btn-edit" (click)="openEdit(item)">Editar</button>
                  <button class="btn-danger" (click)="confirmDelete(item)">Excluir</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>

    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2>{{ editingId() ? 'Editar Treino' : 'Novo Treino' }}</h2>
          <div class="form-group">
            <label>Nome *</label>
            <input type="text" [(ngModel)]="form.name" placeholder="Ex: Treino A - Peito e Tríceps..." />
          </div>
          <div class="form-group">
            <label>Plano de Treino *</label>
            <select [(ngModel)]="form.workoutPlanId">
              <option [ngValue]="0" disabled>Selecione...</option>
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
            <button class="btn-cancel" (click)="closeModal()">Cancelar</button>
            <button class="btn-primary" (click)="save()" [disabled]="saving()">
              {{ saving() ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </div>
      </div>
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
  editingId = signal<number | null>(null);
  saving = signal(false);
  successMsg = signal('');
  errorMsg = signal('');

  days = DAY_NAMES.map((label, i) => ({ value: i, label }));

  form = { name: '', workoutPlanId: 0, dayOfWeek: 0, orderIndex: 0 };

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

  getPlanName(id: number): string {
    return this.workoutPlans().find(p => p.id === id)?.name || String(id);
  }

  openCreate() {
    this.editingId.set(null);
    this.form = { name: '', workoutPlanId: 0, dayOfWeek: 0, orderIndex: 0 };
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

  confirmDelete(item: Workout) {
    if (!confirm(`Excluir "${item.name}"?`)) return;
    this.workoutService.delete(item.id).subscribe({
      next: () => {
        this.successMsg.set('Treino excluído!');
        setTimeout(() => this.successMsg.set(''), 3000);
        this.load();
      },
      error: () => this.errorMsg.set('Erro ao excluir.')
    });
  }
}
