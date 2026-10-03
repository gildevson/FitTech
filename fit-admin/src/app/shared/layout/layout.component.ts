import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { RouteProgressComponent } from '../components/route-progress/route-progress.component';
import { IconComponent } from '../components/icon/icon.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet, RouterLinkActive, RouteProgressComponent, IconComponent],
  styles: [`
    .app-shell {
      display: flex;
      height: 100vh;
      background: var(--color-bg);
      color: var(--color-text);
      font-family: var(--font-family);
    }
    .sidebar {
      width: 240px;
      min-width: 240px;
      background: var(--color-sidebar-bg);
      display: flex;
      flex-direction: column;
      padding: 0;
    }
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--color-border-dark);
    }
    .sidebar-brand img {
      height: 40px;
      width: 40px;
      object-fit: contain;
      border-radius: 8px;
    }
    .sidebar-brand span {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--color-text-on-dark);
      letter-spacing: 0.3px;
    }
    .sidebar-brand span b {
      color: #6e8bff;
      font-weight: 700;
    }
    .nav-menu {
      list-style: none;
      padding: 16px 12px;
      margin: 0;
      flex: 1;
    }
    .nav-menu li + li {
      margin-top: 2px;
    }
    .nav-menu li a {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 14px;
      color: var(--color-text-on-dark-muted);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      border-radius: var(--radius-sm);
      transition: background 0.15s, color 0.15s;
    }
    .nav-menu li a:hover {
      background: var(--color-sidebar-bg-hover);
      color: var(--color-text-on-dark);
    }
    .nav-menu li a.active-link {
      background: var(--color-primary);
      color: #ffffff;
    }
    .nav-icon {
      --ui-icon-size: 18px;
      width: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .main-content {
      flex: 1;
      overflow-y: auto;
      padding: 32px;
      background: var(--color-bg);
      position: relative;
    }
    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid var(--color-border-dark);
    }
    .user-info {
      font-size: 0.8rem;
      color: var(--color-text-on-dark-muted);
      margin-bottom: 10px;
    }
    .user-info strong {
      display: block;
      color: var(--color-text-on-dark);
      font-size: 0.85rem;
      margin-bottom: 2px;
    }
    .btn-logout {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 9px 12px;
      background: rgba(255, 255, 255, 0.06);
      color: var(--color-text-on-dark-muted);
      border: 1px solid var(--color-border-dark);
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 0.82rem;
      font-weight: 500;
      text-align: left;
      transition: background 0.15s, color 0.15s;
    }
    .btn-logout:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--color-text-on-dark);
    }
    .theme-toggle {
      display: flex;
      gap: 4px;
      padding: 3px;
      margin-bottom: 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--color-border-dark);
      border-radius: var(--radius-sm);
    }
    .theme-toggle button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 7px 8px;
      background: transparent;
      border: none;
      border-radius: 6px;
      color: var(--color-text-on-dark-muted);
      font-size: 0.78rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .theme-toggle button:hover {
      color: var(--color-text-on-dark);
    }
    .theme-toggle button.active {
      background: var(--color-primary);
      color: #ffffff;
    }
  `],
  template: `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <img src="logo-gordofit.png" alt="GordoFit" />
          <span>Gordo<b>Fit</b></span>
        </div>
        <ul class="nav-menu">
          <li>
            <a routerLink="/dashboard" routerLinkActive="active-link">
              <span class="nav-icon"><ui-icon name="dashboard" /></span> Dashboard
            </a>
          </li>
          <li>
            <a routerLink="/muscle-groups" routerLinkActive="active-link">
              <span class="nav-icon"><ui-icon name="muscle-group" /></span> Grupos Musculares
            </a>
          </li>
          <li>
            <a routerLink="/exercises" routerLinkActive="active-link">
              <span class="nav-icon"><ui-icon name="exercise" /></span> Exercícios
            </a>
          </li>
          <li>
            <a routerLink="/workout-plans" routerLinkActive="active-link">
              <span class="nav-icon"><ui-icon name="workout-plan" /></span> Planos de Treino
            </a>
          </li>
          <li>
            <a routerLink="/workouts" routerLinkActive="active-link">
              <span class="nav-icon"><ui-icon name="workout" /></span> Treinos
            </a>
          </li>
          <li>
            <a routerLink="/users" routerLinkActive="active-link">
              <span class="nav-icon"><ui-icon name="users" /></span> Usuários
            </a>
          </li>
        </ul>
        <div class="sidebar-footer">
          <div class="theme-toggle">
            <button type="button" [class.active]="themeService.theme() === 'light'" (click)="themeService.setTheme('light')">
              <ui-icon name="sun" /> Claro
            </button>
            <button type="button" [class.active]="themeService.theme() === 'dark'" (click)="themeService.setTheme('dark')">
              <ui-icon name="moon" /> Escuro
            </button>
          </div>
          @if (authService.currentUser(); as user) {
            <div class="user-info">
              <strong>{{ user.name }}</strong>
              {{ user.email }}
            </div>
          }
          <button class="btn-logout" (click)="authService.logout()">
            <ui-icon name="logout" /> Sair
          </button>
        </div>
      </aside>
      <main class="main-content">
        <ui-route-progress />
        <router-outlet />
      </main>
    </div>
  `
})
export class LayoutComponent {
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
}
