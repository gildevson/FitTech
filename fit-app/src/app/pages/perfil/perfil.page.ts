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
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  person,
  mail,
  shield,
  calendar,
  logOut,
  checkmarkCircle,
  closeCircle
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
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
    ion-header ion-toolbar {
      --background: #16213e;
      --color: #ffffff;
      --border-color: rgba(233, 69, 96, 0.3);
    }

    ion-toolbar ion-title {
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #ffffff;
    }

    ion-content {
      --background: #1a1a2e;
    }

    .profile-hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 24px 24px;
      text-align: center;
    }

    .avatar-circle {
      width: 88px;
      height: 88px;
      background: linear-gradient(135deg, #e94560, #c73652);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.4rem;
      margin-bottom: 16px;
      box-shadow: 0 4px 20px rgba(233, 69, 96, 0.4);
    }

    .profile-name {
      font-size: 1.4rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 4px;
    }

    .profile-email {
      font-size: 0.88rem;
      color: #8892b0;
      margin: 0 0 12px;
    }

    .role-badge {
      background: rgba(233, 69, 96, 0.15);
      color: #e94560;
      border: 1px solid rgba(233, 69, 96, 0.3);
      border-radius: 20px;
      padding: 4px 14px;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .section-title {
      padding: 20px 16px 8px;
      font-size: 0.78rem;
      font-weight: 700;
      color: #6b7280;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    ion-list {
      background: transparent;
      padding: 0 16px;
    }

    ion-item {
      --background: #16213e;
      --color: #e0e0e0;
      --border-color: rgba(255, 255, 255, 0.05);
      --padding-start: 16px;
      --inner-padding-end: 16px;
      border-radius: 10px;
      margin-bottom: 8px;
      border: 1px solid rgba(233, 69, 96, 0.1);
    }

    .item-icon {
      width: 36px;
      height: 36px;
      background: rgba(233, 69, 96, 0.12);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
    }

    .item-icon ion-icon {
      color: #e94560;
      font-size: 1.1rem;
    }

    .item-label-small {
      font-size: 0.76rem;
      color: #6b7280;
      margin-bottom: 2px;
    }

    .item-value {
      font-size: 0.92rem;
      color: #e0e0e0;
      font-weight: 500;
    }

    .status-active {
      color: #48bb78;
      font-weight: 600;
    }

    .status-inactive {
      color: #e94560;
      font-weight: 600;
    }

    .logout-section {
      padding: 24px 16px 48px;
    }

    .btn-logout {
      --background: rgba(233, 69, 96, 0.1);
      --background-activated: rgba(233, 69, 96, 0.25);
      --color: #e94560;
      --border-radius: 10px;
      --border-color: rgba(233, 69, 96, 0.3);
      --border-style: solid;
      --border-width: 1px;
      --padding-top: 16px;
      --padding-bottom: 16px;
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    .skeleton-hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 24px 24px;
    }

    ion-skeleton-text {
      --background: rgba(255, 255, 255, 0.08);
      border-radius: 4px;
    }

    .app-version {
      text-align: center;
      padding: 0 0 12px;
      font-size: 0.78rem;
      color: #4a5568;
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
          <div class="avatar-circle">🏋️</div>
          <h2 class="profile-name">{{ authService.currentUser()?.name }}</h2>
          <p class="profile-email">{{ authService.currentUser()?.email }}</p>
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

        <p class="app-version">FitTech App v1.0.0</p>
      }
    </ion-content>
  `
})
export class PerfilPage implements OnInit {
  readonly authService = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly alertCtrl = inject(AlertController);

  userDetails = signal<AppUser | null>(null);
  loading = signal(true);

  constructor() {
    addIcons({ person, mail, shield, calendar, logOut, checkmarkCircle, closeCircle });
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
      cssClass: 'fittech-alert',
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
