import { Component, inject, signal, OnInit } from '@angular/core';
import { TPipe } from "../../core/i18n/t.pipe";
import { I18nService } from "../../core/i18n/i18n.service";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonSkeletonText,
  IonButtons,
  NavController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { person, mail, shield, logOut, camera, trash, language, checkmarkCircle, bodyOutline, chevronForward, chevronBack, colorPalette } from 'ionicons/icons';
import { Router } from '@angular/router';
import { LANGUAGES } from '../../core/i18n/i18n.service';
import { Lang } from '../../core/i18n/translations';
import { MealReminderService } from '../../core/services/meal-reminder.service';
import { AuthService } from '../../core/services/auth.service';
import { ProfilePhotoService } from '../../core/services/profile-photo.service';
import { ThemeService, Theme } from '../../core/services/theme.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    TPipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
    IonButtons,
    IonSkeletonText
  ],
  styles: [`
    .profile-hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 36px 24px 24px;
      text-align: center;
      background: radial-gradient(480px 220px at 50% 0, rgba(var(--ft-accent-rgb), 0.14), transparent 70%);
    }

    .avatar-wrap {
      position: relative;
      margin-bottom: 16px;
    }

    .avatar-circle {
      width: 104px;
      height: 104px;
      background: var(--ft-gradient);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.4rem;
      font-weight: 700;
      color: #ffffff;
      overflow: hidden;
      border: 0;
      padding: 0;
      cursor: pointer;
      box-shadow: 0 0 0 4px var(--ft-bg), 0 0 0 5px var(--ft-accent-ring), 0 10px 28px rgba(var(--ft-accent-rgb), 0.35);
    }

    .avatar-circle img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .avatar-edit {
      position: absolute;
      right: -2px;
      bottom: -2px;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: 3px solid var(--ft-bg);
      background: var(--ft-surface-2);
      color: var(--ft-text);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
    }

    .avatar-edit ion-icon {
      font-size: 1rem;
    }

    .photo-remove {
      --color: var(--ft-text-muted);
      font-size: 0.78rem;
      text-transform: none;
      margin: -8px 0 8px;
    }

    .file-input {
      display: none;
    }

    .profile-name {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--ft-text);
      margin: 0 0 4px;
    }

    .profile-email {
      font-size: 0.88rem;
      color: var(--ft-text-muted);
      margin: 0 0 14px;
    }

    .role-badge {
      background: var(--ft-accent-soft);
      color: var(--ft-accent);
      border-radius: 20px;
      padding: 4px 14px;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .section-title {
      margin: 0;
      padding: 20px 20px 10px;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--ft-text-faint);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    ion-list {
      padding: 0 16px;
    }

    ion-item {
      --background: var(--ft-surface);
      --color: var(--ft-text);
      --padding-start: 14px;
      --inner-padding-end: 14px;
      border-radius: var(--ft-radius);
      margin-bottom: 8px;
      border: 1px solid var(--ft-border);
    }

    .item-icon {
      width: 36px;
      height: 36px;
      background: var(--ft-accent-soft);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 14px;
    }

    .item-icon ion-icon {
      color: var(--ft-accent);
      font-size: 1.1rem;
    }

    .item-label-small {
      font-size: 0.72rem;
      font-weight: 500;
      color: var(--ft-text-faint);
      margin: 0 0 2px;
    }

    .item-value {
      font-size: 0.92rem;
      color: var(--ft-text);
      font-weight: 500;
      margin: 0;
    }

    .status-active {
      color: var(--ft-success);
      font-weight: 600;
    }

    .status-inactive {
      color: var(--ft-accent);
      font-weight: 600;
    }

    .meas-link {
      display: flex; align-items: center; gap: 12px;
      width: calc(100% - 32px); margin: 16px 16px 0; padding: 12px 14px;
      background: var(--ft-surface); border: 1px solid var(--ft-border); border-radius: var(--ft-radius);
      color: var(--ft-text); text-align: left; cursor: pointer;
    }
    .meas-link-icon {
      width: 40px; height: 40px; border-radius: var(--ft-radius); flex-shrink: 0;
      background: var(--ft-accent-soft); color: var(--ft-accent);
      display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
    }
    .meas-link-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .meas-link-text strong { font-size: 0.92rem; }
    .meas-link-text small { font-size: 0.75rem; color: var(--ft-text-muted); }
    .meas-link-arrow { color: var(--ft-text-faint); }

    .logout-section {
      padding: 20px 16px 16px;
    }

    .btn-logout-plain {
      width: 100%;
      height: 48px;
      background: transparent;
      border: 1px solid var(--ft-accent);
      border-radius: var(--ft-radius, 10px);
      color: var(--ft-accent);
      font-size: 0.92rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-logout-plain:active {
      background: var(--ft-accent-soft);
    }

    .skeleton-hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 36px 24px 24px;
    }

    .lang-card {
      margin: 0 16px; padding: 12px 14px; border-radius: var(--ft-radius);
      background: var(--ft-surface); border: 1px solid var(--ft-border);
    }
    .lang-head { display: flex; align-items: center; gap: 10px; font-size: 0.92rem; font-weight: 600; color: var(--ft-text); margin-bottom: 10px; }
    .lang-head ion-icon { color: var(--ft-accent); font-size: 1.2rem; }
    .lang-options { display: flex; flex-direction: column; gap: 6px; }
    .lang-option {
      display: flex; align-items: center; gap: 12px; width: 100%;
      padding: 10px 12px; border-radius: 10px; cursor: pointer; text-align: left;
      background: var(--ft-bg-elevated); border: 1px solid var(--ft-border); color: var(--ft-text);
      font-family: inherit; font-size: 0.9rem;
    }
    .lang-option.active { border-color: var(--ft-accent); background: var(--ft-accent-soft); }
    .lang-flag { font-size: 1.25rem; line-height: 1; }
    .lang-label { flex: 1; font-weight: 600; }
    .lang-check { color: var(--ft-accent); font-size: 1.2rem; }

    .theme-options { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .theme-option {
      display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; cursor: pointer;
      background: var(--ft-bg-elevated); border: 1px solid var(--ft-border); color: var(--ft-text);
      font-family: inherit; font-size: 0.9rem; text-align: left;
    }
    .theme-option.active { border-color: var(--ft-accent); background: var(--ft-accent-soft); }
    /* Miniatura com as cores fixas de cada tema (não muda com o tema atual) */
    .theme-swatch {
      position: relative; flex-shrink: 0; width: 30px; height: 30px; border-radius: 8px; overflow: hidden;
      background: #0b1020; border: 1px solid rgba(255, 255, 255, 0.18);
    }
    .theme-swatch .sw-bar { position: absolute; left: 4px; right: 4px; top: 5px; height: 6px; border-radius: 3px; background: #151d35; }
    .theme-swatch .sw-dot { position: absolute; right: 5px; bottom: 5px; width: 10px; height: 10px; border-radius: 50%; background: #e94560; }
    .theme-swatch.light { background: #ffffff; border-color: rgba(20, 24, 40, 0.18); }
    .theme-swatch.light .sw-bar { background: #eef0f5; }
    .theme-swatch.light .sw-dot { background: #f26b1d; }

    .app-version {
      text-align: center;
      margin: 0;
      padding: 0 0 32px;
      font-size: 0.75rem;
      color: var(--ft-text-faint);
    }
  `],
  template: `
    <ion-header [translucent]="false">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="goBack()" [attr.aria-label]="'common.back' | t">
            <ion-icon slot="icon-only" name="chevron-back"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ 'profile.title' | t }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      @if (loading()) {
        <div class="skeleton-hero">
          <ion-skeleton-text [animated]="true" style="width: 88px; height: 88px; border-radius: 50%; margin-bottom: 16px;"></ion-skeleton-text>
          <ion-skeleton-text [animated]="true" style="width: 160px; height: 22px; margin-bottom: 8px;"></ion-skeleton-text>
          <ion-skeleton-text [animated]="true" style="width: 200px; height: 16px; margin-bottom: 12px;"></ion-skeleton-text>
          <ion-skeleton-text [animated]="true" style="width: 80px; height: 24px; border-radius: 20px;"></ion-skeleton-text>
        </div>
      } @else {
        <!-- Hero com dados do usuário -->
        <div class="profile-hero">
          <div class="avatar-wrap">
            <button type="button" class="avatar-circle" [attr.aria-label]="'profile.change_photo' | t" (click)="fileInput.click()">
              @if (photoService.photo(); as photo) {
                <img [src]="photo" [alt]="'profile.photo_alt' | t" />
              } @else {
                {{ getInitial() }}
              }
            </button>
            <button type="button" class="avatar-edit" [attr.aria-label]="'profile.change_photo' | t" (click)="fileInput.click()">
              <ion-icon name="camera"></ion-icon>
            </button>
            <input #fileInput class="file-input" type="file" accept="image/*" (change)="onPhotoSelected($event)" />
          </div>
          <h2 class="profile-name">{{ authService.currentUser()?.name }}</h2>
          <p class="profile-email">{{ authService.currentUser()?.email }}</p>
          @if (photoService.photo()) {
            <ion-button class="photo-remove" fill="clear" size="small" (click)="photoService.remove()">
              <ion-icon name="trash" slot="start"></ion-icon>
              {{ 'profile.remove_photo' | t }}
            </ion-button>
          }
          <span class="role-badge">{{ getRoleLabel(authService.currentUser()?.role) }}</span>
        </div>

        <!-- Dados da conta -->
        <p class="section-title">{{ 'profile.account_info' | t }}</p>
        <ion-list lines="none">
          <ion-item>
            <div class="item-icon" slot="start">
              <ion-icon name="person"></ion-icon>
            </div>
            <ion-label>
              <p class="item-label-small">{{ 'profile.name' | t }}</p>
              <p class="item-value">{{ authService.currentUser()?.name }}</p>
            </ion-label>
          </ion-item>
          <ion-item>
            <div class="item-icon" slot="start">
              <ion-icon name="mail"></ion-icon>
            </div>
            <ion-label>
              <p class="item-label-small">{{ 'profile.email' | t }}</p>
              <p class="item-value">{{ authService.currentUser()?.email }}</p>
            </ion-label>
          </ion-item>
          <ion-item>
            <div class="item-icon" slot="start">
              <ion-icon name="shield"></ion-icon>
            </div>
            <ion-label>
              <p class="item-label-small">{{ 'profile.role' | t }}</p>
              <p class="item-value">{{ getRoleLabel(authService.currentUser()?.role) }}</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <!-- Configurações: idioma -->
        <p class="section-title">{{ 'profile.settings' | t }}</p>
        <div class="lang-card">
          <div class="lang-head">
            <ion-icon name="language"></ion-icon>
            <span>{{ 'profile.language' | t }}</span>
          </div>
          <div class="lang-options" role="radiogroup" [attr.aria-label]="'profile.language' | t">
            @for (l of languages; track l.code) {
              <button type="button" class="lang-option" role="radio"
                      [class.active]="i18n.lang() === l.code" [attr.aria-checked]="i18n.lang() === l.code"
                      [disabled]="i18n.changing()" (click)="changeLanguage(l.code)">
                <span class="lang-flag">{{ l.flag }}</span>
                <span class="lang-label">{{ l.label }}</span>
                @if (i18n.lang() === l.code) { <ion-icon name="checkmark-circle" class="lang-check"></ion-icon> }
              </button>
            }
          </div>
        </div>

        <!-- Configurações: tema -->
        <div class="lang-card" style="margin-top: 10px;">
          <div class="lang-head">
            <ion-icon name="color-palette"></ion-icon>
            <span>{{ 'profile.theme' | t }}</span>
          </div>
          <div class="theme-options" role="radiogroup" [attr.aria-label]="'profile.theme' | t">
            @for (opt of themes; track opt.code) {
              <button type="button" class="theme-option" role="radio"
                      [class.active]="themeService.theme() === opt.code" [attr.aria-checked]="themeService.theme() === opt.code"
                      (click)="themeService.set(opt.code)">
                <span class="theme-swatch" [class.light]="opt.code === 'light'">
                  <span class="sw-bar"></span><span class="sw-dot"></span>
                </span>
                <span class="lang-label">{{ opt.label | t }}</span>
                @if (themeService.theme() === opt.code) { <ion-icon name="checkmark-circle" class="lang-check"></ion-icon> }
              </button>
            }
          </div>
        </div>

        <button type="button" class="meas-link" (click)="openMeasurements()">
          <span class="meas-link-icon"><ion-icon name="body-outline"></ion-icon></span>
          <span class="meas-link-text">
            <strong>{{ 'meas.link' | t }}</strong>
            <small>{{ 'meas.link_sub' | t }}</small>
          </span>
          <ion-icon name="chevron-forward" class="meas-link-arrow"></ion-icon>
        </button>

        <div class="logout-section">
          <button class="btn-logout-plain" (click)="confirmLogout()">
            <ion-icon name="log-out"></ion-icon>
            {{ 'profile.logout' | t }}
          </button>
        </div>

        <p class="app-version">FitMob v1.0.0</p>
      }
    </ion-content>
  `
})
export class PerfilPage implements OnInit {
  readonly authService = inject(AuthService);
  private readonly toastCtrl = inject(ToastController);
  readonly photoService = inject(ProfilePhotoService);
  readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly reminders = inject(MealReminderService);
  private readonly nav = inject(NavController);

