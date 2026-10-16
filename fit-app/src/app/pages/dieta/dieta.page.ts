import { Component, inject, signal, OnInit } from '@angular/core';
import { ProfileButtonComponent } from '../../shared/profile-button/profile-button.component';
import { PageTitleComponent } from '../../shared/page-title/page-title.component';
import { TPipe } from "../../core/i18n/t.pipe";
import { I18nService } from "../../core/i18n/i18n.service";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonSkeletonText,
  IonRefresher,
  IonRefresherContent,
  IonModal,
  IonInput,
  IonTextarea,
  IonNote,
  IonToggle,
  AlertController,
  ToastController,
  RefresherEventDetail
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, trash, chevronDown, chevronUp, search, nutrition, informationCircle, notifications, notificationsOff, volumeHigh, removeCircleOutline, logoWhatsapp, print } from 'ionicons/icons';
import { DietService } from '../../core/services/diet.service';
import { AuthService } from '../../core/services/auth.service';
import { MealReminderService, ReminderSound } from '../../core/services/meal-reminder.service';
import { Diet, Meal, MealFood, FoodSearchResult } from '../../core/models';

@Component({
  selector: 'app-dieta',
  standalone: true,
  imports: [
    TPipe,
    ProfileButtonComponent,
    PageTitleComponent,
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonSkeletonText,
    IonRefresher,
    IonRefresherContent,
    IonModal,
    IonInput,
    IonTextarea,
    IonToggle,
    IonNote
  ],
  styles: [`

    .section-header {
      padding: 20px 16px 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .section-header h2 {
      margin: 0;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--ft-text-faint);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .add-btn {
      --background: var(--ft-accent);
      --background-hover: var(--ft-accent);
      --border-radius: 20px;
      --padding-start: 14px;
      --padding-end: 14px;
      --padding-top: 6px;
      --padding-bottom: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      height: 32px;
    }

    ion-card {
      --background: var(--ft-surface);
      border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius-lg);
      margin: 8px 16px;
      box-shadow: var(--ft-shadow);
      overflow: hidden;
      position: relative;
    }
    ion-card::before {
      content: '';
      position: absolute;
      inset: 0 auto 0 0;
      width: 3px;
      background: var(--ft-gradient);
    }

    ion-card-header {
      padding: 16px 16px 8px;
      cursor: pointer;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }
    ion-card-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--ft-text);
    }
    ion-card-subtitle {
      font-size: 0.8rem;
      color: var(--ft-text-muted);
      text-transform: none;
      letter-spacing: 0;
      margin-top: 2px;
    }

    .diet-header-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      margin-left: 8px;
    }

    .kcal-badge {
      background: var(--ft-accent-soft);
      color: var(--ft-accent);
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 20px;
      white-space: nowrap;
    }

    ion-card-content { padding: 0 16px 16px; }

    /* Abrir/fechar dieta: altura anima de 0 até o conteúdo, com fade e leve deslize */
    .collapse {
      display: grid; grid-template-rows: 0fr;
      transition: grid-template-rows 0.42s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .collapse.open { grid-template-rows: 1fr; }
    .collapse-inner { overflow: hidden; min-height: 0; }
    .collapse ion-card-content {
      opacity: 0; transform: translateY(-8px);
      transition: opacity 0.22s ease, transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .collapse.open ion-card-content { opacity: 1; transform: none; transition-delay: 0.06s; }
    /* Refeições entram em cascata ao abrir */
    .collapse.open .meal-block { animation: meal-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
    .collapse.open .meal-block:nth-of-type(2) { animation-delay: 0.04s; }
    .collapse.open .meal-block:nth-of-type(3) { animation-delay: 0.08s; }
    .collapse.open .meal-block:nth-of-type(4) { animation-delay: 0.12s; }
    .collapse.open .meal-block:nth-of-type(n + 5) { animation-delay: 0.16s; }
    @keyframes meal-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

    .chev { color: var(--ft-text-faint); font-size: 1rem; transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1); }
    .chev.up { transform: rotate(180deg); color: var(--ft-accent); }
    ion-card-header { transition: background 0.2s; -webkit-tap-highlight-color: transparent; }
    ion-card-header:active { background: var(--ft-accent-soft); }

    @media (prefers-reduced-motion: reduce) {
      .collapse, .collapse ion-card-content, .chev { transition: none; }
      .collapse.open .meal-block { animation: none; }
    }

    .share-row { display: flex; gap: 8px; margin-top: 12px; }
    .share-row ion-button { flex: 1; }

    .meals-label {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--ft-text-faint);
      margin: 12px 0 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .meal-block {
      background: var(--ft-bg-elevated);
      border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius);
      margin-bottom: 8px;
      overflow: hidden;
    }

    .meal-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
    }
    .meal-name { font-size: 0.9rem; font-weight: 600; color: var(--ft-text); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    /* Lembretes */
    .rem-card {
      margin: 16px 16px 4px; border-radius: var(--ft-radius);
      background: var(--ft-surface); border: 1px solid var(--ft-border-strong);
      overflow: hidden;
    }
    .rem-card.on { border-color: color-mix(in srgb, var(--ft-accent) 45%, transparent); }
    .rem-head { display: flex; align-items: center; gap: 10px; padding: 12px 14px; }
    .rem-head-btn { flex: 1; display: flex; align-items: center; gap: 12px; background: none; border: none; padding: 0; text-align: left; color: inherit; cursor: pointer; min-width: 0; }
    .rem-icon { font-size: 1.4rem; color: var(--ft-text-faint); flex-shrink: 0; }
    .rem-card.on .rem-icon { color: var(--ft-accent); }
    .rem-head-text { min-width: 0; }
    .rem-title { font-size: 0.95rem; font-weight: 700; color: var(--ft-text); }
    .rem-sub { font-size: 0.78rem; color: var(--ft-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .rem-body { padding: 4px 14px 14px; border-top: 1px solid var(--ft-border-strong); }
    .rem-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ft-text-muted); margin: 14px 0 8px; }
    .rem-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .rem-chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 6px 12px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; cursor: pointer;
      background: var(--ft-bg-elevated); color: var(--ft-text-muted); border: 1px solid var(--ft-border-strong);
    }
    .rem-chip.active { background: var(--ft-accent); border-color: var(--ft-accent); color: #fff; }
    .rem-test { color: var(--ft-accent); border-style: dashed; }
    .rem-meal { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--ft-border-strong); }
    .rem-meal:last-of-type { border-bottom: none; }
    .rem-meal-time { font-size: 0.95rem; font-weight: 800; color: var(--ft-text); min-width: 60px; background: none; border: none; padding: 4px 0; text-align: left; cursor: pointer; font-family: inherit; }
    .rem-meal-info { flex: 1; min-width: 0; }
    .rem-meal-name { font-size: 0.88rem; font-weight: 600; color: var(--ft-text); }
    .rem-meal-diet { font-size: 0.72rem; color: var(--ft-text-faint); }
    .rem-empty, .rem-note { font-size: 0.78rem; color: var(--ft-text-faint); margin: 6px 0 0; line-height: 1.4; }
    .rem-note { margin-top: 12px; }
    .rem-warn { margin-top: 12px; padding: 8px 10px; border-radius: 8px; font-size: 0.78rem; color: var(--ft-accent); background: var(--ft-accent-soft); }

    .meal-time-badge { font-size: 0.72rem; font-weight: 500; color: var(--ft-accent); background: var(--ft-accent-soft); padding: 1px 7px; border-radius: 10px; }
    button.meal-time-badge { border: none; cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; gap: 3px; }
    .meal-time-badge.custom { outline: 1px dashed var(--ft-accent); }
    .edit-pencil { font-size: 0.7em; opacity: 0.7; }
    .meal-macros { font-size: 0.72rem; color: var(--ft-text-muted); margin-top: 3px; display: flex; gap: 6px; flex-wrap: wrap; }
    .m-cal { color: #f59e0b; font-weight: 600; }
    .m-prot { color: #60a5fa; font-weight: 600; }
    .m-carb { color: #34d399; font-weight: 600; }
    .m-fat { color: #f87171; font-weight: 600; }

    .meal-actions { display: flex; gap: 6px; flex-shrink: 0; }
    .del-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 34px; height: 34px; border-radius: 8px; cursor: pointer;
      background: transparent; border: 1px solid var(--ft-border-strong); color: var(--ft-text-faint);
    }
    .del-btn:active { background: var(--ft-accent-soft); color: var(--ft-accent); border-color: var(--ft-accent); }
    .del-btn ion-icon { font-size: 1rem; }
    .del-btn.small { width: 28px; height: 28px; border: none; }
    .del-btn.diet-del { width: 30px; height: 30px; }
    .diet-std-badge {
      display: inline-block; margin-top: 6px; font-size: 0.66rem; font-weight: 700;
      padding: 2px 8px; border-radius: 8px; color: var(--ft-text-muted);
      background: var(--ft-bg-elevated); border: 1px solid var(--ft-border-strong);
    }
    .del-btn.small ion-icon { font-size: 0.9rem; }
    .action-btn {
      --padding-start: 8px;
      --padding-end: 8px;
      --padding-top: 4px;
      --padding-bottom: 4px;
      height: 28px;
      font-size: 0.75rem;
      --border-radius: 6px;
    }

    .food-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 7px 12px;
      border-top: 1px solid var(--ft-border);
    }
    .food-name { font-size: 0.82rem; font-weight: 500; color: var(--ft-text); }
    .food-meta { font-size: 0.7rem; color: var(--ft-text-faint); margin-top: 1px; }
    .food-cal { font-size: 0.78rem; font-weight: 700; color: #f59e0b; }

    .totals-strip {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 10px;
      padding: 10px 12px;
      background: var(--ft-bg-elevated);
      border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius);
    }
    .t-item { font-size: 0.78rem; }
    .t-label { color: var(--ft-text-muted); margin-right: 3px; }
    .t-val { font-weight: 700; }
    .t-cal { color: #f59e0b; }
    .t-prot { color: #60a5fa; }
    .t-carb { color: #34d399; }
    .t-fat { color: #f87171; }

    .empty-diet { color: var(--ft-text-faint); font-size: 0.85rem; padding: 8px 0 4px; }

    .skeleton-card {
      background: var(--ft-surface);
      border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius-lg);
      margin: 8px 16px;
      padding: 18px;
    }

    /* Modal styles */
    .modal-content { padding: 24px 20px 20px; }
    .modal-title { font-size: 1.1rem; font-weight: 700; color: var(--ft-text); margin: 0 0 16px; }
    .field { margin-bottom: 14px; }
    .field label { display: block; font-size: 0.8rem; font-weight: 600; color: var(--ft-text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
    .field ion-input, .field ion-textarea {
      --background: var(--ft-bg-elevated);
      --border-radius: var(--ft-radius);
      --padding-start: 12px;
      --padding-end: 12px;
      --padding-top: 10px;
      --padding-bottom: 10px;
      --color: var(--ft-text);
      border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius);
    }
    .modal-actions { display: flex; gap: 10px; margin-top: 20px; }
    .modal-actions ion-button { flex: 1; height: 44px; font-weight: 600; }
    .modal-actions ion-button { --border-radius: 8px; }

    .search-row { display: flex; gap: 8px; align-items: center; margin-bottom: 10px; }
    .search-row ion-input { flex: 1; }

    .search-results {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius);
      margin-bottom: 12px;
    }
    .s-result {
      padding: 9px 12px;
      border-bottom: 1px solid var(--ft-border);
      cursor: pointer;
    }
    .s-result:last-child { border-bottom: none; }
    .s-result.selected { background: rgba(var(--ft-accent-rgb, 99,102,241), 0.15); border-left: 3px solid var(--ft-accent); }
    .s-name { font-size: 0.85rem; font-weight: 600; color: var(--ft-text); }
    .s-macros { font-size: 0.72rem; color: var(--ft-text-muted); margin-top: 2px; }
    .s-msg { padding: 16px; text-align: center; color: var(--ft-text-faint); font-size: 0.82rem; }

    .macros-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

    ion-modal { --height: auto; --max-height: 90vh; --border-radius: 16px 16px 0 0; }
  `],
  template: `
    <ion-header [translucent]="false">
      <ion-toolbar>
        <ion-title><app-page-title [title]="'diet.title' | t"></app-page-title></ion-title>
        <app-profile-button slot="end"></app-profile-button>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (loading()) {
        @for (i of [1,2]; track i) {
          <div class="skeleton-card">
            <ion-skeleton-text [animated]="true" style="width: 55%; height: 16px; margin-bottom: 8px;"></ion-skeleton-text>
            <ion-skeleton-text [animated]="true" style="width: 75%; height: 12px; margin-bottom: 14px;"></ion-skeleton-text>
            <ion-skeleton-text [animated]="true" style="width: 100%; height: 40px;"></ion-skeleton-text>
          </div>
        }
      } @else {
        <!-- Lembretes de refeição -->
        <div class="rem-card" [class.on]="reminders.settings().enabled">
          <div class="rem-head">
            <button class="rem-head-btn" (click)="remindersOpen.set(!remindersOpen())">
              <ion-icon [name]="reminders.settings().enabled ? 'notifications' : 'notifications-off'" class="rem-icon"></ion-icon>
              <div class="rem-head-text">
                <div class="rem-title">{{ 'rem.title' | t }}</div>
                <div class="rem-sub">
                  @if (reminders.nextReminder(); as next) {
                    {{ 'rem.next' | t: { meal: next.meal.mealName, at: next.at } }}
                  } @else {
                    {{ (reminders.settings().enabled ? 'rem.no_meals_time' : 'rem.off') | t }}
                  }
                </div>
              </div>
            </button>
            <ion-toggle [checked]="reminders.settings().enabled"
                        (ionChange)="reminders.update({ enabled: $event.detail.checked }); remindersOpen.set($event.detail.checked)"
                        [attr.aria-label]="'rem.toggle_aria' | t"></ion-toggle>
          </div>

          @if (remindersOpen()) {
            <div class="rem-body">
              @if (reminders.permissionDenied()) {
                <div class="rem-warn">
                  {{ (reminders.isNative ? 'rem.blocked_phone' : 'rem.blocked_browser') | t }}
                </div>
              }

              <div class="rem-label">{{ 'rem.notify' | t }}</div>
              <div class="rem-chips">
                @for (min of reminderOffsets; track min) {
                  <button class="rem-chip" [class.active]="reminders.settings().minutesBefore === min"
                          (click)="reminders.update({ minutesBefore: min })">
                    {{ min === 0 ? ('rem.at_time' | t) : ('rem.min_before' | t: { n: min }) }}
                  </button>
                }
              </div>

              <div class="rem-label">{{ 'rem.sound' | t }}</div>
              <div class="rem-chips">
                @for (s of reminderSounds; track s.id) {
                  <button class="rem-chip" [class.active]="reminders.settings().sound === s.id"
                          (click)="reminders.update({ sound: s.id }); reminders.playSound(s.id)">
                    {{ s.label | t }}
                  </button>
                }
                <button class="rem-chip rem-test" (click)="reminders.playSound(reminders.settings().sound)">
                  <ion-icon name="volume-high"></ion-icon> {{ 'rem.test' | t }}
                </button>
              </div>

              <div class="rem-label">{{ 'rem.meals' | t }}</div>
              @if (reminders.meals().length === 0) {
                <p class="rem-empty">{{ 'rem.empty' | t }}</p>
              }
              @for (m of reminders.meals(); track m.mealId) {
                <div class="rem-meal">
                  <button class="rem-meal-time" (click)="editMealTimeById(m.mealId)" [title]="'diet.change_time' | t">{{ m.mealTime }} <span class="edit-pencil">✎</span></button>
                  <div class="rem-meal-info">
                    <div class="rem-meal-name">{{ m.mealName }}</div>
                    <div class="rem-meal-diet">{{ m.dietName }}</div>
                  </div>
                  <ion-toggle [checked]="reminders.isMealOn(m.mealId)"
                              (ionChange)="reminders.toggleMeal(m.mealId, $event.detail.checked)"
                              [attr.aria-label]="'rem.meal_aria' | t: { meal: m.mealName }"></ion-toggle>
                </div>
              }

              @if (!reminders.isNative) {
                <p class="rem-note">{{ 'rem.note' | t }}</p>
              }
            </div>
          }
        </div>

        <div class="section-header">
          <h2>{{ 'diet.my_diets' | t: { n: diets().length } }}</h2>
          <ion-button class="add-btn" size="small" (click)="openCreateDiet()">
            <ion-icon name="add" slot="start"></ion-icon>
            {{ 'diet.my_diet_btn' | t }}
          </ion-button>
        </div>

        @if (diets().length === 0) {
          <ion-card>
            <ion-card-content>
              <div style="text-align:center; padding: 20px 0; color: var(--ft-text-faint); font-size: 0.88rem;">
                <ion-icon name="nutrition" style="font-size: 2rem; display:block; margin: 0 auto 10px; color: var(--ft-accent);"></ion-icon>
                {{ 'diet.none' | t }}
              </div>
            </ion-card-content>
          </ion-card>
        }

        @for (diet of diets(); track diet.id) {
          <ion-card>
            <ion-card-header (click)="toggleDiet(diet.id)">
              <div style="flex:1;">
                <ion-card-title>{{ diet.name }}</ion-card-title>
                @if (diet.description) {
                  <ion-card-subtitle>{{ diet.description }}</ion-card-subtitle>
                }
              </div>
              <div class="diet-header-right">
                <span class="kcal-badge">{{ getDietTotals(diet).calories | number:'1.0-0' }} kcal</span>
                <ion-icon name="chevron-down" class="chev" [class.up]="expandedDiet() === diet.id"></ion-icon>
                <button class="del-btn diet-del" (click)="$event.stopPropagation(); confirmRemoveDiet(diet)"
                        [attr.aria-label]="(canEdit(diet) ? 'diet.delete_diet' : 'diet.remove_diet') | t">
                  <ion-icon [name]="canEdit(diet) ? 'trash' : 'remove-circle-outline'"></ion-icon>
                </button>
              </div>
              @if (!canEdit(diet)) {
                <span class="diet-std-badge">{{ 'diet.standard_badge' | t }}</span>
              }
            </ion-card-header>

            <!-- Abre/fecha animando a altura (grid 0fr → 1fr); o conteúdo só é montado depois do 1º toque -->
            <div class="collapse" [class.open]="expandedDiet() === diet.id" [attr.inert]="expandedDiet() === diet.id ? null : ''">
            <div class="collapse-inner">
              <ion-card-content>
                @if (rendered(diet.id)) {
                <div class="meals-label">
                  <span>{{ 'diet.meals' | t: { n: mealCount(diet) } }}</span>
                  <ion-button fill="outline" size="small" class="action-btn" (click)="openAddMeal(diet)">
                    <ion-icon name="add" slot="start"></ion-icon>
                    {{ 'diet.meal_btn' | t }}
                  </ion-button>
                </div>

                @if (!diet.meals || diet.meals.length === 0) {
                  <p class="empty-diet">{{ 'diet.no_meals' | t }}</p>
                }

                @for (meal of diet.meals; track meal.id) {
                  <div class="meal-block">
                    <div class="meal-row">
                      <div>
                        <div class="meal-name">
                          {{ meal.name }}
                          <button class="meal-time-badge" [class.custom]="meal.originalMealTime" (click)="editMealTime(meal); $event.stopPropagation()" [title]="'diet.change_time' | t">
                            🕐 {{ meal.mealTime || ('diet.set_time' | t) }} <span class="edit-pencil">✎</span>
                          </button>
                        </div>
                        <div class="meal-macros">
                          <span class="m-cal">{{ getMealTotals(meal).calories | number:'1.0-0' }} kcal</span>
                          <span class="m-prot">P: {{ getMealTotals(meal).protein | number:'1.0-1' }}g</span>
                          <span class="m-carb">C: {{ getMealTotals(meal).carbs | number:'1.0-1' }}g</span>
                          <span class="m-fat">G: {{ getMealTotals(meal).fat | number:'1.0-1' }}g</span>
                        </div>
                      </div>
                      <div class="meal-actions">
                        <ion-button fill="outline" size="small" class="action-btn" (click)="openAddFood(diet, meal)">
                          <ion-icon name="add" slot="start"></ion-icon>
                          {{ 'diet.food_btn' | t }}
                        </ion-button>
                        @if (canDeleteItem(diet, meal.createdBy)) {
                          <button class="del-btn" (click)="confirmDeleteMeal(meal)" [attr.aria-label]="'diet.delete_meal' | t">
                            <ion-icon name="trash"></ion-icon>
                          </button>
                        }
                      </div>
                    </div>

                    @for (food of meal.foods; track food.id) {
                      <div class="food-item">
                        <div style="flex:1;">
                          <div class="food-name">{{ food.foodName }}</div>
                          <div class="food-meta">{{ getFoodQtyDisplay(food) }} · P: {{ food.protein | number:'1.0-1' }}g C: {{ food.carbs | number:'1.0-1' }}g G: {{ food.fat | number:'1.0-1' }}g</div>
                        </div>
                        <div style="display:flex; align-items:center; gap:6px;">
                          <span class="food-cal">{{ food.calories | number:'1.0-0' }} kcal</span>
                          <ion-button fill="clear" size="small" style="--padding-start:4px;--padding-end:4px;" (click)="openEditFood(food, meal)">✎</ion-button>
                          @if (canDeleteItem(diet, food.createdBy)) {
                            <button class="del-btn small" (click)="confirmDeleteFood(food)" [attr.aria-label]="'diet.delete_food' | t">
                              <ion-icon name="trash"></ion-icon>
                            </button>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }

                @if (diet.meals && diet.meals.length > 0) {
                  <div class="totals-strip">
                    <div class="t-item"><span class="t-label">{{ 'diet.total' | t }}</span><span class="t-val t-cal">{{ getDietTotals(diet).calories | number:'1.0-0' }} kcal</span></div>
                    <div class="t-item"><span class="t-label">{{ 'diet.prot' | t }}</span><span class="t-val t-prot">{{ getDietTotals(diet).protein | number:'1.0-1' }}g</span></div>
                    <div class="t-item"><span class="t-label">{{ 'diet.carb' | t }}</span><span class="t-val t-carb">{{ getDietTotals(diet).carbs | number:'1.0-1' }}g</span></div>
                    <div class="t-item"><span class="t-label">{{ 'diet.fat' | t }}</span><span class="t-val t-fat">{{ getDietTotals(diet).fat | number:'1.0-1' }}g</span></div>
                  </div>

                  <div class="share-row">
                    <ion-button fill="outline" size="small" class="action-btn" (click)="shareWhatsApp(diet)">
                      <ion-icon name="logo-whatsapp" slot="start"></ion-icon>
                      {{ 'diet.share' | t }}
                    </ion-button>
                    <ion-button fill="outline" size="small" class="action-btn" (click)="printDiet(diet)">
                      <ion-icon name="print" slot="start"></ion-icon>
                      {{ 'diet.print' | t }}
                    </ion-button>
                  </div>
                }
                }
              </ion-card-content>
            </div>
            </div>
          </ion-card>
        }
      }
    </ion-content>

    <!-- Modal: Nova Dieta -->
    <ion-modal [isOpen]="showDietModal()" (willDismiss)="showDietModal.set(false)">
      <ng-template>
        <div class="modal-content">
          <p class="modal-title">{{ 'diet.new_diet' | t }}</p>
          <div class="field">
            <label>{{ 'common.name' | t }}</label>
            <ion-input [(ngModel)]="dietForm.name" [placeholder]="'diet.diet_name_ph' | t" fill="outline"></ion-input>
          </div>
          <div class="field">
            <label>{{ 'diet.description' | t }}</label>
            <ion-textarea [(ngModel)]="dietForm.description" [placeholder]="'diet.description_ph' | t" rows="2" fill="outline"></ion-textarea>
          </div>
          <div class="modal-actions">
            <ion-button fill="outline" (click)="showDietModal.set(false)">{{ 'common.cancel' | t }}</ion-button>
            <ion-button (click)="saveDiet()">{{ 'common.save' | t }}</ion-button>
          </div>
        </div>
      </ng-template>
    </ion-modal>

    <!-- Modal: Nova Refeição -->
    <ion-modal [isOpen]="showMealModal()" (willDismiss)="showMealModal.set(false)">
      <ng-template>
        <div class="modal-content">
          <p class="modal-title">{{ 'diet.new_meal' | t }}</p>
          <div class="field">
            <label>{{ 'diet.meal_name' | t }}</label>
            <ion-input [(ngModel)]="mealForm.name" [placeholder]="'diet.meal_name_ph' | t" fill="outline"></ion-input>
          </div>
          <div class="field">
            <label>{{ 'diet.time' | t }}</label>
            <ion-input type="time" [(ngModel)]="mealForm.mealTime" fill="outline" required></ion-input>
          </div>
          <div class="field">
            <label>{{ 'diet.order' | t }}</label>
            <ion-input type="number" [(ngModel)]="mealForm.mealOrder" fill="outline"></ion-input>
          </div>
          <div class="modal-actions">
            <ion-button fill="outline" (click)="showMealModal.set(false)">{{ 'common.cancel' | t }}</ion-button>
            <ion-button (click)="saveMeal()">{{ 'common.save' | t }}</ion-button>
          </div>
        </div>
      </ng-template>
    </ion-modal>

    <!-- Modal: Editar Alimento -->
    <ion-modal [isOpen]="showEditFoodModal()" (willDismiss)="showEditFoodModal.set(false); editingFood.set(null)">
      <ng-template>
        <div class="modal-content">
          <p class="modal-title">{{ 'diet.edit_food' | t }}</p>
          <div class="field">
            <label>{{ 'diet.food_name' | t }}</label>
            <ion-input [(ngModel)]="foodForm.foodName" [placeholder]="'common.name' | t" fill="outline"></ion-input>
          </div>
          <div class="field">
            <label>{{ 'diet.measure_type' | t }}</label>
            <div style="display:flex; gap:8px;">
              <ion-button [fill]="foodForm.measureType === 'grams' ? 'solid' : 'outline'" size="small" (click)="foodForm.measureType='grams'; onMeasureTypeChange()">{{ 'diet.grams' | t }}</ion-button>
              <ion-button [fill]="foodForm.measureType === 'unit' ? 'solid' : 'outline'" size="small" (click)="foodForm.measureType='unit'; onMeasureTypeChange()">{{ 'diet.unit' | t }}</ion-button>
            </div>
          </div>
          @if (foodForm.measureType === 'grams') {
            <div class="field">
              <label>{{ 'diet.qty_g' | t }}</label>
              <ion-input type="number" [(ngModel)]="foodForm.quantityGrams" fill="outline"></ion-input>
            </div>
          } @else {
            <div class="macros-grid">
              <div class="field">
                <label>{{ 'diet.qty' | t }}</label>
                <ion-input type="number" [(ngModel)]="foodForm.servingQuantity" fill="outline" (ionInput)="onServingChange()"></ion-input>
              </div>
              <div class="field">
                <label>{{ 'diet.unit_name' | t }}</label>
                <ion-input [(ngModel)]="foodForm.servingUnit" [placeholder]="'diet.unit_name_ph' | t" fill="outline"></ion-input>
              </div>
            </div>
            <div class="field">
              <label>{{ 'diet.grams_per_unit' | t }}</label>
              <ion-input type="number" [(ngModel)]="foodForm.servingGrams" fill="outline" (ionInput)="onServingChange()"></ion-input>
            </div>
            <div style="font-size:0.78rem; color: var(--ft-text-muted); margin-bottom:10px;">
              Total: {{ foodForm.servingQuantity }} {{ foodForm.servingUnit }} = {{ foodForm.quantityGrams }}g
            </div>
          }
          <div class="macros-grid">
            <div class="field">
              <label>{{ 'diet.kcal' | t }}</label>
              <ion-input type="number" [(ngModel)]="foodForm.calories" fill="outline"></ion-input>
            </div>
            <div class="field">
              <label>{{ 'diet.protein' | t }}</label>
              <ion-input type="number" [(ngModel)]="foodForm.protein" fill="outline"></ion-input>
            </div>
            <div class="field">
              <label>{{ 'diet.carbs' | t }}</label>
              <ion-input type="number" [(ngModel)]="foodForm.carbs" fill="outline"></ion-input>
            </div>
            <div class="field">
              <label>{{ 'diet.fat_g' | t }}</label>
              <ion-input type="number" [(ngModel)]="foodForm.fat" fill="outline"></ion-input>
            </div>
          </div>
          <div class="modal-actions">
            <ion-button fill="outline" (click)="showEditFoodModal.set(false); editingFood.set(null)">{{ 'common.cancel' | t }}</ion-button>
            <ion-button (click)="saveEditFood()">{{ 'common.save' | t }}</ion-button>
          </div>
        </div>
      </ng-template>
    </ion-modal>

    <!-- Modal: Adicionar Alimento -->
    <ion-modal [isOpen]="showFoodModal()" (willDismiss)="showFoodModal.set(false)">
      <ng-template>
        <div class="modal-content">
          <p class="modal-title">{{ 'diet.add_food' | t }}</p>

          <div class="field">
            <label>{{ 'diet.search_food' | t }} <ion-note style="font-size:0.72rem;">({{ 'common.optional' | t }})</ion-note></label>
            <div class="search-row">
              <ion-input [(ngModel)]="foodSearchQuery" [placeholder]="'diet.search_food_ph' | t" fill="outline" (keydown.enter)="searchFood()"></ion-input>
              <ion-button size="small" (click)="searchFood()">
                <ion-icon name="search" slot="icon-only"></ion-icon>
              </ion-button>
            </div>
          </div>

          @if (searching()) {
            <div class="s-msg">{{ 'common.searching' | t }}</div>
          } @else if (searchResults().length > 0) {
            <div class="search-results">
              @for (r of searchResults(); track r.code) {
                <div class="s-result" [class.selected]="selectedFood()?.code === r.code" (click)="selectFood(r)">
                  <div class="s-name">{{ r.name }}</div>
                  <div class="s-macros">{{ r.calories | number:'1.0-0' }} kcal · P:{{ r.protein | number:'1.0-1' }}g C:{{ r.carbs | number:'1.0-1' }}g G:{{ r.fat | number:'1.0-1' }}g</div>
                </div>
              }
            </div>
          } @else if (searchPerformed()) {
            <div class="s-msg">{{ 'diet.no_results' | t }}</div>
          }

          <div class="field">
            <label>{{ 'diet.food_name' | t }}</label>
            <ion-input [(ngModel)]="foodForm.foodName" [placeholder]="'common.name' | t" fill="outline"></ion-input>
          </div>

          <div class="field">
            <label>{{ 'diet.measure_type' | t }}</label>
            <div style="display:flex; gap:8px;">
              <ion-button [fill]="foodForm.measureType === 'grams' ? 'solid' : 'outline'" size="small" (click)="foodForm.measureType='grams'; onMeasureTypeChange()">{{ 'diet.grams' | t }}</ion-button>
              <ion-button [fill]="foodForm.measureType === 'unit' ? 'solid' : 'outline'" size="small" (click)="foodForm.measureType='unit'; onMeasureTypeChange()">{{ 'diet.unit' | t }}</ion-button>
            </div>
          </div>

          @if (foodForm.measureType === 'grams') {
            <div class="field">
              <label>{{ 'diet.qty_g' | t }}</label>
              <ion-input type="number" [(ngModel)]="foodForm.quantityGrams" fill="outline" (ionInput)="recalcMacros()"></ion-input>
            </div>
          } @else {
            <div class="macros-grid">
              <div class="field">
                <label>{{ 'diet.qty' | t }}</label>
                <ion-input type="number" [(ngModel)]="foodForm.servingQuantity" fill="outline" (ionInput)="onServingChange()"></ion-input>
              </div>
              <div class="field">
                <label>{{ 'diet.unit_name' | t }}</label>
                <ion-input [(ngModel)]="foodForm.servingUnit" [placeholder]="'diet.unit_name_ph' | t" fill="outline"></ion-input>
              </div>
            </div>
            <div class="field">
              <label>{{ 'diet.grams_per_unit' | t }}</label>
              <ion-input type="number" [(ngModel)]="foodForm.servingGrams" fill="outline" (ionInput)="onServingChange()"></ion-input>
            </div>
            <div style="font-size:0.78rem; color: var(--ft-text-muted); margin-bottom:10px;">
              Total: {{ foodForm.servingQuantity }} {{ foodForm.servingUnit }} = {{ foodForm.quantityGrams }}g
            </div>
          }

          <div class="macros-grid">
            <div class="field">
              <label>{{ 'diet.kcal' | t }}</label>
              <ion-input type="number" [(ngModel)]="foodForm.calories" fill="outline"></ion-input>
            </div>
            <div class="field">
              <label>{{ 'diet.protein' | t }}</label>
              <ion-input type="number" [(ngModel)]="foodForm.protein" fill="outline"></ion-input>
            </div>
            <div class="field">
              <label>{{ 'diet.carbs' | t }}</label>
              <ion-input type="number" [(ngModel)]="foodForm.carbs" fill="outline"></ion-input>
            </div>
            <div class="field">
              <label>{{ 'diet.fat_g' | t }}</label>
              <ion-input type="number" [(ngModel)]="foodForm.fat" fill="outline"></ion-input>
            </div>
          </div>
          <div class="modal-actions">
            <ion-button fill="outline" (click)="showFoodModal.set(false)">{{ 'common.cancel' | t }}</ion-button>
            <ion-button (click)="saveFood()">{{ 'common.add' | t }}</ion-button>
          </div>
        </div>
      </ng-template>
    </ion-modal>
  `
})
export class DietaPage implements OnInit {
  readonly i18n = inject(I18nService);
  private readonly auth = inject(AuthService);
  private readonly dietService = inject(DietService);
  private readonly alertCtrl = inject(AlertController);
  private readonly toastCtrl = inject(ToastController);
  readonly reminders = inject(MealReminderService);
  remindersOpen = signal(false);
  readonly reminderOffsets = [0, 5, 10, 15, 30];
  readonly reminderSounds: { id: ReminderSound; label: string }[] = [
    { id: 'bip', label: 'rem.sound_bip' }, { id: 'sino', label: 'rem.sound_bell' }, { id: 'alarme', label: 'rem.sound_alarm' }
  ];

