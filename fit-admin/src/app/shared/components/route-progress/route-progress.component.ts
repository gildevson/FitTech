import { Component, inject, signal } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { SpinnerComponent } from '../spinner/spinner.component';

const MIN_VISIBLE_MS = 350;

@Component({
  selector: 'ui-route-progress',
  standalone: true,
  imports: [SpinnerComponent],
  styles: [`
    :host {
      display: contents;
    }
    .bar-track {
      position: fixed; top: 0; left: 240px; right: 0; height: 3px; z-index: 2000;
      overflow: hidden; background: transparent; pointer-events: none;
    }
    .bar {
      position: absolute; top: 0; left: 0; height: 100%; width: 40%;
      background: var(--color-primary);
      animation: ui-route-progress-slide 0.9s ease-in-out infinite;
    }
    @keyframes ui-route-progress-slide {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(350%); }
    }
    .overlay {
      position: absolute; inset: 0; z-index: 1500;
      display: flex; align-items: center; justify-content: center;
      background: var(--color-bg);
      animation: ui-route-progress-fade 0.15s ease-out;
    }
    .overlay-content {
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      color: var(--color-text-muted); font-size: 0.85rem; font-weight: 500;
    }
    @keyframes ui-route-progress-fade {
      from { opacity: 0; } to { opacity: 1; }
    }
  `],
  template: `
    @if (loading()) {
      <div class="bar-track"><div class="bar"></div></div>
      <div class="overlay">
        <div class="overlay-content">
          <ui-spinner size="lg" />
          <span>Carregando...</span>
        </div>
      </div>
    }
  `,
})
export class RouteProgressComponent {
  private router = inject(Router);

  loading = signal(false);
  private navStartedAt = 0;
  private hideTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        clearTimeout(this.hideTimeout);
        this.navStartedAt = Date.now();
        this.loading.set(true);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        const elapsed = Date.now() - this.navStartedAt;
        const remaining = Math.max(MIN_VISIBLE_MS - elapsed, 0);
        this.hideTimeout = setTimeout(() => this.loading.set(false), remaining);
      }
    });
  }
}