  /** Perfil não tem aba: volta para a tela de onde veio (ou Treinos, se abriu direto pelo link) */
  goBack() {
    if (window.history.length > 1) this.nav.back();
    else this.nav.navigateBack('/tabs/treinos');
  }

  openMeasurements() {
    this.router.navigate(['/tabs/medidas']);
  }
  readonly languages = LANGUAGES;
  readonly themeService = inject(ThemeService);
  readonly themes: { code: Theme; label: string }[] = [
    { code: 'light', label: 'profile.theme_light' },
    { code: 'dark', label: 'profile.theme_dark' }
  ];

  loading = signal(true);

  constructor() {
    addIcons({ person, mail, shield, logOut, camera, trash, language, checkmarkCircle, bodyOutline, chevronForward, chevronBack, colorPalette });
  }

  ngOnInit() {
    this.loading.set(false);
  }

  async changeLanguage(lang: Lang) {
    await this.i18n.changeLanguage(lang);
    // Reagenda os lembretes para as notificações saírem no idioma novo
    this.reminders.update({});
  }

  confirmLogout() {
    this.authService.logout();
  }

  async onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    let message = this.i18n.t('profile.photo_updated');
    try {
      await this.photoService.setFromFile(file);
    } catch (err) {
      message = err instanceof Error ? err.message : this.i18n.t('profile.photo_error');
    }
    const toast = await this.toastCtrl.create({ message, duration: 2500, position: 'top' });
    await toast.present();
  }

  getInitial(): string {
    return (this.authService.currentUser()?.name ?? '?').trim().charAt(0).toUpperCase();
  }

  getRoleLabel(role?: string): string {
    if (!role) return '';
    const map: Record<string, string> = {
      admin: this.i18n.t('profile.role_admin'),
      user: this.i18n.t('profile.role_student'),
      student: this.i18n.t('profile.role_student'),
      instructor: this.i18n.t('profile.role_instructor')
    };
    return map[role.toLowerCase()] ?? role;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(this.i18n.locale(), {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }
}
