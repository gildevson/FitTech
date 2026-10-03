import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ButtonComponent],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="logo">
          <img src="logo-gordofit.png" alt="GordoFit" />
          <p>Painel Administrativo</p>
        </div>
        <form (ngSubmit)="login()">
          <div class="field">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email" placeholder="admin@gordofit.com" required />
          </div>
          <div class="field">
            <label>Senha</label>
            <input type="password" [(ngModel)]="password" name="password" placeholder="••••••••" required />
          </div>
          @if (error()) {
            <div class="error-msg">{{ error() }}</div>
          }
          <ui-button type="submit" [disabled]="loading()">
            {{ loading() ? 'Entrando...' : 'Entrar' }}
          </ui-button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-sidebar-bg);
    }
    .login-card {
      background: var(--color-card-bg);
      border-radius: var(--radius-lg);
      padding: 48px;
      width: 100%;
      max-width: 420px;
      box-shadow: var(--shadow-lg);
    }
    .logo {
      text-align: center;
      margin-bottom: 40px;
    }
    .logo img {
      width: 96px;
      height: 96px;
      object-fit: contain;
      border-radius: 16px;
    }
    .logo p {
      color: var(--color-text-muted);
      margin: 4px 0 0;
      font-size: 0.9rem;
    }
    .field {
      margin-bottom: 20px;
    }
    label {
      display: block;
      color: var(--color-text-muted);
      font-size: 0.85rem;
      margin-bottom: 6px;
      font-weight: 500;
    }
    input {
      width: 100%;
      padding: 12px 16px;
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      color: var(--color-text);
      font-size: 0.95rem;
      font-family: var(--font-family);
      box-sizing: border-box;
      transition: border-color 0.15s;
    }
    input:focus {
      outline: none;
      border-color: var(--color-primary);
    }
    input::placeholder { color: var(--color-text-muted); }
    ui-button {
      display: block;
      width: 100%;
      margin-top: 8px;
    }
    ui-button ::ng-deep button {
      width: 100%;
      padding: 13px;
      font-size: 0.95rem;
    }
    .error-msg {
      background: var(--color-danger-soft);
      border: 1px solid var(--color-danger);
      color: var(--color-danger);
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      margin-bottom: 16px;
    }
  `]
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  login() {
    this.loading.set(true);
    this.error.set('');

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(err.error?.message || 'Erro ao fazer login');
        this.loading.set(false);
      }
    });
  }
}
