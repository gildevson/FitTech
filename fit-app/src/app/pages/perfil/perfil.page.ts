import { Component, inject, signal, OnInit } from '@angular/core';
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
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  person,
  mail,
  shield,
  calendar,
  logOut,
  checkmarkCircle,
  closeCircle,
  camera,
  trash
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ProfilePhotoService } from '../../core/services/profile-photo.service';
import { AppUser } from '../../core/models';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
    IonSkeletonText
  ],
  styles: [`
    .profile-hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 36px 24px 24px;
      text-align: center;
      background: radial-gradient(480px 220px at 50% 0, rgba(233, 69, 96, 0.14), transparent 70%);
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
      box-shadow: 0 0 0 4px var(--ft-bg), 0 0 0 5px var(--ft-accent-ring), 0 10px 28px rgba(233, 69, 96, 0.35);
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

    .logout-section {
      padding: 20px 16px 16px;
    }

    .btn-logout {
      --background: transparent;
      --background-activated: var(--ft-accent-soft);
      --background-hover: var(--ft-accent-soft);
      --color: var(--ft-accent);
      --border-radius: var(--ft-radius);
      --border-color: var(--ft-accent-ring);
      --border-style: solid;
      --border-width: 1px;
      height: 48px;
      font-size: 0.92rem;
      font-weight: 600;
      text-transform: none;
    }

    .skeleton-hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 36px 24px 24px;
    }

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
        <ion-title>Meu Perfil</ion-title>
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
            <button type="button" class="avatar-circle" aria-label="Alterar foto de perfil" (click)="fileInput.click()">
              @if (photoService.photo(); as photo) {
                <img [src]="photo" alt="Foto de perfil" />
              } @else {
                {{ getInitial() }}
              }
            </button>
            <button type="button" class="avatar-edit" aria-label="Alterar foto de perfil" (click)="fileInput.click()">
              <ion-icon name="camera"></ion-icon>
            </button>
            <input #fileInput class="file-input" type="file" accept="image/*" (change)="onPhotoSelected($event)" />
          </div>
          <h2 class="profile-name">{{ authService.currentUser()?.name }}</h2>
          <p class="profile-email">{{ authService.currentUser()?.email }}</p>
          @if (photoService.photo()) {
            <ion-button class="photo-remove" fill="clear" size="small" (click)="photoService.remove()">
              <ion-icon name="trash" slot="start"></ion-icon>
              Remover foto
            </ion-button>
          }
          <span class="role-badge">{{ getRoleLabel(authService.currentUser()?.role) }}</span>
        </div>

        <!-- Dados da conta -->
        @if (userDetails()) {
          <p class="section-title">Informações da Conta</p>
          <ion-list lines="none">
            <ion-item>
              <div class="item-icon" slot="start">
                <ion-icon name="person"></ion-icon>
              </div>
              <ion-label>
                <p class="item-label-small">Nome completo</p>
                <p class="item-value">{{ userDetails()!.name }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <div class="item-icon" slot="start">
                <ion-icon name="mail"></ion-icon>
              </div>
              <ion-label>
                <p class="item-label-small">E-mail</p>
                <p class="item-value">{{ userDetails()!.email }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <div class="item-icon" slot="start">
                <ion-icon name="shield"></ion-icon>
              </div>
              <ion-label>
                <p class="item-label-small">Perfil</p>
                <p class="item-value">{{ getRoleLabel(userDetails()!.role) }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <div class="item-icon" slot="start">
                <ion-icon [name]="userDetails()!.isActive ? 'checkmark-circle' : 'close-circle'"></ion-icon>
              </div>
              <ion-label>
                <p class="item-label-small">Status da conta</p>
                <p [class]="userDetails()!.isActive ? 'item-value status-active' : 'item-value status-inactive'">
                  {{ userDetails()!.isActive ? 'Conta ativa' : 'Conta inativa' }}
                </p>
              </ion-label>
            </ion-item>

            <ion-item>
              <div class="item-icon" slot="start">
                <ion-icon name="calendar"></ion-icon>
              </div>
              <ion-label>
                <p class="item-label-small">Membro desde</p>
                <p class="item-value">{{ formatDate(userDetails()!.createdAt) }}</p>
              </ion-label>
            </ion-item>
          </ion-list>
        } @else {
          <!-- fallback quando não há detalhes do usuário -->
          <p class="section-title">Informações da Conta</p>
          <ion-list lines="none">
            <ion-item>
              <div class="item-icon" slot="start">
                <ion-icon name="person"></ion-icon>
              </div>
              <ion-label>
                <p class="item-label-small">Nome</p>
                <p class="item-value">{{ authService.currentUser()?.name }}</p>
              </ion-label>
            </ion-item>
            <ion-item>
              <div class="item-icon" slot="start">
                <ion-icon name="mail"></ion-icon>
              </div>
              <ion-label>
                <p class="item-label-small">E-mail</p>
                <p class="item-value">{{ authService.currentUser()?.email }}</p>
              </ion-label>
            </ion-item>
            <ion-item>
              <div class="item-icon" slot="start">
                <ion-icon name="shield"></ion-icon>
              </div>
              <ion-label>
                <p class="item-label-small">Perfil</p>
                <p class="item-value">{{ getRoleLabel(authService.currentUser()?.role) }}</p>
              </ion-label>
            </ion-item>
          </ion-list>
        }

        <div class="logout-section">
          <ion-button
            class="btn-logout"
            expand="block"
            fill="outline"
            (click)="confirmLogout()"
          >
            <ion-icon name="log-out" slot="start"></ion-icon>
            Sair da conta
          </ion-button>
        </div>

        <p class="app-version">FitMob v1.0.0</p>
      }
    </ion-content>
  `
})
export class PerfilPage implements OnInit {
  readonly authService = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly alertCtrl = inject(AlertController);
  private readonly toastCtrl = inject(ToastController);
  readonly photoService = inject(ProfilePhotoService);

  userDetails = signal<AppUser | null>(null);
  loading = signal(true);

  constructor() {
    addIcons({ person, mail, shield, calendar, logOut, checkmarkCircle, closeCircle, camera, trash });
  }

  ngOnInit() {
    this.loadUserDetails();
  }

  loadUserDetails() {
    this.loading.set(true);
    const currentUser = this.authService.currentUser();

    if (!currentUser) {
      this.loading.set(false);
      return;
    }

    this.api.get<AppUser[]>('/api/users').subscribe({
      next: (users) => {
        const found = users.find(u => u.email === currentUser.email) ?? null;
        this.userDetails.set(found);
        this.loading.set(false);
      },
      error: () => {
        this.userDetails.set(null);
        this.loading.set(false);
      }
    });
  }

  async confirmLogout() {
    const alert = await this.alertCtrl.create({
      header: 'Sair',
      message: 'Tem certeza que deseja sair da sua conta?',
      cssClass: 'fitmob-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Sair',
          role: 'destructive',
          handler: () => this.authService.logout()
        }
      ]
    });
    await alert.present();
  }

  async onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    let message = 'Foto de perfil atualizada.';
    try {
      await this.photoService.setFromFile(file);
    } catch (err) {
      message = err instanceof Error ? err.message : 'Não foi possível carregar a imagem.';
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
      admin: 'Administrador',
      user: 'Aluno',
      student: 'Aluno',
      instructor: 'Instrutor'
    };
    return map[role.toLowerCase()] ?? role;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }
}
