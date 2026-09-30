import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExerciseService } from '../../core/services/exercise.service';
import { MuscleGroupService } from '../../core/services/muscle-group.service';
import { Exercise, MuscleGroup } from '../../core/models';

@Component({
  selector: 'app-exercises',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .page-header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px;
    }
    .page-header h1 { font-size: 1.8rem; color: #fff; margin: 0; }
    .btn-primary {
      background: #e94560; color: #fff; border: none;
      padding: 10px 20px; border-radius: 8px; cursor: pointer;
      font-size: 0.9rem; font-weight: 600; transition: background 0.2s;
    }
    .btn-primary:hover { background: #c73652; }
    .btn-danger {
      background: transparent; color: #e94560; border: 1px solid #e94560;
      padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.82rem; transition: all 0.2s;
    }
    .btn-danger:hover { background: rgba(233,69,96,0.15); }
    .btn-edit {
      background: transparent; color: #7090e0; border: 1px solid #7090e0;
      padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.82rem;
      margin-right: 8px; transition: all 0.2s;
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
    .img-thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 6px; border: 1px solid #0f3460; }
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.7);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal {
      background: #16213e; border: 1px solid #0f3460; border-radius: 12px;
      padding: 32px; width: 500px; max-width: 95vw; max-height: 90vh; overflow-y: auto;
    }
    .modal h2 { margin: 0 0 24px 0; color: #fff; font-size: 1.3rem; }
    .form-group { margin-bottom: 18px; }
    .form-group label { display: block; margin-bottom: 6px; color: #8090c0; font-size: 0.85rem; }
    .form-group input, .form-group textarea, .form-group select {
      width: 100%; box-sizing: border-box;
      background: #1a1a2e; border: 1px solid #0f3460; border-radius: 8px;
      color: #e0e0e0; padding: 10px 14px; font-size: 0.92rem; transition: border-color 0.2s;
    }
    .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
      outline: none; border-color: #e94560;
    }
    .form-group select option { background: #1a1a2e; }
    .form-group textarea { resize: vertical; min-height: 80px; }
    .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
    .btn-cancel {
      background: transparent; color: #8090c0; border: 1px solid #0f3460;
      padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 0.9rem;
    }
    .btn-cancel:hover { border-color: #8090c0; }
  `],
  template: `
    <div class="page-header">
      <h1>Exercícios</h1>
      <button class="btn-primary" (click)="openCreate()">+ Novo Exercício</button>
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
        <div class="empty-state">Nenhum exercício cadastrado.</div>
      } @else {
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Imagem</th>
              <th>Nome</th>
              <th>Grupo Muscular</th>
              <th>Descrição</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.id) {
              <tr>
                <td>{{ item.id }}</td>
                <td>
                  @if (item.imageUrl) {
                    <img [src]="item.imageUrl" class="img-thumb" [alt]="item.name" />
                  } @else {
                    <span style="color:#555577">—</span>
                  }
                </td>
                <td>{{ item.name }}</td>
                <td><span class="badge">{{ item.muscleGroupName || getMuscleGroupName(item.muscleGroupId) }}</span></td>
                <td>{{ item.description || '—' }}</td>
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
          <h2>{{ editingId() ? 'Editar Exercício' : 'Novo Exercício' }}</h2>
          <div class="form-group">
            <label>Nome *</label>
            <input type="text" [(ngModel)]="form.name" placeholder="Ex: Supino Reto..." />
          </div>
          <div class="form-group">
            <label>Grupo Muscular *</label>
            <select [(ngModel)]="form.muscleGroupId">
              <option [ngValue]="0" disabled>Selecione...</option>
              @for (mg of muscleGroups(); track mg.id) {
                <option [ngValue]="mg.id">{{ mg.name }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label>Descrição</label>
            <textarea [(ngModel)]="form.description" placeholder="Descrição opcional..."></textarea>
          </div>
          <div class="form-group">
            <label>URL da Imagem</label>
            <input type="text" [(ngModel)]="form.imageUrl" placeholder="https://..." />
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
export class ExercisesComponent implements OnInit {
  private exerciseService = inject(ExerciseService);
  private muscleGroupService = inject(MuscleGroupService);

  items = signal<Exercise[]>([]);
  muscleGroups = signal<MuscleGroup[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editingId = signal<number | null>(null);
  saving = signal(false);
  successMsg = signal('');
  errorMsg = signal('');

  form = { name: '', description: '', muscleGroupId: 0, imageUrl: '' };

  ngOnInit() {
    this.muscleGroupService.getAll().subscribe({
      next: (data) => this.muscleGroups.set(data),
    });
    this.load();
  }

  load() {
    this.loading.set(true);
    this.exerciseService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.loading.set(false); },
      error: () => { this.errorMsg.set('Erro ao carregar exercícios.'); this.loading.set(false); }
    });
  }

  getMuscleGroupName(id: number): string {
    return this.muscleGroups().find(mg => mg.id === id)?.name || String(id);
  }

  openCreate() {
    this.editingId.set(null);
    this.form = { name: '', description: '', muscleGroupId: 0, imageUrl: '' };
    this.showModal.set(true);
  }

  openEdit(item: Exercise) {
    this.editingId.set(item.id);
    this.form = {
      name: item.name,
      description: item.description || '',
      muscleGroupId: item.muscleGroupId,
      imageUrl: item.imageUrl || '',
    };
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  save() {
    if (!this.form.name.trim()) { this.errorMsg.set('Nome é obrigatório.'); return; }
    if (!this.form.muscleGroupId) { this.errorMsg.set('Selecione um grupo muscular.'); return; }
    this.saving.set(true);
    this.errorMsg.set('');

    const id = this.editingId();
    const payload = {
      name: this.form.name,
      description: this.form.description || undefined,
      muscleGroupId: this.form.muscleGroupId,
      imageUrl: this.form.imageUrl || undefined,
    };
    const obs = id
      ? this.exerciseService.update(id, payload)
      : this.exerciseService.create(payload);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.showModal.set(false);
        this.successMsg.set(id ? 'Exercício atualizado!' : 'Exercício criado!');
        setTimeout(() => this.successMsg.set(''), 3000);
        this.load();
      },
      error: () => { this.saving.set(false); this.errorMsg.set('Erro ao salvar.'); }
    });
  }

  confirmDelete(item: Exercise) {
    if (!confirm(`Excluir "${item.name}"?`)) return;
    this.exerciseService.delete(item.id).subscribe({
      next: () => {
        this.successMsg.set('Exercício excluído!');
        setTimeout(() => this.successMsg.set(''), 3000);
        this.load();
      },
      error: () => this.errorMsg.set('Erro ao excluir.')
    });
  }
}
