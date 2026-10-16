import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
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
  IonSkeletonText,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
  IonModal,
  IonSearchbar,
  IonSpinner,
  IonFab,
  IonFabButton,
  ActionSheetController,
  RefresherEventDetail
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronForward, chevronDown, informationCircle, add,
  trashOutline, removeCircleOutline, checkmarkCircle, ellipseOutline,
  checkmarkOutline, shareSocial, createOutline
} from 'ionicons/icons';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { WorkoutAssignmentService } from '../../core/services/workout-assignment.service';
import { WorkoutShareService } from '../../core/services/workout-share.service';
import { WorkoutPlan, Workout, WorkoutExercise, Exercise, WorkoutLog, AssignedWorkout } from '../../core/models';
import { forkJoin } from 'rxjs';

interface SelectedExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroupName?: string;
  sets: number;
  reps: string;
  restSeconds: number;
}

interface DayOccurrence {
  dateStr: string;
  label: string;
  done: boolean;
  skipped: boolean;
  skipReason?: string | null;
  logId?: string;
  isToday: boolean;
}

const DAY_NAMES: Record<number, string> = {
  0: 'Domingo', 1: 'Segunda', 2: 'Terça',
  3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado'
};

const DAY_SHORT: Record<number, string> = {
  0: 'Dom', 1: 'Seg', 2: 'Ter',
  3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb'
};

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-treinos',
  standalone: true,
  imports: [
    TPipe,
    ProfileButtonComponent,
    PageTitleComponent,
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonSkeletonText, IonRefresher, IonRefresherContent, IonIcon,
    IonModal, IonSearchbar, IonSpinner, IonFab, IonFabButton
  ],
  styles: [`

    .section-header {
      padding: 20px 20px 8px;
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
    .fab-label {
      font-size: 0.82rem;
      font-weight: 700;
      color: #fff;
      white-space: nowrap;
    }
    ion-fab-button {
      --background: var(--ft-accent);
      --background-activated: var(--ft-accent);
      --box-shadow: 0 4px 16px rgba(var(--ft-accent-rgb, 232,65,91), 0.45);
    }
    .plan-count-badge {
      background: var(--ft-accent-soft);
      color: var(--ft-accent);
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 20px;
    }

    /* ---- Modality chips (horizontal scroll) ---- */
    .modality-scroll {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding: 0 16px 4px;
      scrollbar-width: none;
    }
    .modality-scroll::-webkit-scrollbar { display: none; }
    .modality-pill {
      flex-shrink: 0;
      padding: 7px 16px;
      border-radius: 20px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      border: 1.5px solid var(--ft-border);
      background: var(--ft-surface);
      color: var(--ft-text-muted);
      white-space: nowrap;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .modality-pill.active {
      background: var(--ft-accent);
      color: #fff;
      border-color: var(--ft-accent);
    }

    /* Modality expanded detail */
    .modality-detail {
      margin: 8px 16px 4px;
      background: var(--ft-surface);
      border: 1px solid var(--ft-accent);
      border-radius: var(--ft-radius-lg);
      overflow: hidden;
    }
    .modality-detail-header {
      padding: 12px 16px 8px;
      border-bottom: 1px solid var(--ft-border);
    }
    .modality-detail-title { font-size: 0.9rem; font-weight: 700; color: var(--ft-text); }
    .modality-detail-desc { font-size: 0.78rem; color: var(--ft-text-muted); margin-top: 3px; }

    ion-card {
      --background: var(--ft-surface);
      border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius-lg);
      margin: 10px 16px;
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
    .personal-card::before { background: linear-gradient(180deg, var(--ft-success, #22c55e), var(--ft-accent)); }

    ion-card-header { padding: 16px 18px 4px; }
    ion-card-title { font-size: 1rem; font-weight: 700; color: var(--ft-text); }
    ion-card-subtitle {
      font-size: 0.8rem; font-weight: 400; text-transform: none;
      letter-spacing: 0; color: var(--ft-text-muted); margin-top: 2px;
    }
    ion-card-content { padding: 10px 18px 16px; }

    .personal-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px 8px;
    }
    .personal-card-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--ft-text);
    }
    .delete-plan-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px 8px;
      color: var(--ion-color-danger);
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      border-radius: 8px;
      -webkit-tap-highlight-color: transparent;
    }

    .workout-list { display: flex; flex-direction: column; gap: 8px; }
    .workout-block { display: flex; flex-direction: column; gap: 6px; }
    .workout-item {
      background: var(--ft-bg-elevated);
      border-radius: var(--ft-radius);
      padding: 11px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid var(--ft-border);
      cursor: pointer;
      touch-action: pan-y;
    }
    .workout-item-info { display: flex; flex-direction: column; gap: 4px; }
    .workout-name { font-size: 0.9rem; font-weight: 600; color: var(--ft-text); }
    .workout-day {
      align-self: flex-start;
      font-size: 0.68rem; font-weight: 600; color: var(--ft-accent);
      background: var(--ft-accent-soft); padding: 2px 8px; border-radius: 6px;
    }
    .workout-item ion-icon { color: var(--ft-text-faint); font-size: 1rem; }

    .exercise-rows { display: flex; flex-direction: column; gap: 5px; padding: 0 4px 4px; }
    .exercise-row {
      display: flex; justify-content: space-between; align-items: center;
      gap: 10px; padding: 9px 12px; border-radius: var(--ft-radius);
      background: var(--ft-surface); border: 1px solid var(--ft-border);
    }
    .exercise-row-name { font-size: 0.86rem; font-weight: 600; color: var(--ft-text); }
    .exercise-row-muscle { font-size: 0.68rem; color: var(--ft-text-faint); }
    .exercise-row-meta { font-size: 0.74rem; font-weight: 700; color: var(--ft-accent); white-space: nowrap; text-align: right; }
    button.ex-editable { width: 100%; text-align: left; cursor: pointer; font-family: inherit; color: inherit; }
    button.ex-editable:active { border-color: var(--ft-accent); }
    .ex-pencil { margin-left: 6px; color: var(--ft-text-faint); font-weight: 400; }
    .ex-editing { flex-direction: column; align-items: stretch; border-color: var(--ft-accent); }
    .ex-edit-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
    .ex-weights-head { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
    .ex-weights-head > span { font-size: 0.64rem; font-weight: 700; color: var(--ft-text-faint); text-transform: uppercase; letter-spacing: 0.04em; }
    .ex-copy { background: none; border: none; color: var(--ft-accent); font-size: 0.72rem; font-weight: 700; cursor: pointer; padding: 2px 0; font-family: inherit; }
    .ex-weights { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 6px; }
    .ex-weights label { display: flex; flex-direction: column; gap: 4px; }
    .ex-weights span { font-size: 0.64rem; font-weight: 600; color: var(--ft-text-faint); }
    .ex-weights input {
      width: 100%; min-width: 0; box-sizing: border-box; height: 36px; padding: 0 8px;
      background: var(--ft-bg-elevated); border: 1px solid var(--ft-border-strong); border-radius: 8px;
      color: var(--ft-text); font-size: 0.9rem; font-weight: 700; font-family: inherit;
    }
    .ex-weights input:focus { outline: none; border-color: var(--ft-accent); }
    .ex-edit-grid label { display: flex; flex-direction: column; gap: 4px; }
    .ex-edit-grid span { font-size: 0.64rem; font-weight: 700; color: var(--ft-text-faint); text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
    .ex-edit-grid input {
      width: 100%; min-width: 0; box-sizing: border-box; height: 36px; padding: 0 8px;
      background: var(--ft-bg-elevated); border: 1px solid var(--ft-border-strong); border-radius: 8px;
      color: var(--ft-text); font-size: 0.9rem; font-weight: 700; font-family: inherit;
    }
    .ex-edit-grid input:focus { outline: none; border-color: var(--ft-accent); }
    .ex-edit-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px; }
    .ex-edit-actions button { border: none; border-radius: 8px; padding: 7px 14px; font-size: 0.8rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .ex-cancel { background: transparent; color: var(--ft-text-muted); }
    .ex-save { background: var(--ft-accent); color: #fff; }
    .ex-save:disabled { opacity: 0.6; }

    .plan-empty { color: var(--ft-text-faint); font-size: 0.83rem; margin: 0; }

    .skeleton-card {
      background: var(--ft-surface); border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius-lg); margin: 10px 16px; padding: 18px;
    }

    /* ---- Log button ---- */
    .workout-item-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .log-btn {
      border: none;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 4px 10px;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s, color 0.15s;
    }
    .log-btn.not-logged {
      background: var(--ft-accent-soft);
      color: var(--ft-accent);
    }
    .log-btn.logged {
      background: rgba(34,197,94,0.15);
      color: #22c55e;
    }
    .log-btn.skipped {
      background: rgba(148,163,184,0.15);
      color: var(--ft-text-muted);
    }
    .skip-btn {
      background: transparent;
      border: 1px solid var(--ft-border-strong);
      color: var(--ft-text-muted);
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 4px 10px;
      cursor: pointer;
      white-space: nowrap;
    }

    /* ---- History dots ---- */
    .history-strip {
      display: flex;
      gap: 6px;
      padding: 8px 4px 4px;
      align-items: flex-end;
    }
    .history-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      flex: 1;
    }
    .h-dot {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      border: 2px solid transparent;
    }
    .h-dot.done {
      background: rgba(34,197,94,0.18);
      border-color: #22c55e;
      color: #22c55e;
    }
    .h-dot.missed {
      background: rgba(239,68,68,0.1);
      border-color: rgba(239,68,68,0.35);
      color: rgba(239,68,68,0.6);
    }
    .h-dot.today-done {
      background: rgba(34,197,94,0.25);
      border-color: #22c55e;
      color: #22c55e;
      box-shadow: 0 0 0 3px rgba(34,197,94,0.2);
    }
    .h-dot.skipped {
      background: rgba(148,163,184,0.12);
      border-color: rgba(148,163,184,0.45);
      color: var(--ft-text-muted);
      border-style: dashed;
    }
    .h-dot.today-missed {
      background: var(--ft-accent-soft);
      border-color: var(--ft-accent);
      color: var(--ft-accent);
    }
    .h-label {
      font-size: 0.6rem;
      font-weight: 600;
      color: var(--ft-text-faint);
      white-space: nowrap;
    }
    .h-label.today { color: var(--ft-accent); font-weight: 700; }

    /* ---- Confirm delete modal ---- */
    .confirm-wrap {
      padding: 28px 24px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: var(--ft-surface);
      height: 100%;
    }
    .confirm-icon {
      font-size: 2.4rem;
      text-align: center;
    }
    .confirm-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--ft-text);
      text-align: center;
    }
    .confirm-desc {
      font-size: 0.85rem;
      color: var(--ft-text-muted);
      text-align: center;
      line-height: 1.5;
    }
    .confirm-name-highlight {
      font-weight: 700;
      color: var(--ft-text);
    }
    .confirm-input-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--ft-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      text-align: center;
    }
    .confirm-input {
      background: var(--ft-bg-elevated);
      border: 2px solid var(--ft-border);
      border-radius: var(--ft-radius);
      padding: 12px 14px;
      font-size: 0.95rem;
      color: var(--ft-text);
      outline: none;
      width: 100%;
      box-sizing: border-box;
      text-align: center;
      transition: border-color 0.15s;
    }
    .confirm-input:focus { border-color: var(--ion-color-danger); }
    .confirm-input.match { border-color: var(--ion-color-danger); background: rgba(239,68,68,0.06); }
    .confirm-btns {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 4px;
    }
    .confirm-delete-btn {
      background: var(--ion-color-danger);
      color: #fff;
      border: none;
      border-radius: var(--ft-radius);
      padding: 14px;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      width: 100%;
      transition: opacity 0.15s;
    }
    .confirm-delete-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .confirm-cancel-btn {
      background: none;
      color: var(--ft-text-muted);
      border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius);
      padding: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
    }

    /* ---- Create modal ---- */
    .modal-header-bar {
      padding: 16px 20px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-header-bar h2 { margin: 0; font-size: 1.05rem; font-weight: 700; color: var(--ft-text); }
    .modal-close-btn {
      background: none; border: none; cursor: pointer;
      color: var(--ft-text-muted); font-size: 1.4rem; line-height: 1;
    }
    .modal-body { padding: 16px 20px 24px; display: flex; flex-direction: column; gap: 16px; }

    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.78rem; font-weight: 700; color: var(--ft-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .form-input {
      background: var(--ft-bg-elevated); border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius); padding: 10px 14px;
      font-size: 0.95rem; color: var(--ft-text); outline: none;
      width: 100%; box-sizing: border-box;
    }
    .form-input:focus { border-color: var(--ft-accent); }
    .form-select {
      background: var(--ft-bg-elevated); border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius); padding: 10px 14px;
      font-size: 0.95rem; color: var(--ft-text); outline: none;
      width: 100%; box-sizing: border-box; appearance: none;
    }

    .exercise-search-section { display: flex; flex-direction: column; gap: 6px; }
    .section-label { font-size: 0.78rem; font-weight: 700; color: var(--ft-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

    /* ---- Muscle group filter chips ---- */
    .muscle-chips {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 2px;
      scrollbar-width: none;
    }
    .muscle-chips::-webkit-scrollbar { display: none; }
    .muscle-chip {
      flex-shrink: 0;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      border: 1.5px solid var(--ft-border);
      background: var(--ft-bg-elevated);
      color: var(--ft-text-muted);
      white-space: nowrap;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .muscle-chip.active {
      background: var(--ft-accent);
      color: #fff;
      border-color: var(--ft-accent);
    }

    .exercise-pick-list {
      max-height: 200px; overflow-y: auto;
      border: 1px solid var(--ft-border); border-radius: var(--ft-radius);
      background: var(--ft-bg-elevated);
    }
    .exercise-pick-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 14px; cursor: pointer; touch-action: pan-y;
      border-bottom: 1px solid var(--ft-border);
    }
    .exercise-pick-item:last-child { border-bottom: none; }
    .exercise-pick-item.selected { background: var(--ft-accent-soft); }
    .pick-name { font-size: 0.88rem; font-weight: 600; color: var(--ft-text); }
    .pick-muscle { font-size: 0.7rem; color: var(--ft-text-faint); }
    .pick-icon { font-size: 1.1rem; }
    .pick-icon.on { color: var(--ft-accent); }
    .pick-icon.off { color: var(--ft-text-faint); }

    .selected-exercises-section { display: flex; flex-direction: column; gap: 8px; }
    .sel-ex-card {
      background: var(--ft-bg-elevated); border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius); padding: 10px 12px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .sel-ex-header { display: flex; align-items: center; justify-content: space-between; }
    .sel-ex-name { font-size: 0.88rem; font-weight: 700; color: var(--ft-text); }
    .sel-ex-remove {
      background: none; border: none; cursor: pointer;
      color: var(--ion-color-danger); font-size: 1rem; padding: 2px;
    }
    .sel-ex-inputs { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
    .mini-input-wrap { display: flex; flex-direction: column; gap: 3px; }
    .mini-label { font-size: 0.66rem; font-weight: 700; color: var(--ft-text-faint); text-transform: uppercase; }
    .mini-input {
      background: var(--ft-surface); border: 1px solid var(--ft-border);
      border-radius: 6px; padding: 6px 8px; font-size: 0.85rem;
      color: var(--ft-text); outline: none; width: 100%; box-sizing: border-box; text-align: center;
    }
    .mini-input:focus { border-color: var(--ft-accent); }

    .save-btn {
      background: var(--ft-accent); color: #fff; border: none;
      border-radius: var(--ft-radius); padding: 14px;
      font-size: 0.95rem; font-weight: 700; cursor: pointer;
      width: 100%; margin-top: 4px; display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    /* ---- Session modal ---- */
    .session-wrap {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: var(--ft-bg, #0f1117);
    }
    .session-header {
      padding: 20px 20px 16px;
      background: var(--ft-surface);
      border-bottom: 1px solid var(--ft-border);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .session-top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .session-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--ft-text);
    }
    .session-close-btn {
      background: none;
      border: none;
      color: var(--ft-text-muted);
      font-size: 1.4rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }
    .session-timer {
      font-size: 2rem;
      font-weight: 700;
      color: var(--ft-accent);
      font-variant-numeric: tabular-nums;
      letter-spacing: 2px;
    }
    .session-progress-bar {
      height: 4px;
      background: var(--ft-border);
      border-radius: 2px;
      overflow: hidden;
    }
    .session-progress-fill {
      height: 100%;
      background: var(--ft-accent);
      border-radius: 2px;
      transition: width 0.3s;
    }
    .session-progress-label {
      font-size: 0.72rem;
      color: var(--ft-text-faint);
    }

    .session-body {
      flex: 1;
      overflow-y: auto;
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .session-exercise-card {
      background: var(--ft-surface);
      border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius-lg);
      overflow: hidden;
      transition: border-color 0.2s;
      /* Sem isso o flex espreme os cards para caber na tela e corta as últimas séries */
      flex-shrink: 0;
    }
    .session-exercise-card.all-done {
      border-color: #22c55e;
    }
    .session-ex-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px 10px;
      border-bottom: 1px solid var(--ft-border);
    }
    .session-ex-name {
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--ft-text);
    }
    .session-ex-muscle {
      font-size: 0.72rem;
      color: var(--ft-text-faint);
      margin-top: 2px;
    }
    .session-ex-done-badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 20px;
      background: rgba(34,197,94,0.15);
      color: #22c55e;
      white-space: nowrap;
    }

    .session-sets {
      padding: 8px 12px 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .session-set-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: var(--ft-radius);
      background: var(--ft-bg-elevated);
      border: 1.5px solid var(--ft-border);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .session-set-row.done {
      background: rgba(34,197,94,0.08);
      border-color: rgba(34,197,94,0.4);
    }
    .set-circle {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid var(--ft-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--ft-text-faint);
      flex-shrink: 0;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    .session-set-row.done .set-circle {
      background: #22c55e;
      border-color: #22c55e;
      color: #fff;
    }
    .set-info {
      flex: 1;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--ft-text);
    }
    .set-info.done { color: var(--ft-text-muted); }
    .set-last { display: block; font-size: 0.68rem; font-weight: 500; color: var(--ft-text-faint); margin-top: 1px; }
    .set-inputs { display: flex; gap: 6px; flex-shrink: 0; }
    .set-field {
      display: flex; align-items: center; gap: 3px;
      background: var(--ft-surface); border: 1px solid var(--ft-border-strong);
      border-radius: 8px; padding: 0 6px; height: 34px; cursor: text;
    }
    .set-field:focus-within { border-color: var(--ft-accent); }
    .set-field input {
      width: 40px; border: none; outline: none; background: transparent;
      color: var(--ft-text); font-size: 0.9rem; font-weight: 700; text-align: right;
      font-family: inherit; -moz-appearance: textfield;
    }
    .set-field.reps input { width: 26px; }
    .set-field input::-webkit-outer-spin-button,
    .set-field input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    .set-field span { font-size: 0.66rem; color: var(--ft-text-faint); font-weight: 600; }
    .session-set-row.done .set-field { border-color: rgba(34,197,94,0.45); }
    .set-reps {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--ft-accent);
    }
    .session-set-row.done .set-reps { color: #22c55e; }

    .session-footer {
      padding: 16px;
      border-top: 1px solid var(--ft-border);
      background: var(--ft-surface);
    }
    .done-wrap {
      height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 10px; padding: 32px 24px; text-align: center; background: var(--ft-bg);
    }
    .done-check {
      width: 84px; height: 84px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 2.6rem; font-weight: 800; color: #fff; background: #22c55e; margin-bottom: 8px;
      box-shadow: 0 0 0 10px rgba(34, 197, 94, 0.15);
      animation: done-pop 0.35s ease-out;
    }
    .done-check.error { background: var(--ft-accent); box-shadow: 0 0 0 10px rgba(var(--ft-accent-rgb), 0.15); }
    @keyframes done-pop { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .done-title { font-size: 1.4rem; font-weight: 800; color: var(--ft-text); }
    .done-sub { font-size: 0.9rem; color: var(--ft-text-muted); }
    .done-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 14px 0 10px; width: 100%; max-width: 320px; }
    .kcal-stat { font-family: inherit; cursor: pointer; text-align: left; border-color: rgba(249, 115, 22, 0.45) !important; background: rgba(249, 115, 22, 0.1) !important; }
    .kcal-stat.manual { border-style: dashed !important; }
    .kcal-pen { font-size: 0.85rem; color: var(--ft-text-faint); vertical-align: middle; }
    .kcal-note { max-width: 320px; margin: 0 0 18px; font-size: 0.72rem; line-height: 1.4; color: var(--ft-text-faint); text-align: center; }
    .kcal-edit { width: 100%; max-width: 320px; margin: 0 0 18px; text-align: left; }
    .kcal-edit label { display: block; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ft-text-muted); margin-bottom: 6px; }
    .kcal-edit-row { display: flex; gap: 8px; }
    .kcal-edit-row input {
      flex: 1; min-width: 0; height: 44px; padding: 0 12px; border-radius: var(--ft-radius); font: inherit; font-size: 1rem; font-weight: 700;
      background: var(--ft-bg-elevated); color: var(--ft-text); border: 1px solid var(--ft-accent);
    }
    .kcal-ok { height: 44px; padding: 0 16px; border: 0; border-radius: var(--ft-radius); background: var(--ft-accent); color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
    .done-stat {
      min-width: 110px; padding: 12px 14px; border-radius: var(--ft-radius);
      background: var(--ft-bg-elevated); border: 1px solid var(--ft-border, rgba(255,255,255,0.08));
      font-size: 0.72rem; color: var(--ft-text-muted); text-transform: uppercase; letter-spacing: 0.05em;
    }
    .done-stat span { display: block; font-size: 1.3rem; font-weight: 800; color: var(--ft-text); text-transform: none; letter-spacing: 0; margin-bottom: 2px; }
    .done-wrap .finish-btn { max-width: 320px; }
    .share-btn { gap: 10px; }
    .share-btn ion-icon { font-size: 1.2rem; }
    .share-btn ion-spinner { width: 20px; height: 20px; color: #fff; }
    .share-msg { font-size: 0.8rem; color: var(--ft-text-muted); text-align: center; max-width: 300px; }
    .done-link { background: none; border: none; color: var(--ft-text-muted); font-size: 0.85rem; padding: 10px; cursor: pointer; }

    .finish-btn {
      width: 100%;
      padding: 15px;
      background: var(--ft-accent);
      color: #fff;
      border: none;
      border-radius: var(--ft-radius);
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .finish-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ---- Delete workout button ---- */
    .workout-delete-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px 6px;
      color: var(--ion-color-danger);
      font-size: 1rem;
      display: flex;
      align-items: center;
      opacity: 0.7;
      -webkit-tap-highlight-color: transparent;
    }
    .workout-delete-btn:active { opacity: 1; }

    /* ---- Iniciar button on workout ---- */
    .iniciar-btn {
      background: none;
      border: 1.5px solid var(--ft-accent);
      border-radius: 20px;
      color: var(--ft-accent);
      font-size: 0.72rem;
      font-weight: 700;
      padding: 4px 11px;
      cursor: pointer;
      white-space: nowrap;
    }

    /* ---- Modality picker inside modal ---- */
    .modality-chips-modal {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .mod-chip {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      border: 1.5px solid var(--ft-border);
      background: var(--ft-bg-elevated);
      color: var(--ft-text-muted);
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .mod-chip.active {
      background: var(--ft-accent);
      color: #fff;
      border-color: var(--ft-accent);
    }

    .empty-list {
      text-align: center; padding: 16px;
      color: var(--ft-text-faint); font-size: 0.85rem;
    }

    /* ---- Personal assigned workouts ---- */
    .personal-section-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: linear-gradient(90deg, #6366f1, #a855f7);
      color: #fff;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 2px 10px;
      border-radius: 20px;
    }
    .assigned-card {
      margin: 4px 16px 6px;
      background: var(--ft-surface);
      border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius-lg);
      overflow: hidden;
      position: relative;
    }
    .assigned-card::before {
      content: '';
      position: absolute;
      inset: 0 auto 0 0;
      width: 3px;
      background: linear-gradient(180deg, #6366f1, #a855f7);
    }
    .assigned-workout-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--ft-border);
      gap: 10px;
    }
    .assigned-workout-item:last-child { border-bottom: none; }
    .assigned-info { flex: 1; min-width: 0; }
    .assigned-name { font-size: 0.9rem; font-weight: 700; color: var(--ft-text); }
    .assigned-plan { font-size: 0.72rem; color: var(--ft-text-muted); margin-top: 2px; }
    .assigned-day {
      font-size: 0.65rem; font-weight: 700; color: #a855f7;
      background: rgba(168,85,247,0.12); padding: 2px 8px; border-radius: 6px;
      margin-top: 4px; display: inline-block;
    }
    .assigned-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .iniciar-btn-purple {
      background: none;
      border: 1.5px solid #a855f7;
      border-radius: 20px;
      color: #a855f7;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 4px 11px;
      cursor: pointer;
      white-space: nowrap;
    }
  `],
  template: `
    <ion-header [translucent]="false">
      <ion-toolbar>
        <ion-title><app-page-title [title]="'workouts.title' | t"></app-page-title></ion-title>
        <app-profile-button slot="end"></app-profile-button>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true" [scrollY]="true">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (loading()) {
        @for (i of [1,2,3]; track i) {
          <div class="skeleton-card">
            <ion-skeleton-text [animated]="true" style="width: 60%; height: 18px; margin-bottom: 8px;"></ion-skeleton-text>
            <ion-skeleton-text [animated]="true" style="width: 80%; height: 14px; margin-bottom: 16px;"></ion-skeleton-text>
            <ion-skeleton-text [animated]="true" style="width: 100%; height: 44px;"></ion-skeleton-text>
          </div>
        }
      } @else {

        <!-- Admin plans as horizontal chips -->
        @if (adminPlansWithWorkouts().length > 0) {
          <div class="section-header">
            <h2>{{ 'workouts.modalities' | t }}</h2>
          </div>
          <div class="modality-scroll">
            @for (plan of adminPlansWithWorkouts(); track plan.id) {
              <button class="modality-pill" [class.active]="expandedPlanId() === plan.id"
                (click)="togglePlan(plan.id)">
                {{ plan.name }}
              </button>
            }
          </div>

          <!-- Expanded modality detail -->
          @if (expandedPlanId()) {
            @for (plan of adminPlansWithWorkouts(); track plan.id) {
              @if (plan.id === expandedPlanId()) {
                <div class="modality-detail">
                  <div class="modality-detail-header">
                    <div class="modality-detail-title">{{ plan.name }}</div>
                    @if (plan.description) {
                      <div class="modality-detail-desc">{{ plan.description }}</div>
                    }
                  </div>
                  @if (getWorkoutsForPlan(plan.id).length === 0) {
                    <p class="plan-empty" style="padding: 14px 16px;">{{ 'workouts.no_workout_in_plan' | t }}</p>
                  } @else {
                    <div style="padding: 10px 12px; display: flex; flex-direction: column; gap: 6px;">
                      @for (workout of getWorkoutsForPlan(plan.id); track workout.id) {
                        <div class="workout-block">
                          <div class="workout-item" (click)="toggleWorkout(workout.id)">
                            <div class="workout-item-info">
                              <span class="workout-name">{{ workout.name }}</span>
                              <span class="workout-day">{{ getDayName(workout.dayOfWeek) }}</span>
                            </div>
                            <ion-icon [name]="expandedId() === workout.id ? 'chevron-down' : 'chevron-forward'"></ion-icon>
                          </div>
                          @if (expandedId() === workout.id) {
                            <div class="exercise-rows">
                              @if (loadingExercises()) {
                                <ion-skeleton-text [animated]="true" style="width: 100%; height: 40px;"></ion-skeleton-text>
                              } @else if (exercisesOf(workout.id).length === 0) {
                                <p class="plan-empty">{{ 'workouts.no_exercise_in_workout' | t }}</p>
                              } @else {
                                @for (we of exercisesOf(workout.id); track we.id) {
                                  <div class="exercise-row">
                                    <div>
                                      <div class="exercise-row-name">{{ we.exerciseName }}</div>
                                      @if (we.muscleGroupName) {
                                        <div class="exercise-row-muscle">{{ we.muscleGroupName }}</div>
                                      }
                                    </div>
                                    <div class="exercise-row-meta">
                                      {{ we.sets }}x{{ we.reps }}@if (weightSummary(we); as w) { · {{ w }} kg }<br>{{ 'workouts.rest' | t: { s: we.restSeconds } }}
                                    </div>
                                  </div>
                                }
                              }
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            }
          }
        }

        <!-- Treinos do Personal (assigned by admin) -->
        @if (assignedWorkouts().length > 0) {
          <div class="section-header">
            <h2>{{ 'workouts.personal_section' | t }}</h2>
            <span class="personal-section-badge">{{ 'workouts.assigned' | t }}</span>
          </div>
          @for (aw of assignedWorkouts(); track aw.id) {
            <div class="assigned-card">
              <div class="assigned-workout-item">
                <div class="assigned-info">
                  <div class="assigned-name">{{ aw.workoutName }}</div>
                  <div class="assigned-plan">{{ aw.planName }}</div>
                  <span class="assigned-day">{{ getDayName(aw.dayOfWeek) }}</span>
                </div>
                <div class="assigned-actions">
                  @if (isLoggedTodayById(aw.workoutId)) {
                    <button class="log-btn logged" (click)="toggleLogById(aw.workoutId, $event)">{{ 'workouts.done' | t }}</button>
                  } @else if (isSkippedToday(aw.workoutId)) {
                    <button class="log-btn skipped" (click)="toggleLogById(aw.workoutId, $event)" [title]="skipReasonToday(aw.workoutId)">{{ 'workouts.skipped' | t }}</button>
                  } @else {
                    <button class="skip-btn" (click)="skipWorkout(aw.workoutId, aw.workoutName, $event)">{{ 'workouts.skip' | t }}</button>
                    <button class="iniciar-btn-purple" (click)="startSessionById(aw.workoutId, aw.workoutName, aw.dayOfWeek, $event)">{{ 'workouts.start' | t }}</button>
                  }
                </div>
              </div>
            </div>
          }
        }

        <!-- Personal plans -->
        <div class="section-header">
          <h2>{{ 'workouts.my_workouts' | t }}</h2>
        </div>

        @if (myPlans().length === 0) {
          <div class="empty-list">{{ 'workouts.empty_my' | t }}<br>{{ 'workouts.empty_my_hint' | t }}</div>
        }

        @for (plan of myPlans(); track plan.id) {
          <ion-card class="personal-card">
            <div class="personal-card-header">
              <div class="personal-card-title">{{ plan.name }}</div>
              <button class="delete-plan-btn" (click)="deletePlan(plan, $event)">
                <ion-icon name="trash-outline"></ion-icon>
              </button>
            </div>
            <ion-card-content>
              @if (getWorkoutsForPlan(plan.id).length > 0) {
                <div class="workout-list">
                  @for (workout of getWorkoutsForPlan(plan.id); track workout.id) {
                    <div class="workout-block">

                      <!-- Workout row with iniciar + log buttons -->
                      <div class="workout-item" (click)="toggleWorkout(workout.id)">
                        <div class="workout-item-info">
                          <span class="workout-name">{{ workout.name }}</span>
                          <span class="workout-day">{{ getDayName(workout.dayOfWeek) }}</span>
                        </div>
                        <div class="workout-item-right">
                          @if (isLoggedToday(workout.id)) {
                            <button class="log-btn logged" (click)="toggleLog(workout, $event)">{{ 'workouts.done' | t }}</button>
                          } @else if (isSkippedToday(workout.id)) {
                            <button class="log-btn skipped" (click)="toggleLog(workout, $event)" [title]="skipReasonToday(workout.id)">{{ 'workouts.skipped' | t }}</button>
                          } @else {
                            <button class="skip-btn" (click)="skipWorkout(workout.id, workout.name, $event)">{{ 'workouts.skip' | t }}</button>
                            <button class="iniciar-btn" (click)="startSession(workout, $event)">{{ 'workouts.start' | t }}</button>
                          }
                          <button class="workout-delete-btn" (click)="deleteWorkout(workout, $event)">
                            <ion-icon name="trash-outline"></ion-icon>
                          </button>
                          <ion-icon [name]="expandedId() === workout.id ? 'chevron-down' : 'chevron-forward'"></ion-icon>
                        </div>
                      </div>

                      <!-- History dots: last 5 occurrences of this weekday -->
                      <div class="history-strip">
                        @for (h of getPastOccurrences(workout.id, workout.dayOfWeek); track h.dateStr) {
                          <div class="history-item">
                            <div class="h-dot"
                              [class.today-done]="h.isToday && h.done"
                              [class.today-missed]="h.isToday && !h.done && !h.skipped"
                              [class.done]="!h.isToday && h.done"
                              [class.skipped]="h.skipped"
                              [class.missed]="!h.isToday && !h.done && !h.skipped"
                              [title]="h.skipped ? (h.skipReason ? ('workouts.skipped_reason' | t: { reason: h.skipReason }) : ('workouts.skipped_plain' | t)) : ''">
                              {{ h.done ? '✓' : h.skipped ? '–' : '✗' }}
                            </div>
                            <span class="h-label" [class.today]="h.isToday">
                              {{ h.isToday ? ('workouts.today' | t) : h.label }}
                            </span>
                          </div>
                        }
                      </div>

                      <!-- Exercises (expanded) -->
                      @if (expandedId() === workout.id) {
                        <div class="exercise-rows">
                          @if (loadingExercises()) {
                            <ion-skeleton-text [animated]="true" style="width: 100%; height: 40px;"></ion-skeleton-text>
                          } @else if (exercisesOf(workout.id).length === 0) {
                            <p class="plan-empty">{{ 'workouts.no_exercise_in_workout' | t }}</p>
                          } @else {
                            @for (we of exercisesOf(workout.id); track we.id) {
                              @if (editingExId() === we.id) {
                                <div class="exercise-row ex-editing">
                                  <div class="exercise-row-name">{{ we.exerciseName }}</div>
                                  <div class="ex-edit-grid">
                                    <label><span>{{ 'create.sets' | t }}</span>
                                      <input type="number" inputmode="numeric" min="1" max="20" [ngModel]="exForm.sets" (ngModelChange)="onSetsChange($event)" /></label>
                                    <label><span>{{ 'create.reps' | t }}</span>
                                      <input type="text" maxlength="10" [(ngModel)]="exForm.reps" /></label>
                                    <label><span>{{ 'create.rest' | t }}</span>
                                      <input type="number" inputmode="numeric" min="0" step="15" [(ngModel)]="exForm.restSeconds" /></label>
                                  </div>
                                  <div class="ex-weights-head">
                                    <span>{{ 'workouts.weight_per_set' | t }}</span>
                                    @if (exForm.setWeights.length > 1) {
                                      <button type="button" class="ex-copy" (click)="copyFirstWeight()">{{ 'workouts.copy_first' | t }}</button>
                                    }
                                  </div>
                                  <div class="ex-weights">
                                    @for (w of exForm.setWeights; track $index; let i = $index) {
                                      <label>
                                        <span>{{ 'workouts.set_short' | t: { n: i + 1 } }}</span>
                                        <input type="number" inputmode="decimal" min="0" step="0.5" placeholder="–"
                                               [ngModel]="exForm.setWeights[i]" (ngModelChange)="exForm.setWeights[i] = $event"
                                               [attr.aria-label]="'session.weight_aria' | t: { n: i + 1 }" />
                                      </label>
                                    }
                                  </div>
                                  <div class="ex-edit-actions">
                                    <button class="ex-cancel" (click)="cancelEditExercise()">{{ 'common.cancel' | t }}</button>
                                    <button class="ex-save" [disabled]="savingEx()" (click)="saveExercise(we)">
                                      {{ (savingEx() ? 'common.saving' : 'common.save') | t }}
                                    </button>
                                  </div>
                                </div>
                              } @else {
                                <button class="exercise-row ex-editable" (click)="startEditExercise(we)" [attr.aria-label]="'workouts.edit_exercise' | t: { name: we.exerciseName }">
                                  <div>
                                    <div class="exercise-row-name">{{ we.exerciseName }}</div>
                                    @if (we.muscleGroupName) {
                                      <div class="exercise-row-muscle">{{ we.muscleGroupName }}</div>
                                    }
                                  </div>
                                  <div class="exercise-row-meta">
                                    {{ we.sets }}x{{ we.reps }}@if (weightSummary(we); as w) { · {{ w }} kg }<br>{{ 'workouts.rest' | t: { s: we.restSeconds } }}
                                    <span class="ex-pencil">✎</span>
                                  </div>
                                </button>
                              }
                            }
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              } @else {
                <p class="plan-empty">{{ 'workouts.no_workouts_plan' | t }}</p>
              }
            </ion-card-content>
          </ion-card>
        }

        <div style="height: 100px;"></div>
      }

      <!-- Confirm delete modal -->
      <ion-modal [isOpen]="showConfirmDelete()" (didDismiss)="cancelDelete()" [breakpoints]="[0, 0.55]" [initialBreakpoint]="0.55">
        <ng-template>
          <div class="confirm-wrap">
            <div class="confirm-icon">🗑️</div>
            <div class="confirm-title">{{ 'workouts.delete_title' | t }}</div>
            <p class="confirm-desc">
              {{ 'workouts.delete_desc' | t }}
              <span class="confirm-name-highlight">"{{ deleteTargetName() }}"</span>
              {{ 'workouts.delete_desc_end' | t }}
            </p>
            <div class="confirm-input-label">{{ 'workouts.delete_type' | t }}</div>
            <input
              class="confirm-input"
              [class.match]="confirmDeleteInput === deleteTargetName()"
              type="text"
              [placeholder]="deleteTargetName()"
              [(ngModel)]="confirmDeleteInput"
            />
            <div class="confirm-btns">
              <button class="confirm-delete-btn"
                [disabled]="confirmDeleteInput !== deleteTargetName()"
                (click)="confirmDelete()">
                {{ 'workouts.delete_confirm' | t }}
              </button>
              <button class="confirm-cancel-btn" (click)="cancelDelete()">{{ 'common.cancel' | t }}</button>
            </div>
          </div>
        </ng-template>
      </ion-modal>

      <!-- FAB: criar treino -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="openCreate()">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- Active Session Modal -->
      <ion-modal [isOpen]="showSession()" (didDismiss)="cancelSession()" [breakpoints]="[0, 1]" [initialBreakpoint]="1">
        <ng-template>
          @if (sessionResult(); as result) {
            <div class="done-wrap">
              @if (result === 'saving') {
                <ion-spinner name="crescent"></ion-spinner>
                <div class="done-sub">{{ 'session.saving' | t }}</div>
              } @else if (result === 'saved') {
                <div class="done-check">✓</div>
                <div class="done-title">{{ 'session.done_title' | t }}</div>
                <div class="done-sub">{{ 'session.done_sub' | t: { name: sessionWorkout()?.name } }}</div>
                <div class="done-stats">
                  <div class="done-stat"><span>{{ sessionSummary().time }}</span>{{ 'session.duration' | t }}</div>
                  <div class="done-stat"><span>{{ sessionSummary().sets }}/{{ sessionSummary().total }}</span>{{ 'session.sets' | t }}</div>
                  @if (sessionSummary().volume > 0) {
                    <div class="done-stat"><span>{{ fmtInt(sessionSummary().volume) }}</span>{{ 'session.volume' | t }}</div>
                  }
                  <!-- Calorias: estimativa, mas o usuário pode tocar e corrigir -->
                  <button type="button" class="done-stat kcal-stat" [class.manual]="kcalManual() !== null" (click)="startEditKcal()"
                          [attr.aria-label]="'session.kcal_edit' | t">
                    <span>🔥 {{ fmtInt(kcal()) }} <ion-icon name="create-outline" class="kcal-pen"></ion-icon></span>{{ 'session.kcal' | t }}
                  </button>
                </div>
                @if (editingKcal()) {
                  <div class="kcal-edit">
                    <label>{{ 'session.kcal_edit' | t }}</label>
                    <div class="kcal-edit-row">
                      <input type="number" inputmode="numeric" min="0" max="5000" [(ngModel)]="kcalDraft" (keydown.enter)="saveKcal()" />
                      <button type="button" class="kcal-ok" (click)="saveKcal()">{{ 'common.save' | t }}</button>
                    </div>
                    @if (kcalManual() !== null) {
                      <button type="button" class="done-link" (click)="resetKcal()">{{ 'session.kcal_reset' | t }}</button>
                    }
                  </div>
                } @else {
                  <p class="kcal-note">
                    @if (kcalManual() !== null) { {{ 'session.kcal_manual' | t }} }
                    @else if (bodyWeight() !== null) { {{ 'session.kcal_est' | t: { kg: bodyWeight() } }} }
                    @else { {{ 'session.kcal_no_weight' | t }} }
                  </p>
                }
                <button class="finish-btn share-btn" [disabled]="sharing()" (click)="shareWorkout()">
                  @if (sharing()) { <ion-spinner name="crescent"></ion-spinner> } @else { <ion-icon name="share-social"></ion-icon> }
                  {{ 'share.button' | t }}
                </button>
                @if (shareMsg()) { <div class="share-msg">{{ shareMsg() }}</div> }
                <button class="done-link" (click)="closeSession()">{{ 'common.close' | t }}</button>
              } @else {
                <div class="done-check error">!</div>
                <div class="done-title">{{ 'session.error_title' | t }}</div>
                <div class="done-sub">{{ 'session.error_sub' | t }}</div>
                <button class="finish-btn" (click)="retrySave()">{{ 'session.retry' | t }}</button>
                <button class="done-link" (click)="closeSession()">{{ 'session.close_no_save' | t }}</button>
              }
            </div>
          } @else {
          <div class="session-wrap">
            <div class="session-header">
              <div class="session-top-row">
                <div class="session-title">{{ sessionWorkout()?.name }}</div>
                <button class="session-close-btn" (click)="cancelSession()">×</button>
              </div>
              <div class="session-timer">{{ formatTimer(sessionTimer()) }}</div>
              <div class="session-progress-label">
                {{ 'session.progress' | t: { done: sessionDoneCount(), total: sessionTotalSets() } }}
              </div>
              <div class="session-progress-bar">
                <div class="session-progress-fill"
                  [style.width.%]="sessionTotalSets() > 0 ? (sessionDoneCount() / sessionTotalSets()) * 100 : 0">
                </div>
              </div>
            </div>

            <div class="session-body">
              @if (sessionLoading()) {
                <div style="text-align:center; padding: 40px;">
                  <ion-spinner name="crescent"></ion-spinner>
                </div>
              } @else {
                @for (ex of sessionExercises(); track ex.id) {
                  <div class="session-exercise-card" [class.all-done]="isExerciseDone(ex)">
                    <div class="session-ex-header">
                      <div>
                        <div class="session-ex-name">{{ ex.exerciseName }}</div>
                        @if (ex.muscleGroupName) {
                          <div class="session-ex-muscle">{{ ex.muscleGroupName }}</div>
                        }
                      </div>
                      @if (isExerciseDone(ex)) {
                        <span class="session-ex-done-badge">{{ 'session.complete' | t }}</span>
                      } @else {
                        <span style="font-size:0.75rem; color: var(--ft-text-faint);">
                          {{ ex.sets }}×{{ ex.reps }} · {{ ex.restSeconds }}s
                        </span>
                      }
                    </div>
                    <div class="session-sets">
                      @for (set of getSetArray(ex); track set; let i = $index) {
                        <div class="session-set-row" [class.done]="isSetDone(ex.id, i)"
                          (click)="toggleSet(ex.id, i, ex.sets)">
                          <div class="set-circle">
                            @if (isSetDone(ex.id, i)) { ✓ } @else { {{ i + 1 }} }
                          </div>
                          <span class="set-info" [class.done]="isSetDone(ex.id, i)">
                            {{ 'session.set' | t: { n: i + 1 } }}
                            @if (lastWeight(ex.id, i) !== null) {
                              <small class="set-last">{{ 'session.last' | t: { w: lastWeight(ex.id, i) } }}</small>
                            } @else {
                              <small class="set-last">{{ 'session.goal' | t: { r: ex.reps } }}</small>
                            }
                          </span>
                          <!-- Toque nos campos não marca/desmarca a série -->
                          <div class="set-inputs" (click)="$event.stopPropagation()">
                            <label class="set-field">
                              <input type="number" inputmode="decimal" min="0" step="0.5" placeholder="–"
                                     [value]="getWeight(ex.id, i) ?? ''"
                                     (input)="setWeight(ex.id, i, $any($event.target).value)"
                                     [attr.aria-label]="'session.weight_aria' | t: { n: i + 1 }" />
                              <span>kg</span>
                            </label>
                            <label class="set-field reps">
                              <input type="number" inputmode="numeric" min="0" step="1" placeholder="–"
                                     [value]="getReps(ex.id, i) ?? ''"
                                     (input)="setReps(ex.id, i, $any($event.target).value)"
                                     [attr.aria-label]="'session.reps_aria' | t: { n: i + 1 }" />
                              <span>reps</span>
                            </label>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }
              }
            </div>

            <div class="session-footer">
              <button class="finish-btn" (click)="finishSession()"
                [disabled]="sessionDoneCount() === 0">
                {{ 'session.finish' | t }}
              </button>
            </div>
          </div>
          }
        </ng-template>
      </ion-modal>

      <!-- Create Workout Modal -->
      <ion-modal [isOpen]="showCreate()" (didDismiss)="closeCreate()" [breakpoints]="[0, 1]" [initialBreakpoint]="1">
        <ng-template>
          <div style="height: 100%; overflow-y: auto; background: var(--ft-surface, #fff);">
            <div class="modal-header-bar">
              <h2>{{ 'create.title' | t }}</h2>
              <button class="modal-close-btn" (click)="closeCreate()">×</button>
            </div>

            <div class="modal-body">

              <!-- Modality selector -->
              <div class="form-group">
                <label>{{ 'create.modality' | t }}</label>
                @if (adminPlans().length === 0) {
                  <p style="font-size:0.82rem;color:var(--ft-muted,#888);margin:4px 0 0;">{{ 'create.loading_modalities' | t }}</p>
                } @else {
                  <div class="modality-chips-modal">
                    @for (plan of adminPlans(); track plan.id) {
                      <button class="mod-chip"
                        [class.active]="createModalityId === plan.id"
                        (click)="selectModality(plan)">
                        {{ plan.name }}
                      </button>
                    }
                  </div>
                }
              </div>

              <!-- Name -->
              <div class="form-group">
                <label>{{ 'create.name' | t }}</label>
                <input class="form-input" type="text" [(ngModel)]="createName"
                  [placeholder]="'create.name_ph' | t" />
              </div>

              <!-- Day of week -->
              <div class="form-group">
                <label>{{ 'create.day' | t }}</label>
                <select class="form-select" [(ngModel)]="createDay">
                  <option [value]="1">{{ 'day.long.1' | t }}</option>
                  <option [value]="2">{{ 'day.long.2' | t }}</option>
                  <option [value]="3">{{ 'day.long.3' | t }}</option>
                  <option [value]="4">{{ 'day.long.4' | t }}</option>
                  <option [value]="5">{{ 'day.long.5' | t }}</option>
                  <option [value]="6">{{ 'day.long.6' | t }}</option>
                  <option [value]="0">{{ 'day.long.0' | t }}</option>
                </select>
              </div>

              <!-- Exercise search -->
              <div class="exercise-search-section">
                <div class="section-label">{{ 'create.add_exercises' | t }}</div>
                <ion-searchbar
                  [(ngModel)]="exerciseSearch"
                  [placeholder]="'common.search_exercise' | t"
                  [debounce]="150"
                  style="--background: var(--ft-bg-elevated); --border-radius: 10px; padding: 0;"
                ></ion-searchbar>

                <!-- Muscle group filter chips -->
                @if (muscleGroups().length > 0) {
                  <div class="muscle-chips">
                    <button class="muscle-chip" [class.active]="selectedMuscleGroup() === ''"
                      (click)="selectedMuscleGroup.set('')">{{ 'common.all' | t }}</button>
                    @for (mg of muscleGroups(); track mg) {
                      <button class="muscle-chip" [class.active]="selectedMuscleGroup() === mg"
                        (click)="selectedMuscleGroup.set(selectedMuscleGroup() === mg ? '' : mg)">
                        {{ mg }}
                      </button>
                    }
                  </div>
                }

                @if (loadingAllExercises()) {
                  <div class="empty-list"><ion-spinner name="crescent"></ion-spinner></div>
                } @else if (filteredExercises().length === 0) {
                  <div class="empty-list">{{ 'common.no_exercise_found' | t }}</div>
                } @else {
                  <div class="exercise-pick-list">
                    @for (ex of filteredExercises(); track ex.id) {
                      <div class="exercise-pick-item"
                        [class.selected]="isSelected(ex.id)"
                        (click)="toggleExercise(ex)">
                        <div>
                          <div class="pick-name">{{ ex.name }}</div>
                          @if (ex.muscleGroupName) {
                            <div class="pick-muscle">{{ ex.muscleGroupName }}</div>
                          }
                        </div>
                        <ion-icon
                          [name]="isSelected(ex.id) ? 'checkmark-circle' : 'ellipse-outline'"
                          [class]="isSelected(ex.id) ? 'pick-icon on' : 'pick-icon off'"
                        ></ion-icon>
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- Selected exercises with sets/reps/rest -->
              @if (selectedExercises().length > 0) {
                <div class="selected-exercises-section">
                  <div class="section-label">{{ 'create.exercises_count' | t: { n: selectedExercises().length } }}</div>
                  @for (sel of selectedExercises(); track sel.exerciseId; let i = $index) {
                    <div class="sel-ex-card">
                      <div class="sel-ex-header">
                        <span class="sel-ex-name">{{ sel.exerciseName }}</span>
                        <button class="sel-ex-remove" (click)="removeExercise(i)">
                          <ion-icon name="remove-circle-outline"></ion-icon>
                        </button>
                      </div>
                      <div class="sel-ex-inputs">
                        <div class="mini-input-wrap">
                          <span class="mini-label">{{ 'create.sets' | t }}</span>
                          <input class="mini-input" type="number" [(ngModel)]="sel.sets" min="1" />
                        </div>
                        <div class="mini-input-wrap">
                          <span class="mini-label">{{ 'create.reps' | t }}</span>
                          <input class="mini-input" type="text" [(ngModel)]="sel.reps" placeholder="10" />
                        </div>
                        <div class="mini-input-wrap">
                          <span class="mini-label">{{ 'create.rest' | t }}</span>
                          <input class="mini-input" type="number" [(ngModel)]="sel.restSeconds" min="0" />
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }

              <button class="save-btn" (click)="saveWorkout()" [disabled]="saving() || !createName.trim() || selectedExercises().length === 0">
                @if (saving()) {
                  <ion-spinner name="crescent" style="width: 18px; height: 18px;"></ion-spinner> {{ 'common.saving' | t }}
                } @else {
                  {{ 'create.save' | t }}
                }
              </button>
            </div>
          </div>
        </ng-template>
      </ion-modal>
    </ion-content>
  `
})
export class TreinosPage implements OnInit, OnDestroy {
  readonly i18n = inject(I18nService);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly assignmentService = inject(WorkoutAssignmentService);
  private readonly actionSheetCtrl = inject(ActionSheetController);
  private readonly shareService = inject(WorkoutShareService);

