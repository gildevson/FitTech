import { Component, inject, signal } from '@angular/core';
import { TPipe } from "../../core/i18n/t.pipe";
import { I18nService } from "../../core/i18n/i18n.service";
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  IonContent,
  IonButton,
  IonInput,
  IonInputPasswordToggle,
  IonSpinner,
  IonSelect,
  IonSelectOption
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';
import { CepService, BRAZIL_STATES } from '../../core/services/cep.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    TPipe,
    FormsModule,
    IonContent,
    IonButton,
    IonInput,
    IonInputPasswordToggle,
    IonSpinner,
    IonSelect,
    IonSelectOption
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
        radial-gradient(600px 320px at 50% -80px, rgba(var(--ft-accent-rgb), 0.18), transparent 70%),
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

    /* O logo tem letras claras: no tema claro ganha um contorno escuro para não sumir no branco */
    :host-context(html.theme-light) .logo-img {
      filter: drop-shadow(0 0 0.6px rgba(20, 24, 40, 0.9)) drop-shadow(0 1px 1px rgba(20, 24, 40, 0.35));
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

    ion-select {
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

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .field-hint {
      display: block;
      margin-top: 6px;
      font-size: 0.75rem;
      color: var(--ft-text-muted);
    }

    .btn-login {
      --background: var(--ft-gradient);
      --background-activated: var(--ft-accent-strong);
      --background-hover: var(--ft-accent-strong);
      --color: #ffffff;
      --border-radius: var(--ft-radius);
      --box-shadow: 0 6px 18px rgba(var(--ft-accent-rgb), 0.3);
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
      color: var(--ft-error-text);
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
            <p class="app-subtitle">{{ 'login.subtitle' | t }}</p>
          </div>

          <div class="mode-tabs" role="tablist">
            <button type="button" role="tab" [class.active]="mode() === 'login'"
              [attr.aria-selected]="mode() === 'login'" (click)="setMode('login')">{{ 'login.tab_login' | t }}</button>
            <button type="button" role="tab" [class.active]="mode() === 'register'"
              [attr.aria-selected]="mode() === 'register'" (click)="setMode('register')">{{ 'login.tab_register' | t }}</button>
          </div>

          @if (errorMessage()) {
            <div class="error-message" role="alert">{{ errorMessage() }}</div>
          }

          @if (mode() === 'register') {
            <div class="form-group">
              <label class="form-label">{{ 'login.name' | t }}</label>
              <ion-input
                type="text"
                [placeholder]="'login.name_ph' | t"
                [(ngModel)]="name"
                [disabled]="loading()"
                autocomplete="name"
                fill="outline"
              ></ion-input>
            </div>
          }

          <div class="form-group">
            <label class="form-label">{{ 'login.email' | t }}</label>
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
            <label class="form-label">{{ 'login.password' | t }}</label>
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
              <label class="form-label">{{ 'login.confirm_password' | t }}</label>
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

            <div class="form-group">
              <label class="form-label">{{ 'login.zip' | t }}</label>
              <ion-input
                type="text"
                inputmode="numeric"
                placeholder="00000-000"
                [maxlength]="9"
                [ngModel]="zipCode"
                (ngModelChange)="onCepChange($event)"
                [disabled]="loading()"
                autocomplete="postal-code"
                fill="outline"
              ></ion-input>
              @if (cepStatus()) { <small class="field-hint">{{ cepStatus() }}</small> }
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">{{ 'login.state' | t }}</label>
                <ion-select
                  [ngModel]="state"
                  (ngModelChange)="onStateChange($event)"
                  [disabled]="loading()"
                  [placeholder]="'login.state_ph' | t"
                  interface="action-sheet"
                  fill="outline"
                >
                  @for (s of states; track s.uf) {
                    <ion-select-option [value]="s.uf">{{ s.uf }} — {{ s.name }}</ion-select-option>
                  }
                </ion-select>
              </div>
              <div class="form-group">
                <label class="form-label">{{ 'login.city' | t }}</label>
                <ion-select
                  [(ngModel)]="city"
                  [disabled]="loading() || !state || citiesLoading()"
                  [placeholder]="(!state ? 'login.city_pick_state' : citiesLoading() ? 'login.city_loading' : 'login.city_select') | t"
                  interface="modal"
                  fill="outline"
                >
                  @for (c of cities(); track c) {
                    <ion-select-option [value]="c">{{ c }}</ion-select-option>
                  }
                </ion-select>
              </div>
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
                {{ (mode() === 'login' ? 'login.logging_in' : 'login.creating') | t }}
              </div>
            } @else {
              {{ (mode() === 'login' ? 'login.btn_login' : 'login.btn_register') | t }}
            }
          </ion-button>

          <p class="switch-mode">
            @if (mode() === 'login') {
              {{ 'login.no_account' | t }} <button type="button" (click)="setMode('register')">{{ 'login.signup' | t }}</button>
            } @else {
              {{ 'login.have_account' | t }} <button type="button" (click)="setMode('login')">{{ 'login.tab_login' | t }}</button>
            }
          </p>
        </div>
        <p class="login-footer">© FitMob</p>
      </div>
    </ion-content>
  `
})
export class LoginPage {
  readonly i18n = inject(I18nService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  mode = signal<'login' | 'register'>('login');
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  zipCode = '';
  state = '';
  city = '';
  readonly states = BRAZIL_STATES;
  cepStatus = signal('');
  cities = signal<string[]>([]);
  citiesLoading = signal(false);
  loading = signal(false);
  errorMessage = signal('');

  private readonly cepService = inject(CepService);

  async onStateChange(uf: string) {
    this.state = uf;
    this.city = '';
    await this.loadCities(uf);
  }

  private async loadCities(uf: string) {
    this.citiesLoading.set(true);
    this.cities.set(await this.cepService.getCities(uf));
    this.citiesLoading.set(false);
  }

  async onCepChange(value: string) {
    this.zipCode = this.cepService.format(value);
    if (this.zipCode.length !== 9) { this.cepStatus.set(''); return; }

    this.cepStatus.set(this.i18n.t('login.cep_searching'));
    const addr = await this.cepService.lookup(this.zipCode);
    if (!addr) { this.cepStatus.set(this.i18n.t('login.cep_not_found')); return; }

    this.state = addr.state;
    await this.loadCities(addr.state);
    this.city = this.cities().find(c => c.toLowerCase() === addr.city.toLowerCase()) ?? addr.city;
    this.cepStatus.set(`${addr.city} / ${addr.state}`);
  }


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
      this.errorMessage.set(this.i18n.t('login.err_fill_login'));
      return;
    }

    this.run(
      this.authService.login({ email: this.email.trim(), password: this.password }),
      err => {
        if (err.status === 401) return this.i18n.t('login.err_invalid');
        if (err.status === 0) return this.i18n.t('login.err_connect');
        return this.i18n.t('login.err_login');
      }
    );
  }

  private onRegister() {
    if (!this.name.trim() || !this.email.trim() || !this.password) {
      this.errorMessage.set(this.i18n.t('login.err_fill_register'));
      return;
    }
    if (this.password.length < 6) {
      this.errorMessage.set(this.i18n.t('login.err_pw_len'));
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage.set(this.i18n.t('login.err_pw_match'));
      return;
    }
    if (!this.state || !this.city.trim()) {
      this.errorMessage.set(this.i18n.t('login.err_state_city'));
      return;
    }

    this.run(
      this.authService.register({
        name: this.name.trim(),
        email: this.email.trim(),
        password: this.password,
        zipCode: this.zipCode || undefined,
        state: this.state,
        city: this.city.trim(),
        language: this.i18n.lang()
      }),
      err => {
        if (err.status === 409) return this.i18n.t('login.err_email_taken');
        if (err.status === 400) return err.error?.message ?? this.i18n.t('login.err_invalid_data');
        if (err.status === 0) return this.i18n.t('login.err_connect');
        return this.i18n.t('login.err_register');
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
