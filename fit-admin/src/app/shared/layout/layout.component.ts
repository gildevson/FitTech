import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet, RouterLinkActive],
  styles: [`
    .app-shell {
      display: flex;
      height: 100vh;
      background: #1a1a2e;
      color: #e0e0e0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .sidebar {
      width: 240px;
      min-width: 240px;
      background: #16213e;
      display: flex;
      flex-direction: column;
      padding: 0;
      box-shadow: 2px 0 8px rgba(0,0,0,0.3);
    }
    .sidebar-brand {
      padding: 24px 20px;
      font-size: 1.4rem;
      font-weight: 700;
      color: #e94560;
      letter-spacing: 1px;
      border-bottom: 1px solid #0f3460;
    }
    .sidebar-brand span {
      color: #ffffff;
    }
    .nav-menu {
      list-style: none;
      padding: 16px 0;
      margin: 0;
      flex: 1;
    }
    .nav-menu li a {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      color: #a0a0c0;
      text-decoration: none;
      font-size: 0.92rem;
      transition: background 0.2s, color 0.2s;
      border-left: 3px solid transparent;
    }
    .nav-menu li a:hover {
      background: rgba(233, 69, 96, 0.08);
      color: #ffffff;
      border-left-color: #e94560;
    }
    .nav-menu li a.active-link {
      background: rgba(233, 69, 96, 0.15);
      color: #e94560;
      border-left-color: #e94560;
      font-weight: 600;
    }
    .nav-icon {
      font-size: 1.1rem;
      width: 20px;
      text-align: center;
    }
    .main-content {
      flex: 1;
      overflow-y: auto;
      padding: 32px;
      background: #1a1a2e;
    }
    .sidebar-footer {
      padding: 16px 20px;
      border-top: 1px solid #0f3460;
    }
    .user-info {
      font-size: 0.8rem;
      color: #8892b0;
      margin-bottom: 10px;
    }
    .user-info strong {
      display: block;
      color: #ccd6f6;
      font-size: 0.85rem;
      margin-bottom: 2px;
    }
    .btn-logout {
      width: 100%;
      padding: 8px 12px;
      background: rgba(233, 69, 96, 0.1);
      color: #e94560;
      border: 1px solid rgba(233, 69, 96, 0.25);
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.82rem;
      font-weight: 500;
      text-align: left;
      transition: background 0.2s;
    }
    .btn-logout:hover {
      background: rgba(233, 69, 96, 0.2);
    }
  `],
  template: `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-brand">Fit<span>Tech</span></div>
        <ul class="nav-menu">
          <li>
            <a routerLink="/dashboard" routerLinkActive="active-link">
              <span class="nav-icon">📊</span> Dashboard
            </a>
          </li>
          <li>
            <a routerLink="/muscle-groups" routerLinkActive="active-link">
              <span class="nav-icon">💪</span> Grupos Musculares
            </a>
          </li>
          <li>
            <a routerLink="/exercises" routerLinkActive="active-link">
              <span class="nav-icon">🏋️</span> Exercícios
            </a>
          </li>
          <li>
            <a routerLink="/workout-plans" routerLinkActive="active-link">
              <span class="nav-icon">📋</span> Planos de Treino
            </a>
          </li>
          <li>
            <a routerLink="/workouts" routerLinkActive="active-link">
              <span class="nav-icon">🔥</span> Treinos
            </a>
          </li>
          <li>
            <a routerLink="/users" routerLinkActive="active-link">
              <span class="nav-icon">👥</span> Usuários
            </a>
          </li>
        </ul>
        <div class="sidebar-footer">
          @if (authService.currentUser(); as user) {
            <div class="user-info">
              <strong>{{ user.name }}</strong>
              {{ user.email }}
            </div>
          }
          <button class="btn-logout" (click)="authService.logout()">🚪 Sair</button>
        </div>
      </aside>
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `
})
export class LayoutComponent {
  readonly authService = inject(AuthService);
}