  workoutPlans = signal<WorkoutPlan[]>([]);
  workouts = signal<Workout[]>([]);
  workoutLogs = signal<WorkoutLog[]>([]);
  assignedWorkouts = signal<AssignedWorkout[]>([]);
  loading = signal(true);
  expandedId = signal<string | null>(null);
  expandedPlanId = signal<string | null>(null);
  loadingExercises = signal(false);
  private readonly exerciseCache = signal<Record<string, WorkoutExercise[]>>({});

  // Computed splits
  adminPlans = computed(() => this.workoutPlans().filter(p => !p.userId));
  adminPlansWithWorkouts = computed(() =>
    this.adminPlans().filter(p => this.getWorkoutsForPlan(p.id).length > 0)
  );
  myPlans = computed(() => {
    const uid = this.auth.currentUser()?.userId;
    return uid ? this.workoutPlans().filter(p => p.userId === uid) : [];
  });

  // Create modal state
  showCreate = signal(false);
  createName = '';
  createDay = 1;
  createModalityId = '';
  exerciseSearch = '';
  selectedMuscleGroup = signal<string>('');
  allExercises = signal<Exercise[]>([]);
  loadingAllExercises = signal(false);
  selectedExercises = signal<SelectedExercise[]>([]);
  saving = signal(false);

