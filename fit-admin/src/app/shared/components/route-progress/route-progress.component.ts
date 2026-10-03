import { Component, inject, signal } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';

@Component({
  selector: 'ui-route-progress',
  standalone: true,
  styles: [`
    :host {
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
  `],
  template: `
    @if (loading()) {
      <div class="bar"></div>
    }
  `,
})
export class RouteProgressComponent {
  private router = inject(Router);

  loading = signal(false);

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.loading.set(true);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.loading.set(false);
      }
    });
  }
}