  diets = signal<Diet[]>([]);
  loading = signal(true);
  expandedDiet = signal<string | null>(null);
  /** Dietas que já foram abertas: o conteúdo fica montado para fechar/abrir com animação */
  renderedDiets = signal<Set<string>>(new Set());
  rendered(id: string) { return this.renderedDiets().has(id) || this.expandedDiet() === id; }

  showDietModal = signal(false);
  showMealModal = signal(false);
  showFoodModal = signal(false);
  showEditFoodModal = signal(false);
  editingFood = signal<MealFood | null>(null);

  dietForm = { name: '', description: '' };
  mealForm = { name: '', mealOrder: 0, mealTime: '' };
  foodForm = { foodName: '', quantityGrams: 100, calories: 0, protein: 0, carbs: 0, fat: 0, measureType: 'grams' as 'grams' | 'unit', servingUnit: 'unidade', servingGrams: 50, servingQuantity: 1, baseCal: 0, baseProt: 0, baseCarb: 0, baseFat: 0 };

  foodSearchQuery = '';
  searchResults = signal<FoodSearchResult[]>([]);
  selectedFood = signal<FoodSearchResult | null>(null);
  searching = signal(false);
  searchPerformed = signal(false);

  activeDiet = signal<Diet | null>(null);
  activeMeal = signal<Meal | null>(null);

