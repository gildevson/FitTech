import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { DietService } from '../../core/services/diet.service';
import { CepService, BRAZIL_STATES } from '../../core/services/cep.service';
import { AppUser, Diet, UserAddress } from '../../core/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { TableCardComponent } from '../../shared/components/table-card/table-card.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { DrawerComponent } from '../../shared/components/drawer/drawer.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, PageHeaderComponent, ButtonComponent, TableCardComponent, BadgeComponent, DrawerComponent],
  template: `
    <ui-page-header title="Usuários">
      <ui-button (click)="openCreate()">+ Novo Usuário</ui-button>
    </ui-page-header>

    <ui-table-card>
      @if (loading()) {
        <p class="loading">Carregando...</p>
      } @else if (users().length === 0) {
        <p class="loading">Nenhum usuário cadastrado.</p>
      } @else {
        <table class="ui-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Cidade / UF</th>
              <th>Perfil</th>
              <th>Status</th>
              <th>Cadastrado em</th>
              <th style="text-align:center;">Dieta</th>
            </tr>
          </thead>
          <tbody>
            @for (user of users(); track user.id) {
              <tr class="clickable-row" (click)="openEdit(user)">
                <td>{{ user.name }}</td>
                <td>{{ user.email }}</td>
                <td class="muted">{{ user.city || user.state ? (user.city ?? '—') + ' / ' + (user.state ?? '—') : '—' }}</td>
                <td>
                  <ui-badge [variant]="user.role === 'admin' ? 'danger' : 'primary'">
                    {{ user.role === 'admin' ? 'Admin' : 'Usuário' }}
                  </ui-badge>
                </td>
                <td>
                  <ui-badge [variant]="user.isActive ? 'success' : 'neutral'">
                    {{ user.isActive ? 'Ativo' : 'Inativo' }}
                  </ui-badge>
                </td>
                <td>{{ user.createdAt | date:'dd/MM/yyyy' }}</td>
                <td style="text-align:center;">
                  <button class="btn-diet" (click)="$event.stopPropagation(); openUserDiets(user)" title="Ver dietas do usuário">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 11c0-5 3.5-8 9-8s9 3 9 8"/><path d="M12 3v8"/><path d="M3 11h18"/>
                      <path d="M5 11c0 4 3 7 7 8"/><path d="M19 11c0 4-3 7-7 8"/>
                    </svg>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </ui-table-card>

    <!-- Drawer: Editar/Criar usuário -->
    @if (showModal()) {
      <ui-drawer size="md" (close)="closeModal()">
        <h3 class="drawer-title">{{ editingUser() ? 'Editar Usuário' : 'Novo Usuário' }}</h3>
        <form (ngSubmit)="save()">
          <div class="field">
            <label>Nome</label>
            <input type="text" [(ngModel)]="form.name" name="name" required />
          </div>
          <div class="field">
            <label>Email</label>
            <input type="email" [(ngModel)]="form.email" name="email" required />
          </div>
          @if (!editingUser()) {
            <div class="field">
              <label>Senha</label>
              <input type="password" [(ngModel)]="form.password" name="password" required />
            </div>
          }
          <div class="field">
            <label>Perfil</label>
            <select [(ngModel)]="form.role" name="role">
              <option value="user">Usuário</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div class="section-title">Endereço</div>
          <div class="row2">
            <div class="field">
              <label>CEP</label>
              <input type="text" [ngModel]="form.zipCode" (ngModelChange)="onCepChange($event)" name="zipCode"
                     placeholder="00000-000" inputmode="numeric" maxlength="9" />
              @if (cepStatus()) { <small class="cep-status">{{ cepStatus() }}</small> }
            </div>
            <div class="field">
              <label>Estado</label>
              <select [(ngModel)]="form.state" name="state">
                <option value="">Selecione...</option>
                @for (s of states; track s.uf) {
                  <option [value]="s.uf">{{ s.uf }} — {{ s.name }}</option>
                }
              </select>
            </div>
          </div>
          <div class="field">
            <label>Cidade</label>
            <input type="text" [(ngModel)]="form.city" name="city" />
          </div>
          <div class="row2 row-street">
            <div class="field">
              <label>Rua</label>
              <input type="text" [(ngModel)]="form.street" name="street" />
            </div>
            <div class="field">
              <label>Número</label>
              <input type="text" [(ngModel)]="form.addressNumber" name="addressNumber" />
            </div>
          </div>
          <div class="row2">
            <div class="field">
              <label>Bairro</label>
              <input type="text" [(ngModel)]="form.neighborhood" name="neighborhood" />
            </div>
            <div class="field">
              <label>Complemento</label>
              <input type="text" [(ngModel)]="form.complement" name="complement" />
            </div>
          </div>

          @if (editingUser()) {
            <div class="field">
              <label>
                <input type="checkbox" [(ngModel)]="form.isActive" name="isActive" />
                Ativo
              </label>
            </div>
          }
          @if (errorMsg()) {
            <div class="error-msg">{{ errorMsg() }}</div>
          }
          <div class="modal-actions">
            @if (editingUser(); as editing) {
              <ui-button type="button" variant="danger" (click)="requestDelete(editing)" style="margin-right: auto;">Excluir</ui-button>
              <ui-button type="button" variant="secondary" (click)="toggleActive(editing)">
                {{ editing.isActive ? 'Desativar' : 'Ativar' }}
              </ui-button>
            }
            <ui-button type="button" variant="ghost" (click)="closeModal()">Cancelar</ui-button>
            <ui-button type="submit">Salvar</ui-button>
          </div>
        </form>
      </ui-drawer>
    }

    <!-- Drawer: Dietas do usuário -->
    @if (viewingUser()) {
      <ui-drawer size="lg" (close)="closeUserDiets()">
        <h3 class="drawer-title" style="margin-bottom:4px;">Dietas de {{ viewingUser()!.name }}</h3>
        <p class="drawer-subtitle">{{ viewingUser()!.email }}</p>

        <!-- Atribuir dieta -->
        <div class="assign-row">
          <select [(ngModel)]="selectedDietId" class="assign-select" name="assignDiet">
            <option value="">Selecionar dieta para atribuir...</option>
            @for (d of allDiets(); track d.id) {
              <option [value]="d.id">{{ d.name }}{{ d.createdByName ? ' — ' + d.createdByName : '' }}</option>
            }
          </select>
          <button class="btn-assign" [disabled]="!selectedDietId || assigning()" (click)="assignDiet()">
            {{ assigning() ? '...' : '+ Atribuir' }}
          </button>
        </div>

        @if (loadingDiets()) {
          <p class="loading">Carregando dietas...</p>
        } @else if (userDiets().length === 0) {
          <div class="diets-empty">
            <p>Nenhuma dieta atribuída a este usuário.</p>
            <p class="diets-empty-hint">Use o seletor acima para atribuir uma dieta.</p>
          </div>
        } @else {
          <div class="diets-list">
            @for (diet of userDiets(); track diet.id) {
              <div class="diet-block">
                <div class="diet-block-header">
                  <div>
                    <div class="diet-block-name">{{ diet.name }}</div>
                    @if (diet.description) {
                      <div class="diet-block-desc">{{ diet.description }}</div>
                    }
                  </div>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <div class="diet-kcal-badge">{{ getDietTotals(diet).calories | number:'1.0-0' }} kcal/dia</div>
                    <button class="btn-unassign" (click)="unassignDiet(diet.id)" title="Remover dieta deste usuário">✕</button>
                  </div>
                </div>
                <div class="diet-macros-bar">
                  <span class="dm dm-prot">P: {{ getDietTotals(diet).protein | number:'1.0-1' }}g</span>
                  <span class="dm dm-carb">C: {{ getDietTotals(diet).carbs | number:'1.0-1' }}g</span>
                  <span class="dm dm-fat">G: {{ getDietTotals(diet).fat | number:'1.0-1' }}g</span>
                  <span class="dm dm-meals">{{ diet.meals.length }} refeições</span>
                </div>
                @for (meal of diet.meals; track meal.id) {
                  <div class="meal-block">
                    <div class="meal-block-header">
                      <span class="meal-block-name">{{ meal.name }}</span>
                      @if (meal.mealTime) {
                        <span class="meal-time-tag">⏰ {{ meal.mealTime }}</span>
                      }
                      <span class="meal-kcal">{{ getMealTotals(meal).calories | number:'1.0-0' }} kcal</span>
                    </div>
                    @if (meal.foods.length) {
                      <div class="food-rows">
                        @for (food of meal.foods; track food.id) {
                          <div class="food-row">
                            <span class="food-row-name">{{ food.foodName }}</span>
                            <span class="food-row-qty">{{ food.quantityGrams }}g</span>
                            <span class="food-row-kcal">{{ food.calories | number:'1.0-0' }} kcal</span>
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
      </ui-drawer>
    }

    <!-- Confirm delete -->
    @if (deleteTarget(); as target) {
      <div class="modal-overlay confirm-overlay" (click)="cancelDelete()">
        <div class="modal confirm-modal" (click)="$event.stopPropagation()">
          <h3>Excluir usuário</h3>
          <p class="confirm-text">
            Esta ação não pode ser desfeita. Para confirmar, digite o nome do usuário
            <strong>{{ target.name }}</strong> abaixo.
          </p>
          <div class="field">
            <label>Nome do usuário</label>
            <input type="text" [(ngModel)]="deleteConfirmText" name="deleteConfirmText" [placeholder]="target.name" autocomplete="off" />
          </div>
          <div class="modal-actions">
            <ui-button type="button" variant="ghost" (click)="cancelDelete()">Cancelar</ui-button>
            <ui-button type="button" variant="danger" [disabled]="deleteConfirmText !== target.name" (click)="confirmDelete(target)">
              Excluir usuário
            </ui-button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .loading { color: var(--color-text-muted); padding: 32px; text-align: center; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: var(--color-surface-hover); }

    .btn-diet {
      display: inline-flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border-radius: var(--radius-sm);
      border: 1px solid var(--color-border); background: transparent;
      cursor: pointer; color: var(--color-text-muted);
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .btn-diet:hover { background: var(--color-primary-soft); color: var(--color-primary); border-color: var(--color-primary); }
    .btn-diet svg { width: 16px; height: 16px; }

    .drawer-title { color: var(--color-text); margin: 0 0 4px; font-size: 1.2rem; }
    .drawer-subtitle { color: var(--color-text-muted); font-size: 0.85rem; margin: 0 0 24px; }

    .field { margin-bottom: 16px; }
    label { display: block; color: var(--color-text-muted); font-size: 0.85rem; font-weight: 500; margin-bottom: 6px; }
    input[type=text], input[type=email], input[type=password], select {
      width: 100%; padding: 10px 14px; background: var(--color-card-bg); border: 1px solid var(--color-border);
      border-radius: var(--radius-sm); color: var(--color-text); font-size: 0.9rem; font-family: var(--font-family);
      box-sizing: border-box;
    }
    input[type=text]:focus, input[type=email]:focus, input[type=password]:focus, select:focus {
      outline: none; border-color: var(--color-primary);
    }
    input[type=checkbox] { margin-right: 8px; }
    .muted { color: var(--color-text-muted); }
    .section-title {
      margin: 24px 0 12px; padding-top: 16px; border-top: 1px solid var(--color-border);
      font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--color-text-muted);
    }
    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .row-street { grid-template-columns: 1fr 110px; }
    .cep-status { display: block; margin-top: 4px; font-size: 0.75rem; color: var(--color-text-muted); }
    .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
    .error-msg { background: var(--color-danger-soft); border: 1px solid var(--color-danger); color: var(--color-danger); padding: 10px; border-radius: var(--radius-sm); font-size: 0.85rem; margin-bottom: 12px; }

    /* Diets drawer */
    .assign-row {
      display: flex; gap: 8px; margin-bottom: 20px; align-items: center;
    }
    .assign-select {
      flex: 1; padding: 9px 12px; background: var(--color-card-bg);
      border: 1px solid var(--color-border); border-radius: var(--radius-sm);
      color: var(--color-text); font-size: 0.88rem; font-family: var(--font-family);
    }
    .assign-select:focus { outline: none; border-color: var(--color-primary); }
    .btn-assign {
      background: var(--color-primary); color: #fff; border: none;
      border-radius: var(--radius-sm); padding: 9px 16px;
      font-size: 0.85rem; font-weight: 600; cursor: pointer; white-space: nowrap;
    }
    .btn-assign:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-unassign {
      background: transparent; border: 1px solid var(--color-border);
      border-radius: var(--radius-sm); color: var(--color-text-muted);
      cursor: pointer; padding: 3px 8px; font-size: 0.8rem;
      transition: background 0.15s, color 0.15s;
    }
    .btn-unassign:hover { background: var(--color-danger-soft); color: var(--color-danger); border-color: var(--color-danger); }

    .diets-empty {
      text-align: center; padding: 30px 20px; color: var(--color-text-muted);
    }
    .diets-empty p { margin: 0 0 6px; font-size: 0.95rem; }
    .diets-empty-hint { font-size: 0.82rem; color: var(--color-text-faint); }

    .diets-list { display: flex; flex-direction: column; gap: 16px; }

    .diet-block {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .diet-block-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px 10px; gap: 12px;
      background: var(--color-card-bg);
    }
    .diet-block-name { font-size: 1rem; font-weight: 700; color: var(--color-text); }
    .diet-block-desc { font-size: 0.8rem; color: var(--color-text-muted); margin-top: 2px; }
    .diet-kcal-badge {
      font-size: 0.78rem; font-weight: 700; white-space: nowrap;
      color: #f59e0b;
      background: color-mix(in srgb, #f59e0b 12%, transparent);
      border: 1px solid color-mix(in srgb, #f59e0b 30%, transparent);
      border-radius: 20px; padding: 4px 12px;
    }
    .diet-macros-bar {
      display: flex; gap: 8px; flex-wrap: wrap;
      padding: 8px 16px 10px;
      background: var(--color-surface);
      border-top: 1px solid var(--color-border);
    }
    .dm { font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 8px; }
    .dm-prot { color: #2563eb; background: rgba(96,165,250,0.14); }
    .dm-carb { color: #0d9488; background: rgba(52,211,153,0.14); }
    .dm-fat { color: #dc2626; background: rgba(248,113,113,0.14); }
    .dm-meals { color: var(--color-text-muted); background: var(--color-surface-hover); }

    .meal-block {
      border-top: 1px solid var(--color-border);
      background: var(--color-card-bg);
    }
    .meal-block-header {
      display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
      padding: 10px 16px 8px;
    }
    .meal-block-name { font-size: 0.88rem; font-weight: 700; color: var(--color-text); }
    .meal-time-tag { font-size: 0.72rem; color: var(--color-primary); background: var(--color-primary-soft); padding: 1px 7px; border-radius: 8px; font-weight: 600; }
    .meal-kcal { margin-left: auto; font-size: 0.78rem; font-weight: 700; color: #f59e0b; }

    .food-rows { padding: 0 16px 10px; display: flex; flex-direction: column; gap: 4px; }
    .food-row { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; }
    .food-row-name { color: var(--color-text); flex: 1; }
    .food-row-qty { color: var(--color-text-muted); font-size: 0.74rem; }
    .food-row-kcal { color: #f59e0b; font-weight: 600; font-size: 0.75rem; white-space: nowrap; }

    /* Confirm delete */
    .confirm-overlay {
      position: fixed; inset: 0; background: rgba(16,24,40,0.45);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .confirm-modal {
      width: 420px; max-width: 95vw; background: var(--color-card-bg);
      border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow-lg);
      padding: 32px;
    }
    .confirm-modal h3 { color: var(--color-text); margin: 0 0 16px; font-size: 1.2rem; }
    .confirm-text { color: var(--color-text-muted); font-size: 0.9rem; line-height: 1.5; margin: 0 0 18px; }
    .confirm-text strong { color: var(--color-text); }
  `]
})
export class UsersComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly dietService = inject(DietService);
  private readonly cepService = inject(CepService);

  users = signal<AppUser[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editingUser = signal<AppUser | null>(null);
  errorMsg = signal('');
  form = this.emptyForm();
  readonly states = BRAZIL_STATES;
  cepStatus = signal('');
  deleteTarget = signal<AppUser | null>(null);
  deleteConfirmText = '';

  // Diets view
  viewingUser = signal<AppUser | null>(null);
  userDiets = signal<Diet[]>([]);
  loadingDiets = signal(false);
  allDiets = signal<Diet[]>([]);
  selectedDietId = '';
  assigning = signal(false);

  ngOnInit() { this.loadUsers(); }

  loadUsers() {
    this.loading.set(true);
    this.userService.getAll().subscribe({
      next: (users) => { this.users.set(users); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  private emptyForm() {
    return {
      name: '', email: '', password: '', role: 'user', isActive: true,
      zipCode: '', street: '', addressNumber: '', complement: '', neighborhood: '', city: '', state: ''
    };
  }

  private addressPayload(): UserAddress {
    const { zipCode, street, addressNumber, complement, neighborhood, city, state } = this.form;
    return { zipCode, street, addressNumber, complement, neighborhood, city, state };
  }

  openCreate() {
    this.editingUser.set(null);
    this.form = this.emptyForm();
    this.cepStatus.set('');
    this.errorMsg.set('');
    this.showModal.set(true);
  }

  openEdit(user: AppUser) {
    this.editingUser.set(user);
    this.form = {
      name: user.name, email: user.email, password: '', role: user.role, isActive: user.isActive,
      zipCode: user.zipCode ?? '', street: user.street ?? '', addressNumber: user.addressNumber ?? '',
      complement: user.complement ?? '', neighborhood: user.neighborhood ?? '',
      city: user.city ?? '', state: user.state ?? ''
    };
    this.cepStatus.set('');
    this.errorMsg.set('');
    this.showModal.set(true);
  }

  async onCepChange(value: string) {
    this.form.zipCode = this.cepService.format(value);
    if (this.form.zipCode.length !== 9) { this.cepStatus.set(''); return; }

    this.cepStatus.set('Buscando endereço...');
    const addr = await this.cepService.lookup(this.form.zipCode);
    if (!addr) { this.cepStatus.set('CEP não encontrado. Preencha manualmente.'); return; }

    this.form.street = addr.street || this.form.street;
    this.form.neighborhood = addr.neighborhood || this.form.neighborhood;
    this.form.city = addr.city;
    this.form.state = addr.state;
    this.cepStatus.set('');
  }

  closeModal() { this.showModal.set(false); }

  save() {
    const editing = this.editingUser();
    if (editing) {
      this.userService.update(editing.id, {
        name: this.form.name, email: this.form.email,
        role: this.form.role, isActive: this.form.isActive,
        ...this.addressPayload()
      }).subscribe({
        next: () => { this.closeModal(); this.loadUsers(); },
        error: (err) => this.errorMsg.set(err.error?.message || 'Erro ao salvar')
      });
    } else {
      this.userService.create({
        name: this.form.name, email: this.form.email,
        password: this.form.password, role: this.form.role,
        ...this.addressPayload()
      }).subscribe({
        next: () => { this.closeModal(); this.loadUsers(); },
        error: (err) => this.errorMsg.set(err.error?.message || 'Erro ao criar usuário')
      });
    }
  }

  toggleActive(user: AppUser) {
    this.userService.toggleActive(user.id, !user.isActive).subscribe({
      next: () => {
        this.form.isActive = !user.isActive;
        this.editingUser.set({ ...user, isActive: !user.isActive });
        this.loadUsers();
      }
    });
  }

  requestDelete(user: AppUser) {
    this.deleteConfirmText = '';
    this.deleteTarget.set(user);
  }

  cancelDelete() { this.deleteTarget.set(null); this.deleteConfirmText = ''; }

  confirmDelete(user: AppUser) {
    if (this.deleteConfirmText !== user.name) return;
    this.userService.delete(user.id).subscribe({
      next: () => { this.deleteTarget.set(null); this.closeModal(); this.loadUsers(); }
    });
  }

  // --- Diets view ---
  openUserDiets(user: AppUser) {
    this.viewingUser.set(user);
    this.userDiets.set([]);
    this.selectedDietId = '';
    this.loadingDiets.set(true);
    this.dietService.getAll().subscribe({ next: (all) => this.allDiets.set(all) });
    this.reloadUserDiets(user.id);
  }

  reloadUserDiets(userId: string) {
    this.loadingDiets.set(true);
    this.dietService.getUserDiets(userId).subscribe({
      next: (diets) => {
        const loadFull = diets.map(d =>
          new Promise<Diet>(resolve => {
            this.dietService.getById(d.id).subscribe({
              next: full => resolve(full),
              error: () => resolve({ ...d, meals: [] })
            });
          })
        );
        Promise.all(loadFull).then(full => {
          this.userDiets.set(full);
          this.loadingDiets.set(false);
        });
      },
      error: () => { this.userDiets.set([]); this.loadingDiets.set(false); }
    });
  }

  assignDiet() {
    const user = this.viewingUser();
    if (!user || !this.selectedDietId) return;
    this.assigning.set(true);
    this.dietService.assignToUser({ userId: user.id, dietId: this.selectedDietId }).subscribe({
      next: () => {
        this.selectedDietId = '';
        this.assigning.set(false);
        this.reloadUserDiets(user.id);
      },
      error: () => this.assigning.set(false)
    });
  }

  unassignDiet(dietId: string) {
    const user = this.viewingUser();
    if (!user) return;
    this.dietService.unassignFromUser(user.id, dietId).subscribe({
      next: () => this.reloadUserDiets(user.id)
    });
  }

  closeUserDiets() { this.viewingUser.set(null); }

  getMealTotals(meal: any) {
    const foods = meal.foods ?? [];
    return {
      calories: foods.reduce((s: number, f: any) => s + (f.calories || 0), 0),
      protein: foods.reduce((s: number, f: any) => s + (f.protein || 0), 0),
      carbs: foods.reduce((s: number, f: any) => s + (f.carbs || 0), 0),
      fat: foods.reduce((s: number, f: any) => s + (f.fat || 0), 0),
    };
  }

  getDietTotals(diet: Diet) {
    const meals = diet.meals ?? [];
    return {
      calories: meals.reduce((s, m) => s + this.getMealTotals(m).calories, 0),
      protein: meals.reduce((s, m) => s + this.getMealTotals(m).protein, 0),
      carbs: meals.reduce((s, m) => s + this.getMealTotals(m).carbs, 0),
      fat: meals.reduce((s, m) => s + this.getMealTotals(m).fat, 0),
    };
  }
}
