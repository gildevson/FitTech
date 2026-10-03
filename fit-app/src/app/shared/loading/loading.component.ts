import { Component, inject } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { barbell } from 'ionicons/icons';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [IonIcon],
  styles: [`
    .top-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      z-index: 99999;
      overflow: hidden;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: none;
    }

    .top-bar.active {
      opacity: 1;
    }

    .top-bar::before {
      content: '';
      position: absolute;
      inset: 0;
      width: 40%;
      background: var(--ft-gradient);
      border-radius: 3px;
      animation: slide 1.1s ease-in-out infinite;
    }

    @keyframes slide {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(260%); }
    }

    .overlay {
      position: fixed;
      inset: 0;
      z-index: 99998;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(11, 16, 32, 0.72);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      animation: fade-in 0.15s ease-out;
    }

    .loader {
      position: relative;
      width: 72px;
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .loader .ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 3px solid var(--ft-border-strong);
      border-top-color: var(--ft-accent);
      animation: spin 0.8s linear infinite;
    }

    .loader ion-icon {
      font-size: 1.7rem;
      color: var(--ft-accent);
      animation: pulse 1.2s ease-in-out infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { 50% { transform: scale(0.85); opacity: 0.7; } }
    @keyframes fade-in { from { opacity: 0; } }
  `],
  template: `
    <div class="top-bar" [class.active]="loading.busy()" role="progressbar" aria-hidden="true"></div>

    @if (loading.pageLoading()) {
      <div class="overlay" role="status" aria-live="polite" aria-label="Carregando">
        <div class="loader">
          <div class="ring"></div>
          <ion-icon name="barbell"></ion-icon>
        </div>
      </div>
    }
  `
})
export class LoadingComponent {
  readonly loading = inject(LoadingService);

  constructor() {
    addIcons({ barbell });

    inject(Router).events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.loading.startNavigation();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.loading.endNavigation();
      }
    });
  }
}
