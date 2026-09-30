import { Component } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';

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
      font-size: 0.75rem;
      color: #555577;
      border-top: 1px solid #0f3460;
    }
  `],
  template: `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-brand">Fit<span>Tech</span></div>
        <ul class="nav-menu">
          <li>
            <a routerLink="/dashboard" routerLinkActive="active-link">
              <span class="nav-icon">&#9632;</span> Dashboard
            </a>
          </li>
          <li>
            <a routerLink="/muscle-groups" routerLinkActive="active-link">
              <span class="nav-icon">&#9670;</span> Grupos Musculares
            </a>
          </li>
          <li>
            <a routerLink="/exercises" routerLinkActive="active-link">
              <span class="nav-icon">&#9651;</span> Exercícios
            </a>
          </li>
          <li>
            <a routerLink="/workout-plans" routerLinkActive="active-link">
              <span class="nav-icon">&#9654;</span> Planos de Treino
            </a>
          </li>
          <li>
            <a routerLink="/workouts" routerLinkActive="active-link">
              <span class="nav-icon">&#9733;</span> Treinos
            </a>
          </li>
        </ul>
        <div class="sidebar-footer">FitTech Admin v1.0</div>
      </aside>
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `
})
export class LayoutComponent {}
