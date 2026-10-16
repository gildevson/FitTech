import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { DietService } from '../../core/services/diet.service';
import { AppUser, Diet } from '../../core/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { forkJoin } from 'rxjs';

interface UserRow {
  user: AppUser;
  diets: Diet[];
  loading: boolean;
  expanded: boolean;
}

@Component({
  selector: 'app-user-diets',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, BadgeComponent, ButtonComponent],
  styles: [`
    .user-list { display: flex; flex-direction: column; gap: 10px; }

    /* ---- User card ---- */
    .user-card {
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: 0 1px 3px rgba(16,24,40,0.05);
      overflow: hidden;
      transition: box-shadow 0.2s;
    }
    .user-card:hover { box-shadow: 0 3px 10px rgba(16,24,40,0.08); }

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

    .diet-pill {
      font-size: 0.76rem; font-weight: 600;
      color: var(--color-primary);
      background: var(--color-primary-soft);
      border: 1px solid color-mix(in srgb, var(--color-primary) 28%, transparent);
      border-radius: 20px; padding: 3px 12px; white-space: nowrap;
    }

    .chevron {
      width: 18px; height: 18px; color: var(--color-text-muted);
      transition: transform 0.2s; flex-shrink: 0;
    }
    .chevron.open { transform: rotate(180deg); }

    /* ---- Expanded panel ---- */
    .user-panel {
      border-top: 1px solid var(--color-border);
      background: var(--color-surface);
      padding: 18px 20px 20px;
    }

    .panel-section-label {
      font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: var(--color-text-muted); margin-bottom: 10px;
    }

    /* Assign row */
    .assign-row {
      display: flex; gap: 8px; margin-bottom: 18px;
    }
    .assign-select {
      flex: 1;
      padding: 9px 12px;
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      color: var(--color-text);
      font-size: 0.88rem;
      font-family: var(--font-family);
      outline: none;
      transition: border-color 0.15s;
    }
    .assign-select:focus { border-color: var(--color-primary); }

    /* Diet items */
    .diet-items { display: flex; flex-direction: column; gap: 8px; }

    .diet-row {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 11px 16px;
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-left: 3px solid var(--color-primary);
      border-radius: var(--radius-sm);
      transition: box-shadow 0.15s;
    }
    .diet-row:hover { box-shadow: 0 2px 8px rgba(16,24,40,0.06); }

    .diet-row-info { flex: 1; min-width: 0; }
    .diet-row-name { font-size: 0.9rem; font-weight: 700; color: var(--color-text); }
    .diet-row-sub {
      font-size: 0.75rem; color: var(--color-text-muted); margin-top: 2px;
      display: flex; gap: 8px;
    }

    .diet-row-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

    .kcal-badge {
      font-size: 0.76rem; font-weight: 700; white-space: nowrap;
      color: var(--color-warning, #f59e0b);
      background: color-mix(in srgb, var(--color-warning, #f59e0b) 12%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-warning, #f59e0b) 30%, transparent);
      border-radius: 20px; padding: 3px 10px;
    }

    .btn-remove {
      background: transparent;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      color: var(--color-text-muted);
      cursor: pointer; padding: 5px 10px; font-size: 0.78rem;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .btn-remove:hover {
      background: var(--color-danger-soft);
      color: var(--color-danger);
      border-color: var(--color-danger);
    }

    .empty-msg {
      text-align: center; padding: 14px;
      color: var(--color-text-faint); font-size: 0.85rem;
      background: var(--color-card-bg);
      border: 1px dashed var(--color-border);
      border-radius: var(--radius-sm);
    }

    .loading-msg { color: var(--color-text-muted); padding: 40px; text-align: center; }
  `],
  template: `
    <ui-page-header title="Usuários & Dietas" subtitle="Gerencie as dietas atribuídas a cada usuário" />

    @if (loading()) {
      <p class="loading-msg">Carregando...</p>
    } @else {
      <div class="user-list">
        @for (item of rows(); track item.user.id) {
          <div class="user-card">

            <!-- Header clicável -->
            <div class="user-row" (click)="toggle(item)">
              <div class="user-left">
                <div class="avatar">{{ item.user.name.charAt(0).toUpperCase() }}</div>
                <div class="user-meta">
                  <div class="user-name">{{ item.user.name }}</div>
                  <div class="user-email">{{ item.user.email }}</div>
                </div>
              </div>
              <div class="user-right">
                <ui-badge [variant]="item.user.role === 'admin' ? 'danger' : 'primary'">
                  {{ item.user.role === 'admin' ? 'Admin' : 'Aluno' }}
                </ui-badge>
                <span class="diet-pill">
                  {{ item.loading ? '...' : item.diets.length }}
                  {{ item.diets.length === 1 ? 'dieta' : 'dietas' }}
                </span>
                <svg class="chevron" [class.open]="item.expanded" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>

            <!-- Painel expandido -->
            @if (item.expanded) {
              <div class="user-panel">

                <!-- Atribuir dieta -->
                <p class="panel-section-label">Atribuir Dieta</p>
                <div class="assign-row">
                  <select class="assign-select"
                    [(ngModel)]="assignSelections[item.user.id]"
                    [name]="'diet-' + item.user.id">
                    <option value="">Selecione uma dieta...</option>
                    @for (d of allDiets(); track d.id) {
                      <option [value]="d.id">
                        {{ d.name }}{{ d.createdByName ? ' — ' + d.createdByName : '' }}
                      </option>
                    }
                  </select>
                  <ui-button
                    [disabled]="!assignSelections[item.user.id]"
                    (click)="assign(item)">
                    + Atribuir
                  </ui-button>
                </div>

                <!-- Dietas atribuídas -->
                <p class="panel-section-label">Dietas Atribuídas</p>

                @if (item.loading) {
                  <p class="empty-msg">Carregando...</p>
                } @else if (item.diets.length === 0) {
                  <p class="empty-msg">Nenhuma dieta atribuída a este usuário.</p>
                } @else {
                  <div class="diet-items">
                    @for (diet of item.diets; track diet.id) {
                      <div class="diet-row">
                        <div class="diet-row-info">
                          <div class="diet-row-name">{{ diet.name }}</div>
                          <div class="diet-row-sub">
                            <span>{{ diet.meals.length }} refeições</span>
                            @if (diet.createdByName) {
                              <span>· Criada por {{ diet.createdByName }}</span>
                            }
                          </div>
                        </div>
                        <div class="diet-row-right">
                          <span class="kcal-badge">{{ getDietKcal(diet) | number:'1.0-0' }} kcal/dia</span>
                          <button class="btn-remove" (click)="unassign(item, diet.id)">✕ Remover</button>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }

          </div>
        }
      </div>
    }
  `
})
export class UserDietsComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly dietService = inject(DietService);

  loading = signal(true);
  rows = signal<UserRow[]>([]);
  allDiets = signal<Diet[]>([]);
  assignSelections: Record<string, string> = {};

  ngOnInit() {
    forkJoin({
      users: this.userService.getAll(),
      diets: this.dietService.getAll()
    }).subscribe({
      next: ({ users, diets }) => {
        this.allDiets.set(diets);
        this.rows.set(users.map(u => ({ user: u, diets: [], loading: false, expanded: false })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  toggle(item: UserRow) {
    item.expanded = !item.expanded;
    if (item.expanded && item.diets.length === 0 && !item.loading) {
      this.loadUserDiets(item);
    }
    this.rows.update(r => [...r]);
  }

  loadUserDiets(item: UserRow) {
    item.loading = true;
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
          item.loading = false;
          this.rows.update(r => [...r]);
        });
      },
      error: () => {
        item.diets = [];
        item.loading = false;
        this.rows.update(r => [...r]);
      }
    });
  }

  assign(item: UserRow) {
    const dietId = this.assignSelections[item.user.id];
    if (!dietId) return;
    this.dietService.assignToUser({ userId: item.user.id, dietId }).subscribe({
      next: () => {
        this.assignSelections[item.user.id] = '';
        item.diets = [];
        this.loadUserDiets(item);
      }
    });
  }

  unassign(item: UserRow, dietId: string) {
    this.dietService.unassignFromUser(item.user.id, dietId).subscribe({
      next: () => {
        item.diets = [];
        this.loadUserDiets(item);
      }
    });
  }

  getDietKcal(diet: Diet): number {
    return (diet.meals ?? []).reduce((t, m) =>
      t + (m.foods ?? []).reduce((s, f) => s + (f.calories || 0), 0), 0);
  }
}
