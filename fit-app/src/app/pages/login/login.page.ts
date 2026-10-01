import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonInput,
  IonInputPasswordToggle,
  IonSpinner,
  ToastController
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
      min-height: 100vh;
      padding: 24px;
      background: #1a1a2e;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      background: #16213e;
      border-radius: 16px;
      padding: 40px 32px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(233, 69, 96, 0.15);
    }

    .logo-area {
      text-align: center;
      margin-bottom: 36px;
    }

    .logo-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 12px;
    }

    .app-title {
      font-size: 2rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 2px;
      margin: 0;
    }

    .app-title span {
      color: #e94560;
    }

    .app-subtitle {
      font-size: 0.85rem;
      color: #8892b0;
      margin-top: 4px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-label {
      display: block;
      font-size: 0.82rem;
      font-weight: 600;
      color: #a0aec0;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    ion-input {
      --background: rgba(255,255,255,0.05);
      --color: #e0e0e0;
      --placeholder-color: #6b7280;
      --border-color: rgba(233, 69, 96, 0.3);
      --border-radius: 10px;
      --padding-start: 16px;
      --padding-end: 16px;
      --padding-top: 14px;
      --padding-bottom: 14px;
      border: 1px solid rgba(233, 69, 96, 0.25);
      border-radius: 10px;
      font-size: 0.95rem;
    }

    ion-input.ion-touched.ion-invalid {
      border-color: #e94560;
    }

    .btn-login {
      --background: #e94560;
      --background-activated: #c73652;
      --background-hover: #d63d57;
      --color: #ffffff;
      --border-radius: 10px;
      --padding-top: 16px;
      --padding-bottom: 16px;
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-top: 8px;
      width: 100%;
    }

    .error-message {
      background: rgba(233, 69, 96, 0.1);
      border: 1px solid rgba(233, 69, 96, 0.3);
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
      font-size: 0.87rem;
      color: #e94560;
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
  `],
  template: `
    <ion-content [fullscreen]="true">
      <div class="login-container">
        <div class="login-card">
          <div class="logo-area">
            <span class="logo-icon">🏋️</span>
            <h1 class="app-title">Fit<span>Tech</span></h1>
            <p class="app-subtitle">Seu treino na palma da mão</p>
          </div>

          @if (errorMessage()) {
            <div class="error-message">{{ errorMessage() }}</div>
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
              autocomplete="current-password"
              fill="outline"
              (keyup.enter)="onLogin()"
            >
              <ion-input-password-toggle slot="end"></ion-input-password-toggle>
            </ion-input>
          </div>

          <ion-button
            class="btn-login"
            expand="block"
            [disabled]="loading()"
            (click)="onLogin()"
          >
            @if (loading()) {
              <div class="spinner-wrapper">
                <ion-spinner name="crescent"></ion-spinner>
                Entrando...
              </div>
            } @else {
              Entrar
            }
          </ion-button>
        </div>
      </div>
    </ion-content>
  `
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);

  email = '';
  password = '';
  loading = signal(false);
  errorMessage = signal('');

  onLogin() {
    if (!this.email || !this.password) {
      this.errorMessage.set('Preencha e-mail e senha.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/tabs/treinos']);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 401) {
          this.errorMessage.set('E-mail ou senha inválidos.');
        } else if (err.status === 0) {
          this.errorMessage.set('Não foi possível conectar ao servidor.');
        } else {
          this.errorMessage.set('Erro ao fazer login. Tente novamente.');
        }
      }
    });
  }
}