  constructor() {
    addIcons({ add, trash, chevronDown, chevronUp, search, nutrition, informationCircle, notifications, notificationsOff, volumeHigh, removeCircleOutline, logoWhatsapp, print });
  }

  ngOnInit() {
    this.loadDiets();
  }

  loadDiets() {
    this.loading.set(true);
    this.dietService.getMyDiets().subscribe({
      next: (diets) => {
        const loadPromises = diets.map(d =>
          new Promise<Diet>(resolve => {
            this.dietService.getDiet(d.id).subscribe({
              next: full => resolve(full),
              error: () => resolve({ ...d, meals: [] })
            });
          })
        );
        Promise.all(loadPromises).then(fullDiets => {
          this.diets.set(fullDiets);
          this.reminders.syncFromDiets(fullDiets);
          this.loading.set(false);
        });
      },
      error: () => {
        this.diets.set([]);
        this.loading.set(false);
      }
    });
  }

  handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    this.loadDiets();
    setTimeout(() => event.detail.complete(), 1200);
  }

  toggleDiet(id: string) {
    const opening = this.expandedDiet() !== id;
    if (opening && !this.renderedDiets().has(id)) {
      // Monta o conteúdo fechado e só abre no próximo quadro, para a altura animar a partir de 0
      this.renderedDiets.update(s => new Set(s).add(id));
      requestAnimationFrame(() => requestAnimationFrame(() => this.expandedDiet.set(id)));
      return;
    }
    this.expandedDiet.set(opening ? id : null);
  }

  // --- Diet ---
  openCreateDiet() {
    this.dietForm = { name: '', description: '' };
    this.showDietModal.set(true);
  }

  saveDiet() {
    if (!this.dietForm.name.trim()) return;
    this.dietService.createDiet({ name: this.dietForm.name, description: this.dietForm.description || undefined }).subscribe({
      next: async () => {
        this.showDietModal.set(false);
        this.loadDiets();
        const toast = await this.toastCtrl.create({ message: this.i18n.t('diet.diet_created'), duration: 1800, color: 'success', position: 'bottom' });
        toast.present();
      },
      error: async () => {
        const toast = await this.toastCtrl.create({ message: this.i18n.t('diet.diet_error'), duration: 2000, color: 'danger', position: 'bottom' });
        toast.present();
      }
    });
  }

  // --- Horário da refeição ---
  editMealTimeById(mealId: string) {
    const meal = this.diets().flatMap(d => d.meals ?? []).find(m => m.id === mealId);
    if (meal) this.editMealTime(meal);
  }

  async editMealTime(meal: Meal) {
    const buttons: any[] = [{ text: this.i18n.t('common.cancel'), role: 'cancel' }];
    if (meal.originalMealTime) {
      buttons.push({
        text: this.i18n.t('diet.back_to', { t: meal.originalMealTime }),
        handler: () => { this.saveMealTime(meal, null); }
      });
    }
    buttons.push({
      text: this.i18n.t('common.save'),
      handler: (data: { time: string }) => {
        if (!/^\d{2}:\d{2}$/.test(data?.time ?? '')) return false; // mantém o alerta aberto
        this.saveMealTime(meal, data.time);
        return true;
      }
    });

    const alert = await this.alertCtrl.create({
      header: meal.name,
      subHeader: meal.originalMealTime ? this.i18n.t('diet.diet_time', { t: meal.originalMealTime }) : this.i18n.t('diet.new_time'),
      inputs: [{ name: 'time', type: 'time', value: meal.mealTime ?? '' }],
      buttons
    });
    await alert.present();
  }

  private saveMealTime(meal: Meal, time: string | null) {
    const req$ = time ? this.dietService.updateMealTime(meal.id, time) : this.dietService.resetMealTime(meal.id);
    req$.subscribe({
      next: async () => {
        this.loadDiets(); // recarrega e reagenda os lembretes
        const toast = await this.toastCtrl.create({
          message: time ? this.i18n.t('diet.time_changed', { t: time }) : this.i18n.t('diet.time_restored'),
          duration: 1800, color: 'success', position: 'bottom'
        });
        toast.present();
      },
      error: async () => {
        const toast = await this.toastCtrl.create({ message: this.i18n.t('diet.time_error'), duration: 2000, color: 'danger', position: 'bottom' });
        toast.present();
      }
    });
  }

  // --- Excluir ---
  /** Só dá para excluir em dietas criadas pelo próprio aluno (as do personal são compartilhadas) */
  canEdit(diet: Diet): boolean {
    const uid = this.auth.currentUser()?.userId;
    return !!uid && diet.createdBy === uid;
  }

  /** Dono da dieta apaga tudo; numa dieta do personal, só o que o próprio aluno adicionou */
  canDeleteItem(diet: Diet, createdBy?: string | null): boolean {
    const uid = this.auth.currentUser()?.userId;
    return this.canEdit(diet) || (!!uid && createdBy === uid);
  }

  /** Dieta própria: apaga de vez. Dieta padrão (do personal): só tira da minha lista. */
  async confirmRemoveDiet(diet: Diet) {
    const own = this.canEdit(diet);
    const alert = await this.alertCtrl.create({
      header: this.i18n.t(own ? 'diet.delete_diet_q' : 'diet.remove_diet_q', { name: diet.name }),
      message: this.i18n.t(own ? 'diet.delete_diet_msg' : 'diet.remove_diet_msg'),
      buttons: [
        { text: this.i18n.t('common.cancel'), role: 'cancel' },
        {
          text: this.i18n.t(own ? 'common.delete' : 'diet.remove_btn'),
          role: 'destructive',
          handler: () => {
            const req$ = own ? this.dietService.deleteDiet(diet.id) : this.dietService.removeDietFromMyList(diet.id);
            this.runDelete(req$, own ? 'diet.diet_deleted' : 'diet.diet_removed');
          }
        }
      ]
    });
    await alert.present();
  }

  async confirmDeleteMeal(meal: Meal) {
    const alert = await this.alertCtrl.create({
      header: this.i18n.t('diet.delete_meal_q', { name: meal.name }),
      message: this.i18n.t('diet.delete_meal_msg'),
      buttons: [
        { text: this.i18n.t('common.cancel'), role: 'cancel' },
        { text: this.i18n.t('common.delete'), role: 'destructive', handler: () => { this.runDelete(this.dietService.deleteMeal(meal.id), 'diet.meal_deleted'); } }
      ]
    });
    await alert.present();
  }

  async confirmDeleteFood(food: MealFood) {
    const alert = await this.alertCtrl.create({
      header: this.i18n.t('diet.delete_food_q', { name: food.foodName }),
      buttons: [
        { text: this.i18n.t('common.cancel'), role: 'cancel' },
        { text: this.i18n.t('common.delete'), role: 'destructive', handler: () => { this.runDelete(this.dietService.deleteFood(food.id), 'diet.food_deleted'); } }
      ]
    });
    await alert.present();
  }

  private runDelete(req$: import('rxjs').Observable<void>, okKey: string) {
    req$.subscribe({
      next: async () => {
        this.loadDiets(); // recarrega e reagenda os lembretes
        const toast = await this.toastCtrl.create({ message: this.i18n.t(okKey), duration: 1800, color: 'success', position: 'bottom' });
        toast.present();
      },
      error: async () => {
        const toast = await this.toastCtrl.create({ message: this.i18n.t('common.delete_error'), duration: 2000, color: 'danger', position: 'bottom' });
        toast.present();
      }
    });
  }

  // --- Meal ---
  openAddMeal(diet: Diet) {
    this.activeDiet.set(diet);
    this.mealForm = { name: '', mealOrder: diet.meals?.length ?? 0, mealTime: '' };
    this.showMealModal.set(true);
  }

  saveMeal() {
    const diet = this.activeDiet();
    if (!diet || !this.mealForm.name.trim() || !this.mealForm.mealTime) return;
    this.dietService.addMeal(diet.id, { name: this.mealForm.name, mealOrder: this.mealForm.mealOrder, mealTime: this.mealForm.mealTime }).subscribe({
      next: () => { this.showMealModal.set(false); this.loadDiets(); },
      error: async () => {
        const toast = await this.toastCtrl.create({ message: this.i18n.t('diet.meal_error'), duration: 2000, color: 'danger', position: 'bottom' });
        toast.present();
      }
    });
  }

  // --- Food ---
  openAddFood(diet: Diet, meal: Meal) {
    this.activeDiet.set(diet);
    this.activeMeal.set(meal);
    this.foodForm = { foodName: '', quantityGrams: 100, calories: 0, protein: 0, carbs: 0, fat: 0, measureType: 'grams', servingUnit: 'unidade', servingGrams: 50, servingQuantity: 1, baseCal: 0, baseProt: 0, baseCarb: 0, baseFat: 0 };
    this.foodSearchQuery = '';
    this.searchResults.set([]);
    this.selectedFood.set(null);
    this.searching.set(false);
    this.searchPerformed.set(false);
    this.showFoodModal.set(true);
  }

  searchFood() {
    if (!this.foodSearchQuery.trim()) return;
    this.searching.set(true);
    this.searchResults.set([]);
    this.searchPerformed.set(false);
    this.dietService.searchFood(this.foodSearchQuery).subscribe({
      next: (results) => { this.searchResults.set(results); this.searching.set(false); this.searchPerformed.set(true); },
      error: () => { this.searching.set(false); this.searchPerformed.set(true); }
    });
  }

  selectFood(food: FoodSearchResult) {
    this.selectedFood.set(food);
    this.foodForm.foodName = food.name;
    this.recalcMacros();
  }

  recalcMacros() {
    const searchFood = this.selectedFood();
    const base = searchFood
      ? { cal: searchFood.calories, prot: searchFood.protein, carb: searchFood.carbs, fat: searchFood.fat }
      : { cal: this.foodForm.baseCal, prot: this.foodForm.baseProt, carb: this.foodForm.baseCarb, fat: this.foodForm.baseFat };
    if (!base.cal && !base.prot && !base.carb && !base.fat) return;
    const grams = this.foodForm.measureType === 'unit'
      ? (Number(this.foodForm.servingQuantity) || 0) * (Number(this.foodForm.servingGrams) || 0)
      : Number(this.foodForm.quantityGrams) || 0;
    if (grams <= 0) return;
    this.foodForm.calories = parseFloat((base.cal * grams / 100).toFixed(2));
    this.foodForm.protein = parseFloat((base.prot * grams / 100).toFixed(2));
    this.foodForm.carbs = parseFloat((base.carb * grams / 100).toFixed(2));
    this.foodForm.fat = parseFloat((base.fat * grams / 100).toFixed(2));
    if (this.foodForm.measureType === 'unit') {
      this.foodForm.quantityGrams = grams;
    }
  }

  onMeasureTypeChange() {
    if (this.foodForm.measureType === 'unit') {
      this.foodForm.quantityGrams = this.foodForm.servingQuantity * this.foodForm.servingGrams;
    }
    this.recalcMacros();
  }

  onServingChange() {
    this.foodForm.quantityGrams = this.foodForm.servingQuantity * this.foodForm.servingGrams;
    this.recalcMacros();
  }

  /** Texto da dieta formatado para WhatsApp (*negrito* e listas) */
  private buildShareText(diet: Diet): string {
    const t = (k: string) => this.i18n.t(k).replace(/:$/, '');
    const num = (n: number, d = 0) => n.toLocaleString(this.i18n.locale(), { maximumFractionDigits: d });
    const lines: string[] = [`*${diet.name}*`];
    if (diet.description) lines.push(diet.description);

    for (const meal of diet.meals ?? []) {
      const m = this.getMealTotals(meal);
      lines.push('', `*${meal.name}${meal.mealTime ? ` (${meal.mealTime})` : ''}* — ${num(m.calories)} kcal`);
      for (const f of meal.foods ?? []) {
        lines.push(`• ${f.foodName} — ${this.getFoodQtyDisplay(f)} · ${num(f.calories)} kcal`);
      }
    }

    const tot = this.getDietTotals(diet);
    lines.push('', `*${t('diet.total')}* ${num(tot.calories)} kcal`,
      `${t('diet.prot')} ${num(tot.protein, 1)}g · ${t('diet.carb')} ${num(tot.carbs, 1)}g · ${t('diet.fat')} ${num(tot.fat, 1)}g`,
      '', '_FitMob_');
    return lines.join('\n');
  }

  shareWhatsApp(diet: Diet) {
    const url = `https://wa.me/?text=${encodeURIComponent(this.buildShareText(diet))}`;
    window.open(url, '_blank', 'noopener');
  }

  printDiet(diet: Diet) {
    const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
    const num = (n: number, d = 0) => n.toLocaleString(this.i18n.locale(), { maximumFractionDigits: d });
    const t = (k: string) => esc(this.i18n.t(k));
    const tot = this.getDietTotals(diet);

    const meals = (diet.meals ?? []).map(meal => {
      const m = this.getMealTotals(meal);
      const rows = (meal.foods ?? []).map(f =>
        `<tr><td>${esc(f.foodName)}</td><td>${esc(this.getFoodQtyDisplay(f))}</td><td>${num(f.protein, 1)}g</td><td>${num(f.carbs, 1)}g</td><td>${num(f.fat, 1)}g</td><td>${num(f.calories)} kcal</td></tr>`).join('');
      return `<h2>${esc(meal.name)}${meal.mealTime ? ` <small>${esc(meal.mealTime)}</small>` : ''}<span>${num(m.calories)} kcal</span></h2>
        <table><thead><tr><th>${t('diet.food_btn')}</th><th>Qtd</th><th>P</th><th>C</th><th>G</th><th>kcal</th></tr></thead><tbody>${rows}</tbody></table>`;
    }).join('');

    const html = `<!doctype html><html lang="${this.i18n.lang()}"><head><meta charset="utf-8"><title>${esc(diet.name)}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #111; margin: 24px; }
        h1 { margin: 0 0 4px; } .desc { color: #555; margin: 0 0 18px; }
        h2 { display: flex; justify-content: space-between; font-size: 16px; margin: 20px 0 6px; padding-bottom: 4px; border-bottom: 2px solid #e94560; }
        h2 small { font-weight: normal; color: #666; margin-left: 6px; } h2 span { color: #e94560; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { text-align: left; padding: 5px 6px; border-bottom: 1px solid #ddd; } th { color: #666; font-size: 11px; text-transform: uppercase; }
        .total { margin-top: 22px; padding: 10px 12px; background: #f4f4f6; border-radius: 6px; font-weight: bold; }
        .foot { margin-top: 24px; color: #999; font-size: 11px; }
      </style></head><body>
      <h1>${esc(diet.name)}</h1>${diet.description ? `<p class="desc">${esc(diet.description)}</p>` : ''}
      ${meals}
      <div class="total">${t('diet.total')} ${num(tot.calories)} kcal · ${t('diet.prot')} ${num(tot.protein, 1)}g · ${t('diet.carb')} ${num(tot.carbs, 1)}g · ${t('diet.fat')} ${num(tot.fat, 1)}g</div>
      <p class="foot">FitMob</p></body></html>`;

    // iframe oculto: imprime sem abrir popup (que o navegador costuma bloquear)
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(frame);
    const doc = frame.contentDocument!;
    doc.open(); doc.write(html); doc.close();
    const cleanup = () => setTimeout(() => frame.remove(), 1000);
    frame.contentWindow!.onafterprint = cleanup;
    setTimeout(() => { frame.contentWindow!.focus(); frame.contentWindow!.print(); cleanup(); }, 250);
  }

  getFoodQtyDisplay(food: { quantityGrams: number; servingUnit?: string; servingGrams?: number }): string {
    if (food.servingUnit && food.servingGrams && food.servingGrams > 0) {
      const qty = Math.round((food.quantityGrams / food.servingGrams) * 10) / 10;
      return `${qty} ${food.servingUnit} (${food.quantityGrams}g)`;
    }
    return `${food.quantityGrams}g`;
  }

  saveFood() {
    const meal = this.activeMeal();
    if (!meal || !this.foodForm.foodName.trim()) return;
    const isUnit = this.foodForm.measureType === 'unit';
    this.dietService.addFood(meal.id, {
      foodName: this.foodForm.foodName,
      quantityGrams: this.foodForm.quantityGrams,
      calories: this.foodForm.calories,
      protein: this.foodForm.protein,
      carbs: this.foodForm.carbs,
      fat: this.foodForm.fat,
      openFoodFactsId: this.selectedFood()?.code,
      servingUnit: isUnit ? this.foodForm.servingUnit : undefined,
      servingGrams: isUnit ? this.foodForm.servingGrams : undefined
    }).subscribe({
      next: () => { this.showFoodModal.set(false); this.loadDiets(); },
      error: async () => {
        const toast = await this.toastCtrl.create({ message: this.i18n.t('diet.food_error'), duration: 2000, color: 'danger', position: 'bottom' });
        toast.present();
      }
    });
  }

  // --- Edit Food ---
  openEditFood(food: MealFood, meal: Meal) {
    this.editingFood.set(food);
    this.activeMeal.set(meal);
    this.selectedFood.set(null);
    const hasUnit = !!food.servingUnit && !!food.servingGrams;
    const servingGrams = food.servingGrams ?? 50;
    const servingQty = hasUnit ? Math.round((food.quantityGrams / servingGrams) * 10) / 10 : 1;
    const qty = food.quantityGrams || 100;
    this.foodForm = {
      foodName: food.foodName,
      quantityGrams: food.quantityGrams,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      measureType: hasUnit ? 'unit' : 'grams',
      servingUnit: food.servingUnit ?? 'unidade',
      servingGrams,
      servingQuantity: servingQty,
      baseCal: parseFloat(((food.calories / qty) * 100).toFixed(4)),
      baseProt: parseFloat(((food.protein / qty) * 100).toFixed(4)),
      baseCarb: parseFloat(((food.carbs / qty) * 100).toFixed(4)),
      baseFat: parseFloat(((food.fat / qty) * 100).toFixed(4)),
    };
    this.showEditFoodModal.set(true);
  }

  saveEditFood() {
    const food = this.editingFood();
    const meal = this.activeMeal();
    if (!food || !meal || !this.foodForm.foodName.trim()) return;
    const isUnit = this.foodForm.measureType === 'unit';
    this.dietService.updateFood(food.id, {
      mealId: meal.id,
      foodName: this.foodForm.foodName,
      quantityGrams: this.foodForm.quantityGrams,
      calories: this.foodForm.calories,
      protein: this.foodForm.protein,
      carbs: this.foodForm.carbs,
      fat: this.foodForm.fat,
      servingUnit: isUnit ? this.foodForm.servingUnit : undefined,
      servingGrams: isUnit ? this.foodForm.servingGrams : undefined
    }).subscribe({
      next: () => { this.showEditFoodModal.set(false); this.editingFood.set(null); this.loadDiets(); },
      error: async () => {
        const toast = await this.toastCtrl.create({ message: this.i18n.t('diet.food_edit_error'), duration: 2000, color: 'danger', position: 'bottom' });
        toast.present();
      }
    });
  }

  // --- Totals ---
  getMealTotals(meal: Meal) {
    const foods = meal.foods ?? [];
    return {
      calories: foods.reduce((s, f) => s + (f.calories || 0), 0),
      protein: foods.reduce((s, f) => s + (f.protein || 0), 0),
      carbs: foods.reduce((s, f) => s + (f.carbs || 0), 0),
      fat: foods.reduce((s, f) => s + (f.fat || 0), 0),
    };
  }

  mealCount(diet: Diet): number {
    return (diet.meals ?? []).length;
  }

  getDietTotals(diet: Diet) {
    const meals = diet.meals ?? [];
    return {
      calories: meals.reduce((s, m) => s + this.getMealTotals(m).calories, 0),
      protein: meals.reduce((s, m) => s + this.getMealTotals(m).protein, 0),
      carbs: meals.reduce((s, m) => s + this.getMealTotals(m).carbs, 0),
      fat: meals.reduce((s, m) => s + this.getMealTotals(m).fat, 0),
    };
  }
}