  muscleGroups = computed(() => {
    const groups = new Set(this.allExercises().map(e => e.muscleGroupName ?? '').filter(Boolean));
    return Array.from(groups).sort();
  });

  filteredExercises = computed(() => {
    const q = this.exerciseSearch.toLowerCase().trim();
    const mg = this.selectedMuscleGroup();
    return this.allExercises().filter(e => {
      const matchQ = !q || e.name.toLowerCase().includes(q) || (e.muscleGroupName ?? '').toLowerCase().includes(q);
      const matchMg = !mg || e.muscleGroupName === mg;
      return matchQ && matchMg;
    });
  });

  constructor() {
    addIcons({
      chevronForward, chevronDown, informationCircle, add,
      trashOutline, removeCircleOutline, checkmarkCircle, ellipseOutline, checkmarkOutline, shareSocial, createOutline
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.api.get<WorkoutLog[]>('/api/workoutlogs/me').subscribe({
      next: (logs) => this.workoutLogs.set(logs),
      error: () => this.workoutLogs.set([])
    });
    this.assignmentService.getMyAssignments().subscribe({
      next: (list) => this.assignedWorkouts.set(list),
      error: () => this.assignedWorkouts.set([])
    });
    const uid = this.auth.currentUser()?.userId;
    this.api.get<WorkoutPlan[]>('/api/workoutplans', uid ? { systemOnly: 'true', userId: uid } : { systemOnly: 'true' }).subscribe({
      next: (plans) => this.workoutPlans.set(plans),
      error: () => this.workoutPlans.set([])
    });
    this.api.get<Workout[]>('/api/workouts').subscribe({
      next: (workouts) => {
        this.workouts.set(workouts);
        this.loading.set(false);
      },
      error: () => {
        this.workouts.set([]);
        this.loading.set(false);
      }
    });
  }

  handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    this.loadData();
    setTimeout(() => event.detail.complete(), 1000);
  }

  getWorkoutsForPlan(planId: string): Workout[] {
    return this.workouts().filter(w => w.workoutPlanId === planId);
  }

  exercisesOf(workoutId: string): WorkoutExercise[] {
    return this.exerciseCache()[workoutId] ?? [];
  }

  toggleWorkout(workoutId: string) {
    if (this.expandedId() === workoutId) {
      this.expandedId.set(null);
      return;
    }
    this.expandedId.set(workoutId);
    if (this.exerciseCache()[workoutId]) return;
    this.loadingExercises.set(true);
    this.api.get<WorkoutExercise[]>('/api/workoutexercises', { workoutId }).subscribe({
      next: (list) => {
        this.exerciseCache.update(c => ({ ...c, [workoutId]: list }));
        this.loadingExercises.set(false);
      },
      error: () => {
        this.exerciseCache.update(c => ({ ...c, [workoutId]: [] }));
        this.loadingExercises.set(false);
      }
    });
  }

  getDayName(day: number): string {
    return day >= 0 && day <= 6 ? this.i18n.t(`day.${day}`) : this.i18n.t('day.unknown', { n: day });
  }

  selectModality(plan: WorkoutPlan) {
    this.createModalityId = this.createModalityId === plan.id ? '' : plan.id;
  }

  togglePlan(planId: string) {
    this.expandedPlanId.set(this.expandedPlanId() === planId ? null : planId);
    this.expandedId.set(null);
  }

  isLoggedTodayById(workoutId: string): boolean {
    return this.isLoggedToday(workoutId);
  }

  toggleLogById(workoutId: string, event: Event) {
    this.toggleLog({ id: workoutId } as Workout, event);
  }

  startSessionById(workoutId: string, workoutName: string, dayOfWeek: number, event: Event) {
    event.stopPropagation();
    const fakeWorkout: Workout = { id: workoutId, name: workoutName, workoutPlanId: '', dayOfWeek, orderIndex: 0, createdAt: '' };
    this.startSession(fakeWorkout, event);
  }

  // --- Active session ---
  showSession = signal(false);
  sessionWorkout = signal<Workout | null>(null);
  sessionExercises = signal<WorkoutExercise[]>([]);
  sessionLoading = signal(false);
  sessionTimer = signal(0);
  sessionSets = signal<Record<string, boolean[]>>({});
  private timerRef?: ReturnType<typeof setInterval>;

  sessionDoneCount = computed(() =>
    Object.values(this.sessionSets()).reduce((t, arr) => t + arr.filter(Boolean).length, 0)
  );
  sessionTotalSets = computed(() =>
    Object.values(this.sessionSets()).reduce((t, arr) => t + arr.length, 0)
  );

  startSession(workout: Workout, event: Event) {
    event.stopPropagation();
    this.sessionWorkout.set(workout);
    this.sessionSets.set({});
    this.sessionTimer.set(0);
    this.sessionLoading.set(true);
    this.showSession.set(true);

    const cached = this.exerciseCache()[workout.id];
    if (cached?.length) {
      this.initSessionSets(cached);
    } else {
      this.api.get<WorkoutExercise[]>('/api/workoutexercises', { workoutId: workout.id }).subscribe({
        next: (list) => {
          this.exerciseCache.update(c => ({ ...c, [workout.id]: list }));
          this.initSessionSets(list);
        },
        error: () => this.sessionLoading.set(false)
      });
    }
  }

  // Carga (kg) e repetições digitadas em cada série
  sessionWeights = signal<Record<string, (number | null)[]>>({});
  sessionReps = signal<Record<string, (number | null)[]>>({});
  // Última carga usada em cada série ("exId:índice"), para mostrar "últ. 40 kg"
  lastSets = signal<Record<string, { weightKg: number | null; reps: number | null }>>({});

  private initSessionSets(exercises: WorkoutExercise[]) {
    this.sessionExercises.set(exercises);
    const sets: Record<string, boolean[]> = {};
    const weights: Record<string, (number | null)[]> = {};
    const reps: Record<string, (number | null)[]> = {};
    exercises.forEach(ex => {
      sets[ex.id] = Array(ex.sets).fill(false);
      weights[ex.id] = Array(ex.sets).fill(null);
      // "10" vira 10; faixas como "8-12" ficam vazias para o aluno preencher
      const planned = /^\d+$/.test(ex.reps?.trim() ?? '') ? Number(ex.reps) : null;
      reps[ex.id] = Array(ex.sets).fill(planned);
    });
    this.sessionSets.set(sets);
    this.sessionWeights.set(weights);
    this.sessionReps.set(reps);
    this.lastSets.set({});
    this.sessionLoading.set(false);
    this.startTimer();

    const workoutId = this.sessionWorkout()?.id;
    if (!workoutId) return;
    this.api.get<{ workoutExerciseId: string; setIndex: number; weightKg: number | null; reps: number | null }[]>(
      '/api/workoutlogs/last-sets', { workoutId }
    ).subscribe({
      next: (last) => {
        const map: Record<string, { weightKg: number | null; reps: number | null }> = {};
        last.forEach(s => { map[`${s.workoutExerciseId}:${s.setIndex}`] = { weightKg: s.weightKg, reps: s.reps }; });
        this.lastSets.set(map);
        // Carga planejada do exercício, usada quando ainda não há histórico
        const planned: Record<string, (number | null)[]> = {};
        this.sessionExercises().forEach(e => { planned[e.id] = e.setWeights ?? []; });
        // Pré-preenche com a carga da última vez (sem sobrescrever o que já foi digitado)
        this.sessionWeights.update(curr => {
          const next = { ...curr };
          for (const [exId, arr] of Object.entries(next))
            next[exId] = arr.map((w, i) => w ?? map[`${exId}:${i}`]?.weightKg ?? planned[exId]?.[i] ?? null);
          return next;
        });
      }
    });
  }

  getWeight(exId: string, i: number): number | null {
    return this.sessionWeights()[exId]?.[i] ?? null;
  }

  getReps(exId: string, i: number): number | null {
    return this.sessionReps()[exId]?.[i] ?? null;
  }

  lastWeight(exId: string, i: number): number | null {
    return this.lastSets()[`${exId}:${i}`]?.weightKg ?? null;
  }

  setWeight(exId: string, i: number, raw: string) {
    const v = raw === '' ? null : Math.max(0, Number(String(raw).replace(',', '.')));
    this.sessionWeights.update(curr => {
      const arr = [...(curr[exId] ?? [])];
      arr[i] = v === null || isNaN(v) ? null : v;
      return { ...curr, [exId]: arr };
    });
  }

  setReps(exId: string, i: number, raw: string) {
    const v = raw === '' ? null : Math.max(0, Math.round(Number(raw)));
    this.sessionReps.update(curr => {
      const arr = [...(curr[exId] ?? [])];
      arr[i] = v === null || isNaN(v) ? null : v;
      return { ...curr, [exId]: arr };
    });
  }

  /** Séries concluídas que têm carga ou repetições, no formato da API */
  private doneSetsPayload() {
    const out: { workoutExerciseId: string; setIndex: number; weightKg: number | null; reps: number | null }[] = [];
    for (const [exId, done] of Object.entries(this.sessionSets())) {
      done.forEach((isDone, i) => {
        const weightKg = this.getWeight(exId, i);
        const reps = this.getReps(exId, i);
        if (isDone && (weightKg !== null || reps !== null)) out.push({ workoutExerciseId: exId, setIndex: i, weightKg, reps });
      });
    }
    return out;
  }

  private startTimer() {
    this.stopTimer();
    this.timerRef = setInterval(() => this.sessionTimer.update(t => t + 1), 1000);
  }

  private stopTimer() {
    if (this.timerRef) { clearInterval(this.timerRef); this.timerRef = undefined; }
  }

  formatTimer(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  getSetArray(ex: WorkoutExercise): number[] {
    return Array(ex.sets).fill(0);
  }

  isSetDone(exId: string, index: number): boolean {
    return this.sessionSets()[exId]?.[index] ?? false;
  }

  isExerciseDone(ex: WorkoutExercise): boolean {
    return this.sessionSets()[ex.id]?.every(Boolean) ?? false;
  }

  toggleSet(exId: string, index: number, _sets: number) {
    this.sessionSets.update(curr => {
      const arr = [...(curr[exId] ?? [])];
      arr[index] = !arr[index];
      return { ...curr, [exId]: arr };
    });
  }

  // Resultado ao finalizar: null = sessão em andamento
  sessionResult = signal<null | 'saving' | 'saved' | 'error'>(null);
  sessionSummary = signal({ time: '', sets: 0, total: 0, volume: 0 });

  // --- Calorias gastas (estimativa) ---
  /** MET da musculação de intensidade moderada a vigorosa (Compêndio de Atividades Físicas) */
  private static readonly STRENGTH_MET = 5;
  private static readonly DEFAULT_WEIGHT = 70;
  /** Peso mais recente registrado em Medidas (null = nenhum) */
  bodyWeight = signal<number | null>(null);
  /** Valor digitado pelo usuário (ex.: do relógio); null = usa a estimativa */
  kcalManual = signal<number | null>(null);
  editingKcal = signal(false);
  kcalDraft: number | string | null = null;

  /** kcal = MET × peso (kg) × horas */
  kcalEstimate = computed(() => {
    const kg = this.bodyWeight() ?? TreinosPage.DEFAULT_WEIGHT;
    return Math.round(TreinosPage.STRENGTH_MET * kg * (this.sessionTimer() / 3600));
  });
  kcal = computed(() => this.kcalManual() ?? this.kcalEstimate());

  private loadBodyWeight() {
    this.api.get<{ weightKg?: number | null; measuredDate: string }[]>('/api/measurements/me').subscribe({
      next: list => {
        const latest = [...list]
          .filter(m => m.weightKg)
          .sort((a, b) => b.measuredDate.localeCompare(a.measuredDate))[0];
        this.bodyWeight.set(latest?.weightKg ?? null);
      },
      error: () => this.bodyWeight.set(null)
    });
  }

  startEditKcal() {
    this.kcalDraft = this.kcal();
    this.editingKcal.set(true);
  }

  saveKcal() {
    const v = Number(String(this.kcalDraft ?? '').replace(',', '.'));
    if (Number.isFinite(v) && v >= 0 && v <= 5000) this.kcalManual.set(Math.round(v));
    this.editingKcal.set(false);
  }

  resetKcal() {
    this.kcalManual.set(null);
    this.editingKcal.set(false);
  }

  finishSession() {
    const workout = this.sessionWorkout();
    if (!workout) return;
    this.stopTimer();
    this.kcalManual.set(null);
    this.editingKcal.set(false);
    this.loadBodyWeight();
    const sets = this.doneSetsPayload();
    this.sessionSummary.set({
      time: this.formatTimer(this.sessionTimer()),
      sets: this.sessionDoneCount(),
      total: this.sessionTotalSets(),
      // Volume = soma de carga × repetições das séries feitas
      volume: Math.round(sets.reduce((t, s) => t + (s.weightKg ?? 0) * (s.reps ?? 0), 0))
    });

    this.sessionResult.set('saving');
    const saveSets = (log?: WorkoutLog) => {
      if (!log || sets.length === 0) { this.sessionResult.set('saved'); return; }
      this.api.put<void>(`/api/workoutlogs/${log.id}/sets`, sets).subscribe({
        next: () => this.sessionResult.set('saved'),
        error: () => this.sessionResult.set('error')
      });
    };

    // Já marcado como feito hoje: só atualiza as cargas desse registro
    if (this.isLoggedToday(workout.id)) {
      saveSets(this.todayLog(workout.id));
      return;
    }
    this.logToday(workout.id, saveSets, () => this.sessionResult.set('error'));
  }

  /** Número no formato do idioma escolhido (5.850 em pt, 5,850 em en) */
  fmtInt(n: number): string {
    return new Intl.NumberFormat(this.i18n.locale(), { maximumFractionDigits: 0 }).format(n);
  }

  // --- Compartilhar treino concluído ---
  sharing = signal(false);
  shareMsg = signal('');

  async shareWorkout() {
    const workout = this.sessionWorkout();
    if (!workout || this.sharing()) return;
    this.sharing.set(true);
    this.shareMsg.set('');

    // Só os exercícios com alguma série feita, com a maior carga usada
    const exercises = this.sessionExercises()
      .map(ex => {
        const done = this.sessionSets()[ex.id] ?? [];
        const doneIdx = done.map((d, i) => (d ? i : -1)).filter(i => i >= 0);
        const weights = doneIdx.map(i => this.getWeight(ex.id, i)).filter((w): w is number => w !== null);
        return { name: ex.exerciseName ?? '', sets: doneIdx.length, reps: ex.reps, maxKg: weights.length ? Math.max(...weights) : null };
      })
      .filter(e => e.sets > 0);

    const s = this.sessionSummary();
    try {
    const result = await this.shareService.share({
      workoutName: workout.name,
      date: new Date(),
      duration: s.time,
      setsDone: s.sets,
      setsTotal: s.total,
      volumeKg: s.volume,
      kcal: this.kcal(),
      exercises
    }, () => this.sharing.set(false)); // tira o carregamento assim que a imagem fica pronta

    if (result === 'downloaded') this.shareMsg.set(this.i18n.t('share.downloaded'));
    else if (result === 'error') this.shareMsg.set(this.i18n.t('share.error'));
    } finally {
      this.sharing.set(false);
    }
  }

  retrySave() {
    this.finishSession();
  }

  closeSession() {
    this.shareMsg.set('');
    this.sessionResult.set(null);
    this.showSession.set(false);
  }

  cancelSession() {
    this.stopTimer();
    this.sessionResult.set(null);
    this.showSession.set(false);
  }

  /**
   * Registra o treino na data LOCAL do aparelho. Sem enviar a data, o servidor
   * usava UTC e, depois das 21h no Brasil, o treino caía no dia seguinte.
   */
  private logToday(workoutId: string, onOk?: (log?: WorkoutLog) => void, onError?: () => void,
                   status: 'done' | 'skipped' = 'done', skipReason?: string) {
    // Se tinha "pulado" hoje e resolveu treinar (ou o contrário), troca o registro
    const previous = this.todayLog(workoutId);
    if (previous && (previous.status ?? 'done') !== status) {
      this.api.delete(`/api/workoutlogs/${previous.id}`).subscribe({
        next: () => {
          this.workoutLogs.update(logs => logs.filter(l => l.id !== previous.id));
          this.logToday(workoutId, onOk, onError, status, skipReason);
        },
        error: () => onError?.()
      });
      return;
    }

    this.api.post<WorkoutLog>('/api/workoutlogs', { workoutId, loggedDate: this.todayStr(), status, skipReason }).subscribe({
      next: (log) => {
        this.workoutLogs.update(logs => [log, ...logs.filter(l => l.id !== log.id)]);
        onOk?.(log);
      },
      error: (err) => {
        // 409 = já estava registrado hoje (ex.: outro aparelho): recarrega e trata como sucesso
        if (err?.status === 409) {
          this.api.get<WorkoutLog[]>('/api/workoutlogs/me').subscribe({
            next: logs => { this.workoutLogs.set(logs); onOk?.(this.todayLog(workoutId)); },
            error: () => onOk?.()
          });
        } else {
          onError?.();
        }
      }
    });
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  // --- Workout log helpers ---

  private todayStr(): string {
    return localDateStr(new Date());
  }

  /** Treinou hoje (registros antigos, sem status, contam como feitos) */
  isLoggedToday(workoutId: string): boolean {
    const log = this.todayLog(workoutId);
    return !!log && log.status !== 'skipped';
  }

  isSkippedToday(workoutId: string): boolean {
    return this.todayLog(workoutId)?.status === 'skipped';
  }

  skipReasonToday(workoutId: string): string {
    const reason = this.todayLog(workoutId)?.skipReason;
    return reason ? this.i18n.t('workouts.skipped_reason', { reason }) : this.i18n.t('workouts.skipped_plain');
  }

  async skipWorkout(workoutId: string, workoutName: string, event: Event) {
    event.stopPropagation();
    const reasons = [1, 2, 3, 4, 5].map(n => this.i18n.t(`workouts.skip_r${n}`));
    const sheet = await this.actionSheetCtrl.create({
      header: this.i18n.t('workouts.skip_header', { name: workoutName }),
      subHeader: this.i18n.t('workouts.skip_sub'),
      buttons: [
        ...reasons.map(reason => ({
          text: reason,
          handler: () => { this.logToday(workoutId, undefined, undefined, 'skipped', reason); }
        })),
        { text: this.i18n.t('common.cancel'), role: 'cancel' }
      ]
    });
    await sheet.present();
  }

  private todayLog(workoutId: string): WorkoutLog | undefined {
    const today = this.todayStr();
    return this.workoutLogs().find(
      l => l.workoutId === workoutId && l.loggedDate.slice(0, 10) === today
    );
  }

  getPastOccurrences(workoutId: string, dayOfWeek: number): DayOccurrence[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayS = localDateStr(today);
    const dates: Date[] = [];
    const cursor = new Date(today);

    while (dates.length < 5) {
      if (cursor.getDay() === dayOfWeek) {
        dates.push(new Date(cursor));
      }
      cursor.setDate(cursor.getDate() - 1);
    }

    const logs = this.workoutLogs();

    // Treinos feitos fora do dia programado (ex.: treino de segunda feito na quarta)
    // também entram no histórico, dentro do mesmo período
    const oldest = localDateStr(dates[dates.length - 1]);
    const scheduled = new Set(dates.map(localDateStr));
    for (const l of logs) {
      const ds = l.loggedDate.slice(0, 10);
      if (l.workoutId !== workoutId || ds < oldest || ds > todayS || scheduled.has(ds)) continue;
      const [y, m, d] = ds.split('-').map(Number);
      dates.push(new Date(y, m - 1, d));
      scheduled.add(ds);
    }
    dates.sort((a, b) => b.getTime() - a.getTime());
    dates.splice(5); // mantém os 5 mais recentes

    return dates.reverse().map(d => {
      const dateStr = localDateStr(d);
      const log = logs.find(l => l.workoutId === workoutId && l.loggedDate.slice(0, 10) === dateStr);
      return {
        dateStr,
        label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
        done: !!log && log.status !== 'skipped',
        skipped: log?.status === 'skipped',
        skipReason: log?.skipReason,
        logId: log?.id,
        isToday: dateStr === todayS
      };
    });
  }

  toggleLog(workout: Workout, event: Event) {
    event.stopPropagation();
    const existing = this.todayLog(workout.id);
    if (existing) {
      const msg = existing.status === 'skipped'
        ? this.i18n.t('workouts.undo_skip')
        : this.i18n.t('workouts.undo_done');
      if (!confirm(msg)) return;
      this.api.delete(`/api/workoutlogs/${existing.id}`).subscribe({
        next: () => this.workoutLogs.update(logs => logs.filter(l => l.id !== existing.id))
      });
    } else {
      this.logToday(workout.id);
    }
  }

  // --- Editar exercício do treino (séries, reps, descanso, carga) ---
  editingExId = signal<string | null>(null);
  savingEx = signal(false);
  exForm = { sets: 3, reps: '10', restSeconds: 60, setWeights: [] as (number | string | null)[] };

  startEditExercise(we: WorkoutExercise) {
    const weights = Array.from({ length: we.sets }, (_, i) => we.setWeights?.[i] ?? null);
    this.exForm = { sets: we.sets, reps: we.reps, restSeconds: we.restSeconds, setWeights: weights };
    this.editingExId.set(we.id);
  }

  /** Um campo de peso por série: acompanha o número de séries */
  onSetsChange(value: number | string) {
    const n = Math.min(20, Math.max(1, Math.round(Number(value) || 1)));
    this.exForm.sets = n;
    const arr = this.exForm.setWeights.slice(0, n);
    while (arr.length < n) arr.push(arr.length ? arr[arr.length - 1] : null);
    this.exForm.setWeights = arr;
  }

  /** Repete o peso da 1ª série em todas */
  copyFirstWeight() {
    const first = this.exForm.setWeights[0];
    this.exForm.setWeights = this.exForm.setWeights.map(() => first);
  }

  /** "40" se todas iguais, "40/45/50" se variam; null sem carga */
  weightSummary(we: WorkoutExercise): string | null {
    const ws = (we.setWeights ?? []).slice(0, we.sets).filter((w): w is number => w !== null && w !== undefined);
    if (ws.length === 0) return null;
    return ws.every(w => w === ws[0]) ? String(ws[0]) : ws.join('/');
  }

  cancelEditExercise() {
    this.editingExId.set(null);
  }

  saveExercise(we: WorkoutExercise) {
    const sets = Math.min(50, Math.max(1, Math.round(Number(this.exForm.sets) || we.sets)));
    const reps = String(this.exForm.reps ?? '').trim() || we.reps;
    const restSeconds = Math.max(0, Math.round(Number(this.exForm.restSeconds) || 0));
    const setWeights = this.exForm.setWeights.slice(0, sets).map(raw => {
      if (raw === null || raw === '') return null;
      const v = Number(String(raw).replace(',', '.'));
      return isNaN(v) ? null : Math.max(0, v);
    });

    this.savingEx.set(true);
    this.api.put<void>(`/api/workoutexercises/${we.id}`, {
      sets, reps, restSeconds, orderIndex: we.orderIndex, notes: we.notes ?? null, setWeights
    }).subscribe({
      next: () => {
        const updated = { ...we, sets, reps, restSeconds, setWeights };
        this.exerciseCache.update(c => ({
          ...c,
          [we.workoutId]: (c[we.workoutId] ?? []).map(e => e.id === we.id ? updated : e)
        }));
        this.savingEx.set(false);
        this.editingExId.set(null);
      },
      error: () => {
        this.savingEx.set(false);
        alert(this.i18n.t('workouts.edit_error'));
      }
    });
  }

  // --- Create modal ---

  openCreate() {
    this.createName = '';
    this.createDay = 1;
    this.createModalityId = this.expandedPlanId() ?? '';
    this.exerciseSearch = '';
    this.selectedMuscleGroup.set('');
    this.selectedExercises.set([]);
    this.showCreate.set(true);
    if (this.allExercises().length === 0) {
      this.loadingAllExercises.set(true);
      this.api.get<Exercise[]>('/api/exercises').subscribe({
        next: (list) => { this.allExercises.set(list); this.loadingAllExercises.set(false); },
        error: () => this.loadingAllExercises.set(false)
      });
    }
  }

  closeCreate() {
    this.showCreate.set(false);
  }

  isSelected(exerciseId: string): boolean {
    return this.selectedExercises().some(s => s.exerciseId === exerciseId);
  }

  toggleExercise(ex: Exercise) {
    if (this.isSelected(ex.id)) {
      this.selectedExercises.update(list => list.filter(s => s.exerciseId !== ex.id));
    } else {
      this.selectedExercises.update(list => [...list, {
        exerciseId: ex.id,
        exerciseName: ex.name,
        muscleGroupName: ex.muscleGroupName,
        sets: 3,
        reps: '10',
        restSeconds: 60
      }]);
    }
  }

  removeExercise(index: number) {
    this.selectedExercises.update(list => list.filter((_, i) => i !== index));
  }

  saveWorkout() {
    const userId = this.auth.currentUser()?.userId;
    if (!userId || !this.createName.trim() || this.selectedExercises().length === 0) return;

    this.saving.set(true);
    const workoutName = this.createName.trim();
    const dayOfWeek = Number(this.createDay);
    // Use modality name as plan name when modality is selected, otherwise use workout name
    const modalityPlan = this.adminPlans().find(p => p.id === this.createModalityId);
    const planName = modalityPlan ? modalityPlan.name : workoutName;

    // Always create a personal plan for the user
    this.api.post<{ id: string }>('/api/workoutplans', { name: planName, userId }).subscribe({
      next: (plan) => {
        this.api.post<{ id: string }>('/api/workouts', {
          workoutPlanId: plan.id,
          name: workoutName,
          dayOfWeek,
          orderIndex: 0
        }).subscribe({
          next: (workout) => {
            const saves = this.selectedExercises().map((sel, i) =>
              this.api.post('/api/workoutexercises', {
                workoutId: workout.id,
                exerciseId: sel.exerciseId,
                sets: Number(sel.sets) || 3,
                reps: sel.reps || '10',
                restSeconds: Number(sel.restSeconds) || 60,
                orderIndex: i
              })
            );
            forkJoin(saves).subscribe({
              next: () => { this.saving.set(false); this.closeCreate(); this.loadData(); },
              error: () => this.saving.set(false)
            });
          },
          error: () => this.saving.set(false)
        });
      },
      error: () => this.saving.set(false)
    });
  }

  // --- Confirm delete ---
  showConfirmDelete = signal(false);
  deleteTargetName = signal('');
  confirmDeleteInput = '';
  private deleteAction: (() => void) | null = null;

  private openConfirmDelete(name: string, action: () => void) {
    this.deleteTargetName.set(name);
    this.confirmDeleteInput = '';
    this.deleteAction = action;
    this.showConfirmDelete.set(true);
  }

  confirmDelete() {
    if (this.confirmDeleteInput !== this.deleteTargetName()) return;
    this.deleteAction?.();
    this.showConfirmDelete.set(false);
  }

  cancelDelete() {
    this.showConfirmDelete.set(false);
    this.deleteAction = null;
  }

  deleteWorkout(workout: Workout, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.openConfirmDelete(workout.name, () => {
      this.api.delete(`/api/workouts/${workout.id}`).subscribe({
        next: () => {
          this.workouts.update(list => list.filter(w => w.id !== workout.id));
          const remaining = this.workouts();
          this.workoutPlans.update(plans =>
            plans.filter(p => !p.userId || remaining.some(w => w.workoutPlanId === p.id))
          );
        },
        error: () => alert(this.i18n.t('common.delete_error'))
      });
    });
  }

  deletePlan(plan: WorkoutPlan, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.openConfirmDelete(plan.name, () => {
      this.api.delete(`/api/workoutplans/${plan.id}`).subscribe({
        next: () => this.loadData(),
        error: () => alert(this.i18n.t('common.delete_error'))
      });
    });
  }
}
