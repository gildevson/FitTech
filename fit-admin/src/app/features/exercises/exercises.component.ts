import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExerciseService } from '../../core/services/exercise.service';
import { MuscleGroupService } from '../../core/services/muscle-group.service';
import { Exercise, MuscleGroup } from '../../core/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { TableCardComponent } from '../../shared/components/table-card/table-card.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { FilterBarComponent } from '../../shared/components/filter-bar/filter-bar.component';
import { DrawerComponent } from '../../shared/components/drawer/drawer.component';

@Component({
  selector: 'app-exercises',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ButtonComponent, TableCardComponent, BadgeComponent, PaginationComponent, LoadingOverlayComponent, FilterBarComponent, DrawerComponent],
  styles: [`
    .empty-state { text-align: center; padding: 40px; color: var(--color-text-muted); }
    .loading { text-align: center; padding: 40px; color: var(--color-text-muted); }
    .alert { padding: 12px 16px; border-radius: var(--radius-sm); margin-bottom: 16px; font-size: 0.9rem; }
    .alert-success { background: var(--color-success-soft); border: 1px solid var(--color-success); color: var(--color-success); }
    .alert-error { background: var(--color-danger-soft); border: 1px solid var(--color-danger); color: var(--color-danger); }
    .img-thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 6px; border: 1px solid var(--color-border); }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: var(--color-surface-hover); }
    .drawer-title { margin: 0 0 24px 0; color: var(--color-text); font-size: 1.25rem; }
    .form-group { margin-bottom: 18px; }
    .form-group label { display: block; margin-bottom: 6px; color: var(--color-text-muted); font-size: 0.85rem; font-weight: 500; }
    .form-group input, .form-group textarea, .form-group select {
      width: 100%; box-sizing: border-box;
      background: var(--color-card-bg); border: 1px solid var(--color-border); border-radius: var(--radius-sm);
      color: var(--color-text); padding: 10px 14px; font-size: 0.92rem; font-family: var(--font-family);
      transition: border-color 0.15s;
    }
    .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
      outline: none; border-color: var(--color-primary);
    }
    .form-group textarea { resize: vertical; min-height: 80px; }
    .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
    .img-preview {
      width: 100%; aspect-ratio: 16 / 9; height: auto; display: flex; align-items: center; justify-content: center;
      background: var(--color-surface-hover); border: 1px dashed var(--color-border); border-radius: var(--radius-sm);
      overflow: hidden; margin-bottom: 18px;
    }
    .img-preview img { width: 100%; height: 100%; object-fit: contain; }
    .img-preview-empty { color: var(--color-text-muted); font-size: 0.85rem; text-align: center; padding: 16px; }
    .filter-actions { min-width: 0; }
    .filter-actions-row { display: flex; gap: 10px; }
    .filter-clear {
      background: transparent; border: none;
      color: var(--color-text-muted); padding: 10px 4px; font-size: 0.85rem; font-weight: 500; cursor: pointer;
      transition: color 0.15s;
    }
    .filter-clear:hover { color: var(--color-primary); text-decoration: underline; }
  `],
  template: `
    <ui-page-header title="Exercícios">
      <ui-button (click)="openCreate()">+ Novo Exercício</ui-button>
    </ui-page-header>

    @if (successMsg()) {
      <div class="alert alert-success">{{ successMsg() }}</div>
    }
    @if (errorMsg()) {
      <div class="alert alert-error">{{ errorMsg() }}</div>
    }

    <ui-filter-bar>
      <div class="ui-filter-field">
        <label>Nome</label>
        <input type="text" [(ngModel)]="nameDraft" (keyup.enter)="applyFilters()" placeholder="Buscar por nome..." />
      </div>
      <div class="ui-filter-field">
        <label>Grupo Muscular</label>
        <select [(ngModel)]="muscleGroupDraft">
          <option [ngValue]="''">Todos</option>
          @for (mg of muscleGroups(); track mg.id) {
            <option [ngValue]="mg.id">{{ mg.name }}</option>
          }
        </select>
      </div>
      <div class="ui-filter-field filter-actions">
        <label>&nbsp;</label>
        <div class="filter-actions-row">
          <ui-button (click)="applyFilters()" [disabled]="pageLoading()">
            {{ pageLoading() ? 'Buscando...' : 'Buscar' }}
          </ui-button>
          @if (nameFilter() || muscleGroupFilter()) {
            <button type="button" class="filter-clear" (click)="clearFilters()">Limpar filtros</button>
          }
        </div>
      </div>
    </ui-filter-bar>

    <ui-table-card>
      @if (loading()) {
        <div class="loading">Carregando...</div>
      } @else if (items().length === 0) {
        <div class="empty-state">Nenhum exercício cadastrado.</div>
      } @else if (filteredItems().length === 0) {
        <div class="empty-state">Nenhum exercício encontrado para o filtro aplicado.</div>
      } @else {
        <ui-loading-overlay [loading]="pageLoading()">
          <table class="ui-table">
            <thead>
              <tr>
                <th>Imagem</th>
                <th>Nome</th>
                <th>Grupo Muscular</th>
                <th>Descrição</th>
              </tr>
            </thead>
            <tbody>
              @for (item of pagedItems(); track item.id) {
                <tr class="clickable-row" (click)="openEdit(item)">
                  <td>
                    @if (item.imageUrl) {
                      <img [src]="item.imageUrl" class="img-thumb" [alt]="item.name" />
                    } @else {
                      <span style="color:var(--color-text-muted)">—</span>
                    }
                  </td>
                  <td>{{ item.name }}</td>
                  <td><ui-badge variant="primary">{{ item.muscleGroupName || getMuscleGroupName(item.muscleGroupId) }}</ui-badge></td>
                  <td>{{ item.description || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </ui-loading-overlay>
        <ui-pagination
          [total]="filteredItems().length"
          [page]="page()"
          [pageSize]="pageSize"
          [loading]="pageLoading()"
          (pageChange)="onPageChange($event)"
        />
      }
    </ui-table-card>

    @if (showModal()) {
      <ui-drawer size="lg" (close)="closeModal()">
        <h2 class="drawer-title">{{ editingId() ? 'Editar Exercício' : 'Novo Exercício' }}</h2>
        <div class="img-preview">
          @if (form.imageUrl) {
            <img [src]="form.imageUrl" [alt]="form.name" />
          } @else {
            <div class="img-preview-empty">Sem imagem de execução do exercício</div>
          }
        </div>
        <div class="form-group">
          <label>Nome *</label>
          <input type="text" [(ngModel)]="form.name" placeholder="Ex: Supino Reto..." />
        </div>
        <div class="form-group">
          <label>Grupo Muscular *</label>
          <select [(ngModel)]="form.muscleGroupId">
            <option [ngValue]="''" disabled>Selecione...</option>
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
          @if (editingId()) {
            <ui-button variant="danger" (click)="deleteFromModal()" style="margin-right: auto;">Excluir</ui-button>
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
export class ExercisesComponent implements OnInit {
  private exerciseService = inject(ExerciseService);
  private muscleGroupService = inject(MuscleGroupService);

  items = signal<Exercise[]>([]);
  muscleGroups = signal<MuscleGroup[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editingId = signal<string | null>(null);
  saving = signal(false);
  successMsg = signal('');
  errorMsg = signal('');

  form = { name: '', description: '', muscleGroupId: '', imageUrl: '' };

  nameDraft = '';
  muscleGroupDraft = '';
  nameFilter = signal('');
  muscleGroupFilter = signal('');

  filteredItems = computed(() => {
    const name = this.nameFilter().trim().toLowerCase();
    const muscleGroupId = this.muscleGroupFilter();
    return this.items().filter(item => {
      const matchesName = !name || item.name.toLowerCase().includes(name);
      const matchesMuscleGroup = !muscleGroupId || item.muscleGroupId === muscleGroupId;
      return matchesName && matchesMuscleGroup;
    });
  });

  page = signal(1);
  pageSize = 10;
  pageLoading = signal(false);
  pagedItems = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredItems().slice(start, start + this.pageSize);
  });

  applyFilters() {
    this.pageLoading.set(true);
    setTimeout(() => {
      this.nameFilter.set(this.nameDraft);
      this.muscleGroupFilter.set(this.muscleGroupDraft);
      this.page.set(1);
      this.pageLoading.set(false);
    }, 400);
  }

  clearFilters() {
    this.nameDraft = '';
    this.muscleGroupDraft = '';
    this.pageLoading.set(true);
    setTimeout(() => {
      this.nameFilter.set('');
      this.muscleGroupFilter.set('');
      this.page.set(1);
      this.pageLoading.set(false);
    }, 400);
  }

  onPageChange(newPage: number) {
    this.pageLoading.set(true);
    setTimeout(() => {
      this.page.set(newPage);
      this.pageLoading.set(false);
    }, 400);
  }

  ngOnInit() {
    this.muscleGroupService.getAll().subscribe({
      next: (data) => this.muscleGroups.set(data),
    });
    this.load();
  }

  load() {
    this.loading.set(true);
    this.exerciseService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.page.set(1); this.loading.set(false); },
      error: () => { this.errorMsg.set('Erro ao carregar exercícios.'); this.loading.set(false); }
    });
  }

  getMuscleGroupName(id: string): string {
    return this.muscleGroups().find(mg => mg.id === id)?.name || id;
  }

  openCreate() {
    this.editingId.set(null);
    this.form = { name: '', description: '', muscleGroupId: '', imageUrl: '' };
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

  deleteFromModal() {
    const id = this.editingId();
    if (!id) return;
    if (!confirm(`Excluir "${this.form.name}"?`)) return;
    this.saving.set(true);
    this.exerciseService.delete(id).subscribe({
      next: () => {
        this.saving.set(false);
        this.showModal.set(false);
        this.successMsg.set('Exercício excluído!');
        setTimeout(() => this.successMsg.set(''), 3000);
        this.load();
      },
      error: () => { this.saving.set(false); this.errorMsg.set('Erro ao excluir.'); }
    });
  }
}
