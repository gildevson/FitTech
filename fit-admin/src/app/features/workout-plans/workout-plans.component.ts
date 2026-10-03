import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkoutPlanService } from '../../core/services/workout-plan.service';
import { WorkoutPlan } from '../../core/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { TableCardComponent } from '../../shared/components/table-card/table-card.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { DrawerComponent } from '../../shared/components/drawer/drawer.component';

@Component({
  selector: 'app-workout-plans',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, PageHeaderComponent, ButtonComponent, TableCardComponent, PaginationComponent, LoadingOverlayComponent, DrawerComponent],
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
    .form-group input, .form-group textarea {
      width: 100%; box-sizing: border-box;
      background: var(--color-card-bg); border: 1px solid var(--color-border); border-radius: var(--radius-sm);
      color: var(--color-text); padding: 10px 14px; font-size: 0.92rem; font-family: var(--font-family);
      transition: border-color 0.15s;
    }
    .form-group input:focus, .form-group textarea:focus { outline: none; border-color: var(--color-primary); }
    .form-group textarea { resize: vertical; min-height: 80px; }
    .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
  `],
  template: `
    <ui-page-header title="Planos de Treino">
      <ui-button (click)="openCreate()">+ Novo Plano</ui-button>
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
        <div class="empty-state">Nenhum plano de treino cadastrado.</div>
      } @else {
        <ui-loading-overlay [loading]="pageLoading()">
          <table class="ui-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Criado em</th>
              </tr>
            </thead>
            <tbody>
              @for (item of pagedItems(); track item.id) {
                <tr class="clickable-row" (click)="openEdit(item)">
                  <td>{{ item.name }}</td>
                  <td>{{ item.description || '—' }}</td>
                  <td>{{ item.createdAt | date:'dd/MM/yyyy' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </ui-loading-overlay>
        <ui-pagination
          [total]="items().length"
          [page]="page()"
          [pageSize]="pageSize"
          [loading]="pageLoading()"
          (pageChange)="onPageChange($event)"
        />
      }
    </ui-table-card>

    @if (showModal()) {
      <ui-drawer size="md" (close)="closeModal()">
        <h2 class="drawer-title">{{ editingId() ? 'Editar Plano' : 'Novo Plano de Treino' }}</h2>
        <div class="form-group">
          <label>Nome *</label>
          <input type="text" [(ngModel)]="form.name" placeholder="Ex: Plano Hipertrofia A..." />
        </div>
        <div class="form-group">
          <label>Descrição</label>
          <textarea [(ngModel)]="form.description" placeholder="Descrição opcional..."></textarea>
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
export class WorkoutPlansComponent implements OnInit {
  private service = inject(WorkoutPlanService);

  items = signal<WorkoutPlan[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editingId = signal<string | null>(null);
  saving = signal(false);
  successMsg = signal('');
  errorMsg = signal('');

  form = { name: '', description: '' };

  page = signal(1);
  pageSize = 10;
  pageLoading = signal(false);
  pagedItems = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.items().slice(start, start + this.pageSize);
  });

  onPageChange(newPage: number) {
    this.pageLoading.set(true);
    setTimeout(() => {
      this.page.set(newPage);
      this.pageLoading.set(false);
    }, 400);
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: (data) => { this.items.set(data); this.page.set(1); this.loading.set(false); },
      error: () => { this.errorMsg.set('Erro ao carregar planos.'); this.loading.set(false); }
    });
  }

  openCreate() {
    this.editingId.set(null);
    this.form = { name: '', description: '' };
    this.showModal.set(true);
  }

  openEdit(item: WorkoutPlan) {
    this.editingId.set(item.id);
    this.form = { name: item.name, description: item.description || '' };
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  save() {
    if (!this.form.name.trim()) { this.errorMsg.set('Nome é obrigatório.'); return; }
    this.saving.set(true);
    this.errorMsg.set('');
    const id = this.editingId();
    const obs = id ? this.service.update(id, this.form) : this.service.create(this.form);
    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.showModal.set(false);
        this.successMsg.set(id ? 'Plano atualizado!' : 'Plano criado!');
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
    this.service.delete(id).subscribe({
      next: () => {
        this.showModal.set(false);
        this.successMsg.set('Plano excluído!');
        setTimeout(() => this.successMsg.set(''), 3000);
        this.load();
      },
      error: () => this.errorMsg.set('Erro ao excluir.')
    });
  }
}
