import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { AppUser } from '../../core/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { TableCardComponent } from '../../shared/components/table-card/table-card.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { DrawerComponent } from '../../shared/components/drawer/drawer.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule, DatePipe, PageHeaderComponent, ButtonComponent, TableCardComponent, BadgeComponent, DrawerComponent],
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
              <th>Perfil</th>
              <th>Status</th>
              <th>Cadastrado em</th>
            </tr>
          </thead>
          <tbody>
            @for (user of users(); track user.id) {
              <tr class="clickable-row" (click)="openEdit(user)">
                <td>{{ user.name }}</td>
                <td>{{ user.email }}</td>
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
              </tr>
            }
          </tbody>
        </table>
      }
    </ui-table-card>

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
    .drawer-title { color: var(--color-text); margin: 0 0 24px; font-size: 1.2rem; }
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
    .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
    .error-msg { background: var(--color-danger-soft); border: 1px solid var(--color-danger); color: var(--color-danger); padding: 10px; border-radius: var(--radius-sm); font-size: 0.85rem; margin-bottom: 12px; }
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

  users = signal<AppUser[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editingUser = signal<AppUser | null>(null);
  errorMsg = signal('');

  form = { name: '', email: '', password: '', role: 'user', isActive: true };

  deleteTarget = signal<AppUser | null>(null);
  deleteConfirmText = '';

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.userService.getAll().subscribe({
      next: (users) => { this.users.set(users); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreate() {
    this.editingUser.set(null);
    this.form = { name: '', email: '', password: '', role: 'user', isActive: true };
    this.errorMsg.set('');
    this.showModal.set(true);
  }

  openEdit(user: AppUser) {
    this.editingUser.set(user);
    this.form = { name: user.name, email: user.email, password: '', role: user.role, isActive: user.isActive };
    this.errorMsg.set('');
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  save() {
    const editing = this.editingUser();
    if (editing) {
      this.userService.update(editing.id, {
        name: this.form.name,
        email: this.form.email,
        role: this.form.role,
        isActive: this.form.isActive
      }).subscribe({
        next: () => { this.closeModal(); this.loadUsers(); },
        error: (err) => this.errorMsg.set(err.error?.message || 'Erro ao salvar')
      });
    } else {
      this.userService.create({
        name: this.form.name,
        email: this.form.email,
        password: this.form.password,
        role: this.form.role
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

  cancelDelete() {
    this.deleteTarget.set(null);
    this.deleteConfirmText = '';
  }

  confirmDelete(user: AppUser) {
    if (this.deleteConfirmText !== user.name) return;
    this.userService.delete(user.id).subscribe({
      next: () => {
        this.deleteTarget.set(null);
        this.closeModal();
        this.loadUsers();
      }
    });
  }
}
