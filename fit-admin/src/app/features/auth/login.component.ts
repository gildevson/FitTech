import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="logo">
          <h1>FitTech</h1>
          <p>Painel Administrativo</p>
        </div>
        <form (ngSubmit)="login()">
          <div class="field">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email" placeholder="admin@fittech.com" required />
          </div>
          <div class="field">
            <label>Senha</label>
            <input type="password" [(ngModel)]="password" name="password" placeholder="••••••••" required />
          </div>
          @if (error()) {
            <div class="error-msg">{{ error() }}</div>
          }
          <button type="submit" [disabled]="loading()">
            {{ loading() ? 'Entrando...' : 'Entrar' }}
          </button>
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
      background: #1a1a2e;
    }
    .login-card {
      background: #16213e;
      border-radius: 12px;
      padding: 48px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }
    .logo {
      text-align: center;
      margin-bottom: 40px;
    }
    .logo h1 {
      color: #e94560;
      font-size: 2.5rem;
      font-weight: 800;
      margin: 0;
      letter-spacing: 2px;
    }
    .logo p {
      color: #8892b0;
      margin: 4px 0 0;
      font-size: 0.9rem;
    }
    .field {
      margin-bottom: 20px;
    }
    label {
      display: block;
      color: #ccd6f6;
      font-size: 0.85rem;
      margin-bottom: 6px;
      font-weight: 500;
    }
    input {
      width: 100%;
      padding: 12px 16px;
      background: #0f3460;
      border: 1px solid #1a4a7e;
      border-radius: 8px;
      color: #fff;
      font-size: 0.95rem;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }
    input:focus {
      outline: none;
      border-color: #e94560;
    }
    input::placeholder { color: #4a5568; }
    button {
      width: 100%;
      padding: 14px;
      background: #e94560;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 8px;
      transition: background 0.2s;
    }
    button:hover:not(:disabled) { background: #c73652; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    .error-msg {
      background: rgba(233,69,96,0.15);
      border: 1px solid rgba(233,69,96,0.4);
      color: #e94560;
      padding: 10px 14px;
      border-radius: 6px;
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
