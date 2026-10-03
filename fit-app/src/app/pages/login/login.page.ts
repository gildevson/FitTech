import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  IonContent,
  IonButton,
  IonInput,
  IonInputPasswordToggle,
  IonSpinner
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonButton,
    IonInput,
    IonInputPasswordToggle,
    IonSpinner
  ],
  styles: [`
    .login-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100%;
      padding: 24px;
      background:
        radial-gradient(600px 320px at 50% -80px, rgba(233, 69, 96, 0.18), transparent 70%),
        var(--ft-bg);
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      background: var(--ft-surface);
      border-radius: var(--ft-radius-lg);
      padding: 36px 32px 28px;
      box-shadow: var(--ft-shadow);
      border: 1px solid var(--ft-border);
    }

    .logo-area {
      text-align: center;
      margin-bottom: 28px;
    }

    .logo-heading {
      margin: -12px 0 0;
      line-height: 0;
    }

    .logo-img {
      width: 100%;
      max-width: 280px;
      height: auto;
      display: block;
      margin: 0 auto;
    }

    .app-subtitle {
      font-size: 0.9rem;
      color: var(--ft-text-muted);
      margin: 4px 0 0;
    }

    .mode-tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      padding: 4px;
      margin-bottom: 24px;
      background: var(--ft-bg-elevated);
      border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius);
    }

    .mode-tabs button {
      border: 0;
      background: transparent;
      color: var(--ft-text-muted);
      font: inherit;
      font-size: 0.88rem;
      font-weight: 600;
      padding: 10px 0;
      border-radius: var(--ft-radius-sm);
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }

    .mode-tabs button.active {
      background: var(--ft-surface-2);
      color: var(--ft-text);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .form-group {
      margin-bottom: 18px;
    }

    .form-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--ft-text-muted);
      margin-bottom: 8px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    ion-input {
      --background: var(--ft-bg-elevated);
      --color: var(--ft-text);
      --placeholder-color: var(--ft-text-faint);
      --border-color: var(--ft-border-strong);
      --border-radius: var(--ft-radius);
      --border-width: 1px;
      --padding-start: 14px;
      --padding-end: 14px;
      min-height: 50px;
      font-size: 0.95rem;
    }

    ion-input.ion-touched.ion-invalid {
      --border-color: var(--ft-accent);
    }

    .btn-login {
      --background: var(--ft-gradient);
      --background-activated: var(--ft-accent-strong);
      --background-hover: var(--ft-accent-strong);
      --color: #ffffff;
      --border-radius: var(--ft-radius);
      --box-shadow: 0 6px 18px rgba(233, 69, 96, 0.3);
      height: 50px;
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      text-transform: none;
      margin: 12px 0 0;
    }

    .error-message {
      background: var(--ft-accent-soft);
      border: 1px solid var(--ft-accent-ring);
      border-radius: var(--ft-radius);
      padding: 12px 16px;
      margin-bottom: 20px;
      font-size: 0.86rem;
      color: #ff8da1;
      text-align: center;
    }

    .spinner-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }

    ion-spinner {
      --color: #ffffff;
      width: 20px;
      height: 20px;
    }

    .switch-mode {
      margin: 20px 0 0;
      text-align: center;
      font-size: 0.85rem;
      color: var(--ft-text-muted);
    }

    .switch-mode button {
      border: 0;
      background: none;
      padding: 0;
      font: inherit;
      font-weight: 600;
      color: var(--ft-accent);
      cursor: pointer;
    }

    .login-footer {
      margin-top: 24px;
      font-size: 0.75rem;
      color: var(--ft-text-faint);
    }
  `],
  template: `
    <ion-content [fullscreen]="true">
      <div class="login-container">
        <div class="login-card">
          <div class="logo-area">
            <h1 class="logo-heading">
              <img class="logo-img" src="assets/images/logo.png" alt="GordoFit" />
            </h1>
            <p class="app-subtitle">Seu treino na palma da mão</p>
          </div>

          <div class="mode-tabs" role="tablist">
            <button type="button" role="tab" [class.active]="mode() === 'login'"
              [attr.aria-selected]="mode() === 'login'" (click)="setMode('login')">Entrar</button>
            <button type="button" role="tab" [class.active]="mode() === 'register'"
              [attr.aria-selected]="mode() === 'register'" (click)="setMode('register')">Cadastrar</button>
          </div>

          @if (errorMessage()) {
            <div class="error-message" role="alert">{{ errorMessage() }}</div>
          }

          @if (mode() === 'register') {
            <div class="form-group">
              <label class="form-label">Nome</label>
              <ion-input
                type="text"
                placeholder="Seu nome"
                [(ngModel)]="name"
                [disabled]="loading()"
                autocomplete="name"
                fill="outline"
              ></ion-input>
            </div>
          }

          <div class="form-group">
            <label class="form-label">E-mail</label>
            <ion-input
              type="email"
              placeholder="seu@email.com"
              [(ngModel)]="email"
              [disabled]="loading()"
              autocomplete="email"
              fill="outline"
            ></ion-input>
          </div>

          <div class="form-group">
            <label class="form-label">Senha</label>
            <ion-input
              type="password"
              placeholder="••••••••"
              [(ngModel)]="password"
              [disabled]="loading()"
              [autocomplete]="mode() === 'login' ? 'current-password' : 'new-password'"
              fill="outline"
              (keyup.enter)="mode() === 'login' && submit()"
            >
              <ion-input-password-toggle slot="end"></ion-input-password-toggle>
            </ion-input>
          </div>

          @if (mode() === 'register') {
            <div class="form-group">
              <label class="form-label">Confirmar senha</label>
              <ion-input
                type="password"
                placeholder="••••••••"
                [(ngModel)]="confirmPassword"
                [disabled]="loading()"
                autocomplete="new-password"
                fill="outline"
                (keyup.enter)="submit()"
              >
                <ion-input-password-toggle slot="end"></ion-input-password-toggle>
              </ion-input>
            </div>
          }

          <ion-button
            class="btn-login"
            expand="block"
            [disabled]="loading()"
            (click)="submit()"
          >
            @if (loading()) {
              <div class="spinner-wrapper">
                <ion-spinner name="crescent"></ion-spinner>
                {{ mode() === 'login' ? 'Entrando...' : 'Criando conta...' }}
              </div>
            } @else {
              {{ mode() === 'login' ? 'Entrar' : 'Criar conta' }}
            }
          </ion-button>

          <p class="switch-mode">
            @if (mode() === 'login') {
              Não tem conta? <button type="button" (click)="setMode('register')">Cadastre-se</button>
            } @else {
              Já tem conta? <button type="button" (click)="setMode('login')">Entrar</button>
            }
          </p>
        </div>
        <p class="login-footer">© FitMob</p>
      </div>
    </ion-content>
  `
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  mode = signal<'login' | 'register'>('login');
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  loading = signal(false);
  errorMessage = signal('');


  setMode(mode: 'login' | 'register') {
    if (this.loading()) return;
    this.mode.set(mode);
    this.errorMessage.set('');
    this.password = '';
    this.confirmPassword = '';
  }

  submit() {
    if (this.mode() === 'login') {
      this.onLogin();
    } else {
      this.onRegister();
    }
  }

  private onLogin() {
    if (!this.email || !this.password) {
      this.errorMessage.set('Preencha e-mail e senha.');
      return;
    }

    this.run(
      this.authService.login({ email: this.email.trim(), password: this.password }),
      err => {
        if (err.status === 401) return 'E-mail ou senha inválidos.';
        if (err.status === 0) return 'Não foi possível conectar ao servidor.';
        return 'Erro ao fazer login. Tente novamente.';
      }
    );
  }

  private onRegister() {
    if (!this.name.trim() || !this.email.trim() || !this.password) {
      this.errorMessage.set('Preencha nome, e-mail e senha.');
      return;
    }
    if (this.password.length < 6) {
      this.errorMessage.set('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('As senhas não conferem.');
      return;
    }

    this.run(
      this.authService.register({
        name: this.name.trim(),
        email: this.email.trim(),
        password: this.password
      }),
      err => {
        if (err.status === 409) return 'Este e-mail já está cadastrado.';
        if (err.status === 400) return err.error?.message ?? 'Dados inválidos.';
        if (err.status === 0) return 'Não foi possível conectar ao servidor.';
        return 'Erro ao criar conta. Tente novamente.';
      }
    );
  }

  private run(request$: Observable<unknown>, errorText: (err: HttpErrorResponse) => string) {
    this.loading.set(true);
    this.errorMessage.set('');

    request$.subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/tabs/treinos']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(errorText(err));
      }
    });
  }
}
