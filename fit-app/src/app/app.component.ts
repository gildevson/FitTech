import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { LoadingComponent } from './shared/loading/loading.component';
import { MealReminderService } from './core/services/meal-reminder.service';
import { TPipe } from './core/i18n/t.pipe';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, LoadingComponent, TPipe],
  styles: [`
    .ring-overlay {
      position: fixed; inset: 0; z-index: 99999;
      display: flex; align-items: center; justify-content: center; padding: 24px;
      background: rgba(0, 0, 0, 0.6);
    }
    .ring-card {
      width: 100%; max-width: 340px; text-align: center;
      background: var(--ft-surface, #1a1f2e); color: var(--ft-text, #fff);
      border: 1px solid var(--ft-border-strong, rgba(255,255,255,0.12));
      border-radius: 20px; padding: 28px 22px 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    }
    .ring-bell { font-size: 2.6rem; display: inline-block; animation: ring 0.9s ease-in-out infinite; }
    @keyframes ring { 0%,100% { transform: rotate(0); } 20% { transform: rotate(18deg); } 40% { transform: rotate(-14deg); } 60% { transform: rotate(8deg); } }
    .ring-time { font-size: 2rem; font-weight: 800; margin: 6px 0 2px; }
    .ring-meal { font-size: 1.1rem; font-weight: 700; }
    .ring-diet { font-size: 0.85rem; color: var(--ft-text-muted, #9aa3b5); margin-top: 2px; }
    .ring-btn {
      margin-top: 20px; width: 100%; padding: 14px; border: none; border-radius: 12px;
      background: var(--ft-accent, #e94560); color: #fff; font-size: 1rem; font-weight: 700; cursor: pointer;
    }
    .ring-snooze {
      margin-top: 10px; background: transparent; color: var(--ft-text, #fff);
      border: 1px solid var(--ft-border-strong, rgba(255,255,255,0.2));
    }
    .snooze-toast {
      position: fixed; left: 50%; bottom: 90px; transform: translateX(-50%); z-index: 99998;
      background: var(--ft-surface, #1a1f2e); color: var(--ft-text, #fff); border: 1px solid var(--ft-border-strong, rgba(255,255,255,0.12));
      padding: 8px 14px; border-radius: 999px; font-size: 0.8rem; white-space: nowrap;
    }
  `],
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
    <app-loading></app-loading>

    @if (reminders.snoozedUntil(); as at) {
      <div class="snooze-toast">💤 {{ 'rem.snoozed' | t: { at: at } }}</div>
    }

    @if (reminders.ringing(); as meal) {
      <div class="ring-overlay">
        <div class="ring-card" (click)="$event.stopPropagation()">
          <div class="ring-bell">🔔</div>
          <div class="ring-time">{{ meal.mealTime }}</div>
          <div class="ring-meal">{{ meal.mealName }}</div>
          <div class="ring-diet">{{ meal.dietName }}</div>
          <button class="ring-btn" (click)="reminders.dismissRinging()">⏹ {{ 'rem.stop' | t }}</button>
          <button class="ring-btn ring-snooze" (click)="reminders.snooze()">💤 {{ 'rem.snooze' | t: { n: reminders.snoozeMinutes } }}</button>
        </div>
      </div>
    }
  `
})
export class AppComponent {
  // Injetado na raiz para os lembretes funcionarem em qualquer aba
  readonly reminders = inject(MealReminderService);
  // Aplica o tema salvo (claro/escuro) desde a abertura do app
  private readonly theme = inject(ThemeService);
}
