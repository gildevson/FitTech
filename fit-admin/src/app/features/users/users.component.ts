import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { AppUser } from '../../core/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Usuários</h2>
        <button class="btn-primary" (click)="openCreate()">+ Novo Usuário</button>
      </div>

      @if (loading()) {
        <p class="loading">Carregando...</p>
      } @else {
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Cadastrado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr>
                  <td>{{ user.name }}</td>
                  <td>{{ user.email }}</td>
                  <td>
                    <span [class]="'badge badge-' + user.role">{{ user.role === 'admin' ? 'Admin' : 'Usuário' }}</span>
                  </td>
                  <td>
                    <span [class]="user.isActive ? 'badge badge-active' : 'badge badge-inactive'">
                      {{ user.isActive ? 'Ativo' : 'Inativo' }}
                    </span>
                  </td>
                  <td>{{ user.createdAt | date:'dd/MM/yyyy' }}</td>
                  <td class="actions">
                    <button class="btn-edit" (click)="openEdit(user)">Editar</button>
                    <button class="btn-toggle" (click)="toggleActive(user)">
                      {{ user.isActive ? 'Desativar' : 'Ativar' }}
                    </button>
                    <button class="btn-danger" (click)="delete(user)">Excluir</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ editingUser() ? 'Editar Usuário' : 'Novo Usuário' }}</h3>
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
              <button type="button" class="btn-cancel" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn-primary">Salvar</button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .page { padding: 32px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h2 { color: #ccd6f6; margin: 0; font-size: 1.6rem; }
    .btn-primary { background: #e94560; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-primary:hover { background: #c73652; }
    .table-container { background: #16213e; border-radius: 10px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #0f3460; color: #8892b0; padding: 14px 16px; text-align: left; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 14px 16px; color: #ccd6f6; border-bottom: 1px solid #1a2a4a; font-size: 0.9rem; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(15,52,96,0.3); }
    .badge { padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    .badge-admin { background: rgba(233,69,96,0.2); color: #e94560; }
    .badge-user { background: rgba(100,210,255,0.15); color: #64d2ff; }
    .badge-active { background: rgba(100,255,150,0.15); color: #64ffa0; }
    .badge-inactive { background: rgba(200,200,200,0.1); color: #888; }
    .actions { display: flex; gap: 8px; }
    .btn-edit { background: #0f3460; color: #64d2ff; border: 1px solid #1a4a7e; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; }
    .btn-toggle { background: rgba(100,255,150,0.1); color: #64ffa0; border: 1px solid rgba(100,255,150,0.2); padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; }
    .btn-danger { background: rgba(233,69,96,0.1); color: #e94560; border: 1px solid rgba(233,69,96,0.2); padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; }
    .loading { color: #8892b0; padding: 32px; text-align: center; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: #16213e; border-radius: 12px; padding: 32px; width: 460px; max-width: 95vw; }
    .modal h3 { color: #ccd6f6; margin: 0 0 24px; font-size: 1.2rem; }
    .field { margin-bottom: 16px; }
    label { display: block; color: #8892b0; font-size: 0.85rem; margin-bottom: 6px; }
    input[type=text], input[type=email], input[type=password], select {
      width: 100%; padding: 10px 14px; background: #0f3460; border: 1px solid #1a4a7e;
      border-radius: 8px; color: #fff; font-size: 0.9rem; box-sizing: border-box;
    }
    input[type=checkbox] { margin-right: 8px; }
    select option { background: #0f3460; }
    .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
    .btn-cancel { background: transparent; color: #8892b0; border: 1px solid #1a4a7e; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
    .error-msg { background: rgba(233,69,96,0.1); border: 1px solid rgba(233,69,96,0.3); color: #e94560; padding: 10px; border-radius: 6px; font-size: 0.85rem; margin-bottom: 12px; }
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
      next: () => this.loadUsers()
    });
  }

  delete(user: AppUser) {
    if (!confirm(`Excluir o usuário "${user.name}"?`)) return;
    this.userService.delete(user.id).subscribe({
      next: () => this.loadUsers()
    });
  }
}
