import { Component, computed, inject, signal, OnInit, ElementRef, afterRender, viewChild } from '@angular/core';
import { ProfileButtonComponent } from '../../shared/profile-button/profile-button.component';
import { PageTitleComponent } from '../../shared/page-title/page-title.component';
import { FormsModule } from '@angular/forms';
import { TPipe } from '../../core/i18n/t.pipe';
import { I18nService } from '../../core/i18n/i18n.service';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonInput,
  IonTextarea,
  IonModal,
  IonDatetime,
  IonSpinner,
  IonSkeletonText,
  IonRefresher,
  IonRefresherContent,
  AlertController,
  ToastController,
  RefresherEventDetail
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, trash, bodyOutline, calendarOutline, chevronDown, shareSocial, statsChart, checkmark } from 'ionicons/icons';
import { ApiService } from '../../core/services/api.service';
import { BodyMeasurement } from '../../core/models';
import { ChartPoint, LineChartComponent } from '../../shared/line-chart/line-chart.component';
import { ProgressRow, ProgressShareService, compositionVerdict } from '../../core/services/progress-share.service';

type Sex = 'M' | 'F';
interface BodyProfile { sex: Sex | null; heightCm: number | null; birthDate: string | null; }

/** Idade completa (anos) em uma data, a partir do nascimento (ambos AAAA-MM-DD). */
export function ageAt(birthDate: string | null, onDate: string): number | null {
  if (!birthDate) return null;
  const [by, bm, bd] = birthDate.slice(0, 10).split('-').map(Number);
  const [y, m, d] = onDate.slice(0, 10).split('-').map(Number);
  const age = y - by - (m < bm || (m === bm && d < bd) ? 1 : 0);
  return age >= 0 ? age : null;
}

export function bmiOf(weightKg: number | null | undefined, heightCm: number | null): number | null {
  if (!weightKg || !heightCm) return null;
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}

/** Faixa do IMC. level: ok = adequado, warn = atenção (baixo peso/sobrepeso), bad = obesidade */
type BmiLevel = 'ok' | 'warn' | 'bad';
interface BmiRange { label: string; from: number | null; to: number | null; level: BmiLevel; }
type BmiGroup = 'adult' | 'elderly' | 'teen';

const BMI_ADULT: BmiRange[] = [
  { label: 'meas.bmi_under', from: null, to: 18.5, level: 'warn' },
  { label: 'meas.bmi_normal', from: 18.5, to: 25, level: 'ok' },
  { label: 'meas.bmi_over', from: 25, to: 30, level: 'warn' },
  { label: 'meas.bmi_ob1', from: 30, to: 35, level: 'bad' },
  { label: 'meas.bmi_ob2', from: 35, to: 40, level: 'bad' },
  { label: 'meas.bmi_ob3', from: 40, to: null, level: 'bad' }
];

/** Idosos (60+), classificação de Lipschitz: ≤22 baixo peso; 22–27 adequado; 27,1–29,9 sobrepeso; ≥30 obesidade */
const BMI_ELDERLY: BmiRange[] = [
  { label: 'meas.bmi_e_under', from: null, to: 22, level: 'warn' },
  { label: 'meas.bmi_e_normal', from: 22, to: 27, level: 'ok' },
  { label: 'meas.bmi_e_over', from: 27, to: 30, level: 'warn' },
  { label: 'meas.bmi_e_ob', from: 30, to: null, level: 'bad' }
];

/** Sem idade informada usa a tabela de adulto; abaixo de 19 anos não classifica (usa curvas da OMS). */
export function bmiGroup(age: number | null): BmiGroup {
  if (age === null) return 'adult';
  if (age < 19) return 'teen';
  return age >= 60 ? 'elderly' : 'adult';
}

export function bmiRanges(group: BmiGroup): BmiRange[] {
  return group === 'elderly' ? BMI_ELDERLY : group === 'adult' ? BMI_ADULT : [];
}

export function classifyBmi(bmi: number, group: BmiGroup): BmiRange | null {
  if (group === 'adult') {
    // 18,5 já é normal; 25,0 já é sobrepeso; 30,0 obesidade I ...
    return BMI_ADULT.find(r => (r.from === null || bmi >= r.from) && (r.to === null || bmi < r.to)) ?? null;
  }
  if (group === 'elderly') {
    // 22 ainda é baixo peso; 27 ainda é adequado; 30 já é obesidade
    if (bmi <= 22) return BMI_ELDERLY[0];
    if (bmi <= 27) return BMI_ELDERLY[1];
    if (bmi < 30) return BMI_ELDERLY[2];
    return BMI_ELDERLY[3];
  }
  return null;
}

/**
 * Percentual de gordura pela fórmula da Marinha dos EUA (medidas em cm).
 * Homem: pescoço + cintura. Mulher: pescoço + cintura + quadril.
 */
export function navyBodyFat(m: BodyMeasurement, sex: Sex | null, heightCm: number | null): number | null {
  if (!sex || !heightCm || !m.neckCm || !m.waistCm) return null;
  let bf: number;
  if (sex === 'M') {
    const diff = m.waistCm - m.neckCm;
    if (diff <= 0) return null;
    bf = 495 / (1.0324 - 0.19077 * Math.log10(diff) + 0.15456 * Math.log10(heightCm)) - 450;
  } else {
    if (!m.hipCm) return null;
    const sum = m.waistCm + m.hipCm - m.neckCm;
    if (sum <= 0) return null;
    bf = 495 / (1.29579 - 0.35004 * Math.log10(sum) + 0.221 * Math.log10(heightCm)) - 450;
  }
  if (!Number.isFinite(bf)) return null;
  return Math.round(Math.min(60, Math.max(2, bf)) * 10) / 10;
}

type FieldKey =
  | 'weightKg' | 'neckCm' | 'shouldersCm' | 'chestCm' | 'waistCm' | 'hipCm'
  | 'rightArmCm' | 'leftArmCm' | 'rightThighCm' | 'leftThighCm' | 'rightCalfCm' | 'leftCalfCm';

interface Field { key: FieldKey; label: string; unit: string; }

const FIELDS: Field[] = [
  { key: 'weightKg', label: 'meas.weight', unit: 'kg' },
  { key: 'neckCm', label: 'meas.neck', unit: 'cm' },
  { key: 'shouldersCm', label: 'meas.shoulders', unit: 'cm' },
  { key: 'chestCm', label: 'meas.chest', unit: 'cm' },
  { key: 'waistCm', label: 'meas.waist', unit: 'cm' },
  { key: 'hipCm', label: 'meas.hip', unit: 'cm' },
  { key: 'rightArmCm', label: 'meas.right_arm', unit: 'cm' },
  { key: 'leftArmCm', label: 'meas.left_arm', unit: 'cm' },
  { key: 'rightThighCm', label: 'meas.right_thigh', unit: 'cm' },
  { key: 'leftThighCm', label: 'meas.left_thigh', unit: 'cm' },
  { key: 'rightCalfCm', label: 'meas.right_calf', unit: 'cm' },
  { key: 'leftCalfCm', label: 'meas.left_calf', unit: 'cm' }
];

/** Medidas de músculo (destacadas no compartilhamento da evolução) */
const MUSCLE_KEYS = new Set<FieldKey>(['shouldersCm', 'chestCm', 'rightArmCm', 'leftArmCm', 'rightThighCm', 'leftThighCm', 'rightCalfCm', 'leftCalfCm']);

interface Row { field: Field; value: number; delta: number | null; }
interface Entry { item: BodyMeasurement; rows: Row[]; bf: number | null; bmi: number | null; bmiClass: BmiRange | null; bmiGroup: BmiGroup; }

@Component({
  selector: 'app-medidas',
  standalone: true,
  imports: [
    FormsModule, TPipe, LineChartComponent, ProfileButtonComponent, PageTitleComponent,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
    IonInput, IonTextarea, IonModal, IonDatetime, IonSpinner, IonSkeletonText, IonRefresher, IonRefresherContent
  ],
  styles: [`
    .hint { margin: 0; padding: 16px 20px 4px; font-size: 0.8rem; color: var(--ft-text-muted); line-height: 1.45; }
    .add-wrap { padding: 12px 16px 4px; }
    .add-wrap ion-button { --background: var(--ft-accent); --border-radius: 12px; height: 46px; font-weight: 700; margin: 0; }

    /* Abas Histórico/Evolução: a pílula colorida desliza para a aba ativa */
    .seg { position: relative; display: flex; margin: 14px 16px 0; padding: 3px; background: var(--ft-bg-elevated); border: 1px solid var(--ft-border); border-radius: 12px; }
    .seg::before {
      content: ''; position: absolute; top: 3px; bottom: 3px; left: 3px; width: calc(50% - 3px); border-radius: 9px;
      background: var(--ft-accent); box-shadow: 0 4px 12px rgba(var(--ft-accent-rgb), 0.3);
      transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .seg.second::before { transform: translateX(100%); }
    .seg button { position: relative; z-index: 1; flex: 1; border: 0; background: transparent; color: var(--ft-text-muted); font-weight: 600; font-size: 0.85rem; padding: 9px 0; border-radius: 9px; cursor: pointer; transition: color 0.25s; -webkit-tap-highlight-color: transparent; }
    .seg button.active { color: #fff; }

    /* Carregamento ao trocar de aba + entrada suave do conteúdo */
    .view-loading { padding-top: 2px; }
    .view-loading .skeleton { animation: view-in 0.25s ease-out both; }
    .view-loading .skeleton:nth-child(2) { animation-delay: 0.05s; }
    .view-loading .skeleton:nth-child(3) { animation-delay: 0.1s; }
    .view-body { animation: view-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
    @keyframes view-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
    @media (prefers-reduced-motion: reduce) { .seg::before, .view-body, .view-loading .skeleton { transition: none; animation: none; } }

    .card { background: var(--ft-surface); border: 1px solid var(--ft-border); border-radius: var(--ft-radius-lg); margin: 12px 16px 0; padding: 14px 16px; }
    .card-title { margin: 0 0 2px; font-size: 0.95rem; font-weight: 700; color: var(--ft-text); }
    .card-sub { margin: 0 0 10px; font-size: 0.78rem; color: var(--ft-text-muted); line-height: 1.4; }
    .profile-view { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .profile-view span { font-size: 0.88rem; color: var(--ft-text); }
    .link-btn { background: none; border: 0; color: var(--ft-accent); font-weight: 700; font-size: 0.82rem; cursor: pointer; padding: 4px 6px; }
    .sex-row { display: flex; gap: 8px; margin-bottom: 10px; }
    .sex-row button { flex: 1; height: 42px; border-radius: var(--ft-radius); border: 1px solid var(--ft-border-strong); background: var(--ft-bg-elevated); color: var(--ft-text-muted); font-weight: 600; cursor: pointer; }
    .sex-row button.active { border-color: var(--ft-accent); color: var(--ft-accent); background: var(--ft-accent-soft); }
    .profile-actions { display: flex; gap: 8px; margin-top: 10px; }
    .profile-actions ion-button { flex: 1; --border-radius: 8px; height: 40px; font-weight: 600; }

    .viewer-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
    .viewer-title { font-weight: 700; font-size: 0.95rem; color: var(--ft-text); }
    /* Seletor da medida do gráfico */
    .metric-pick { position: relative; margin: 10px 0 12px; z-index: 5; }
    .mp-trigger {
      width: 100%; height: 48px; display: flex; align-items: center; gap: 10px; padding: 0 14px; cursor: pointer; text-align: left;
      background: var(--ft-bg-elevated); color: var(--ft-text); border: 1px solid var(--ft-border-strong); border-radius: var(--ft-radius);
      font-family: inherit; font-size: 0.92rem; font-weight: 700; -webkit-tap-highlight-color: transparent;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .metric-pick.open .mp-trigger { border-color: var(--ft-accent); box-shadow: 0 0 0 3px var(--ft-accent-soft); }
    .mp-icon { font-size: 1.1rem; color: var(--ft-accent); }
    .mp-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .mp-last { font-size: 0.78rem; font-weight: 700; color: var(--ft-text-muted); font-variant-numeric: tabular-nums; }
    .mp-chev { font-size: 1rem; color: var(--ft-text-muted); transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1); }
    .metric-pick.open .mp-chev { transform: rotate(180deg); color: var(--ft-accent); }
    .mp-backdrop { position: fixed; inset: 0; z-index: 1; }
    .mp-menu {
      position: absolute; left: 0; right: 0; top: calc(100% + 6px); z-index: 2;
      max-height: min(340px, 55vh); overflow-y: auto; padding: 6px;
      background: var(--ft-surface); border: 1px solid var(--ft-border-strong); border-radius: var(--ft-radius-lg);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.22), var(--ft-shadow);
      transform-origin: top center; animation: mp-in 0.2s cubic-bezier(0.22, 1, 0.36, 1);
    }
    @keyframes mp-in { from { opacity: 0; transform: translateY(-6px) scale(0.98); } to { opacity: 1; transform: none; } }
    .mp-opt {
      width: 100%; display: flex; align-items: center; gap: 10px; padding: 9px 12px; border: 0; border-radius: 10px;
      background: transparent; color: var(--ft-text); font-family: inherit; text-align: left; cursor: pointer; transition: background 0.12s;
    }
    .mp-opt:hover, .mp-opt:focus-visible { background: var(--ft-bg-elevated); outline: none; }
    .mp-opt.active { background: var(--ft-accent-soft); }
    .mp-opt-text { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .mp-opt-name { font-size: 0.9rem; font-weight: 700; }
    .mp-opt.active .mp-opt-name { color: var(--ft-accent); }
    .mp-opt-sub { font-size: 0.74rem; color: var(--ft-text-muted); font-variant-numeric: tabular-nums; }
    .mp-chg {
      font-size: 0.72rem; font-weight: 800; padding: 3px 8px; border-radius: 999px; white-space: nowrap; font-variant-numeric: tabular-nums;
      color: var(--ft-text-muted); background: var(--ft-bg-elevated);
    }
    .mp-chg.up { color: var(--ft-success); background: color-mix(in srgb, var(--ft-success) 14%, transparent); }
    .mp-chg.down { color: var(--ft-danger); background: color-mix(in srgb, var(--ft-danger) 14%, transparent); }
    .chart-sum .mp-chg { margin-left: 6px; }
    .mp-check { font-size: 1.05rem; color: var(--ft-accent); visibility: hidden; }
    .mp-opt.active .mp-check { visibility: visible; }
    @media (prefers-reduced-motion: reduce) { .mp-menu { animation: none; } }
    .chart-sum { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 8px; padding-top: 10px; border-top: 1px solid var(--ft-border); font-size: 0.8rem; color: var(--ft-text-muted); }
    .chart-sum strong { color: var(--ft-text); text-align: right; }

    .card, .entry, .prow { user-select: none; -webkit-user-select: none; }
    .card input, .card textarea { user-select: text; -webkit-user-select: text; }

    .bf-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px; }
    .bf-grid .cell-value { font-size: 1rem; }
    .bf-result { margin-top: 12px; padding: 10px 12px; border-radius: var(--ft-radius); font-weight: 800; font-size: 0.95rem; background: var(--ft-bg-elevated); border: 1px solid var(--ft-border); }
    .bf-result.good { color: var(--ft-success); }
    .bf-result.bad { color: var(--ft-accent); }
    .bf-result.mixed { color: #f5a524; }
    .bf-result.verdict { border-style: dashed; }

    /* Tipo do peso perdido/ganho: quanto foi gordura e quanto foi massa magra */
    .wb { margin-bottom: 14px; padding: 14px; border-radius: var(--ft-radius); background: var(--ft-bg-elevated); border: 1px solid var(--ft-border); }
    .wb-title { margin: 0 0 10px; font-size: 0.95rem; font-weight: 800; color: var(--ft-text); }
    .wb-bar { display: flex; height: 18px; border-radius: 9px; overflow: hidden; background: var(--ft-border); }
    .wb-bar span { display: block; height: 100%; transition: width 0.3s; }
    .wb-bar .fat, .wb-dot.fat { background: #f5a524; }
    .wb-bar .lean, .wb-dot.lean { background: #38bdf8; }
    .wb-legend { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
    .wb-item { display: flex; align-items: flex-start; gap: 8px; }
    .wb-dot { width: 12px; height: 12px; border-radius: 4px; margin-top: 3px; flex-shrink: 0; }
    .wb-item strong { display: block; font-size: 1.05rem; color: var(--ft-text); }
    .wb-item small { font-size: 0.72rem; color: var(--ft-text-muted); }
    .wb-note { margin: 10px 0 0; font-size: 0.78rem; font-weight: 600; color: var(--ft-success); }
    .bf-note { margin: 10px 0 0; font-size: 0.7rem; color: var(--ft-text-faint); line-height: 1.4; }
    .cell.bf { grid-column: 1 / -1; border-color: var(--ft-accent); background: var(--ft-accent-soft); }

    .cmp { margin: 12px 16px 0; }
    .date-select {
      width: 100%; height: 44px; padding: 0 10px; border-radius: var(--ft-radius);
      background: var(--ft-bg-elevated); color: var(--ft-text); border: 1px solid var(--ft-border-strong); font-size: 0.9rem;
    }
    .period { margin: 0; font-size: 0.78rem; color: var(--ft-text-muted); }
    .period-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 8px; }
    .share-progress {
      display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 999px; cursor: pointer;
      background: var(--ft-accent); color: #fff; border: 0; font-family: inherit; font-size: 0.8rem; font-weight: 700;
      box-shadow: 0 4px 12px rgba(var(--ft-accent-rgb), 0.3); transition: transform 0.12s, opacity 0.15s;
    }
    .share-progress:active { transform: scale(0.96); }
    .share-progress:disabled { opacity: 0.7; }
    .share-progress ion-icon { font-size: 1rem; }
    .share-progress ion-spinner { width: 16px; height: 16px; color: #fff; }
    .prow { background: var(--ft-surface); border: 1px solid var(--ft-border); border-radius: var(--ft-radius-lg); margin: 10px 16px; padding: 12px 14px; }
    .prow-head { display: flex; justify-content: space-between; align-items: center; }
    .delta-big { font-size: 0.95rem; font-weight: 800; color: var(--ft-text-muted); }
    /* Subiu = verde, caiu = vermelho */
    .delta-big.up { color: var(--ft-success); }
    .delta-big.down { color: var(--ft-danger); }
    .bf-grid .cell-value.up { color: var(--ft-success); }
    .bf-grid .cell-value.down { color: var(--ft-accent); }
    .prow-vals { display: flex; justify-content: space-between; margin-top: 6px; font-size: 0.8rem; color: var(--ft-text-muted); }
    .prow-vals strong { color: var(--ft-text); }
    .spark { width: 100%; height: 34px; margin-top: 8px; display: block; }

    .entry {
      background: var(--ft-surface); border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius-lg); margin: 12px 16px; padding: 14px 16px;
      box-shadow: var(--ft-shadow);
    }
    .date-tabs { display: flex; gap: 8px; margin: 14px 0 0; padding: 0 16px; overflow-x: auto; scrollbar-width: none; scroll-snap-type: x proximity; }
    .date-tabs::-webkit-scrollbar { display: none; }
    .date-tab {
      flex-shrink: 0; scroll-snap-align: start; display: flex; flex-direction: column; align-items: center; gap: 1px;
      min-width: 64px; padding: 8px 12px; border-radius: 12px; cursor: pointer;
      border: 1px solid var(--ft-border-strong); background: var(--ft-bg-elevated); color: var(--ft-text-muted);
    }
    .date-tab .dt-day { font-size: 0.85rem; font-weight: 700; white-space: nowrap; }
    .date-tab .dt-year { font-size: 0.66rem; color: var(--ft-text-faint); }
    .date-tab.active { background: var(--ft-accent); border-color: var(--ft-accent); color: #fff; }
    .date-tab.active .dt-year { color: rgba(255, 255, 255, 0.8); }
    .entry-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .entry-date { font-weight: 700; color: var(--ft-text); font-size: 0.95rem; }
    .del-btn { background: none; border: 0; color: var(--ft-text-faint); font-size: 1.1rem; padding: 4px 6px; cursor: pointer; }
    .del-btn:active { color: var(--ft-accent); }

    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .cell { background: var(--ft-bg-elevated); border: 1px solid var(--ft-border); border-radius: var(--ft-radius); padding: 8px 10px; }
    .cell-label { font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ft-text-faint); }
    .cell-value { font-size: 1.05rem; font-weight: 700; color: var(--ft-text); margin-top: 2px; }
    .cell-value small { font-size: 0.7rem; font-weight: 500; color: var(--ft-text-muted); margin-left: 2px; }
    .delta { font-size: 0.7rem; font-weight: 700; margin-left: 6px; color: var(--ft-text-muted); }
    .delta.up { color: var(--ft-success); }
    .delta.down { color: var(--ft-danger); }
    .notes { margin: 10px 0 0; font-size: 0.8rem; color: var(--ft-text-muted); }

    .skeleton { background: var(--ft-surface); border: 1px solid var(--ft-border); border-radius: var(--ft-radius-lg); margin: 12px 16px; padding: 16px; }

    .modal-content { padding: 24px 20px 20px; max-height: 80vh; overflow-y: auto; }
    .modal-title { font-size: 1.1rem; font-weight: 700; color: var(--ft-text); margin: 0 0 16px; }
    .field { margin-bottom: 12px; }
    .field label { display: block; font-size: 0.75rem; font-weight: 600; color: var(--ft-text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
    .field ion-input, .field ion-textarea { --background: var(--ft-bg-elevated); --border-radius: var(--ft-radius); --padding-start: 12px; --padding-end: 12px; }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .modal-actions { display: flex; gap: 10px; margin-top: 18px; }
    .modal-actions ion-button { flex: 1; height: 44px; font-weight: 600; --border-radius: 8px; }
    .form-error { color: var(--ft-accent); font-size: 0.8rem; margin: 4px 0 0; }

    /* IMC: cores por nível (adequado / atenção / obesidade) */
    .lvl-ok { --lvl: var(--ft-success); }
    .lvl-warn { --lvl: #f59e0b; }
    .lvl-bad { --lvl: var(--ft-danger); }
    .bmi-head { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 10px; margin-top: 8px; }
    .bmi-value { font-size: 2rem; font-weight: 800; color: var(--ft-text); line-height: 1; font-variant-numeric: tabular-nums; }
    .bmi-badge {
      display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700;
      color: var(--lvl); background: color-mix(in srgb, var(--lvl) 15%, transparent);
      border: 1px solid color-mix(in srgb, var(--lvl) 40%, transparent);
    }
    .bmi-badge.sm { padding: 2px 7px; font-size: 0.66rem; margin-left: 6px; vertical-align: middle; }
    .bmi-diff { font-size: 0.78rem; color: var(--ft-text-muted); }
    .bmi-date { margin: 4px 0 0; font-size: 0.72rem; color: var(--ft-text-faint); }
    .bmi-scale { position: relative; height: 10px; margin: 16px 0 6px; border-radius: 999px; background: var(--ft-bg-elevated); }
    .seg-bar { position: absolute; top: 0; bottom: 0; background: var(--lvl); opacity: 0.35; }
    .seg-bar:first-child { border-radius: 999px 0 0 999px; }
    .seg-bar:nth-last-child(2) { border-radius: 0 999px 999px 0; }
    .seg-bar.active { opacity: 1; }
    .bmi-marker {
      position: absolute; top: 50%; width: 18px; height: 18px; margin: -9px 0 0 -9px; border-radius: 50%;
      background: var(--ft-surface); border: 3px solid var(--ft-text); box-shadow: var(--ft-shadow);
    }
    .bmi-group { margin: 12px 0 6px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ft-text-faint); }
    .bmi-table { display: flex; flex-direction: column; gap: 4px; }
    .bmi-row { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-radius: 10px; font-size: 0.84rem; color: var(--ft-text-muted); border: 1px solid transparent; }
    .bmi-row.active { color: var(--ft-text); font-weight: 700; background: color-mix(in srgb, var(--lvl) 12%, transparent); border-color: color-mix(in srgb, var(--lvl) 35%, transparent); }
    .bmi-row .dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; background: var(--lvl); }
    .bmi-row-label { flex: 1; }
    .bmi-row-range { font-variant-numeric: tabular-nums; }
    .cell.bmi-cell { grid-column: 1 / -1; }
    .date-btn-text.placeholder { color: var(--ft-text-faint); font-weight: 500; }

    /* Campo de data + calendário (ion-datetime com as cores do tema) */
    .date-btn {
      width: 100%; height: 48px; display: flex; align-items: center; gap: 10px; padding: 0 14px; cursor: pointer;
      background: var(--ft-bg-elevated); color: var(--ft-text); font-family: inherit; font-size: 0.95rem; font-weight: 600;
      border: 1px solid var(--ft-border-strong); border-radius: var(--ft-radius); text-align: left;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .date-btn ion-icon { font-size: 1.15rem; color: var(--ft-accent); }
    .date-btn .date-btn-text { flex: 1; }
    .date-btn .date-btn-chev { color: var(--ft-text-faint); font-size: 1rem; transition: transform 0.2s; }
    .date-btn.open { border-color: var(--ft-accent); box-shadow: 0 0 0 3px var(--ft-accent-soft); }
    .date-btn.open .date-btn-chev { transform: rotate(180deg); }
    .cal-wrap {
      margin-top: 8px; padding: 6px 4px 8px; border-radius: var(--ft-radius-lg); overflow: hidden;
      background: var(--ft-surface); border: 1px solid var(--ft-border); box-shadow: var(--ft-shadow);
      animation: cal-in 0.18s ease-out;
    }
    @keyframes cal-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
    .cal-wrap ion-datetime {
      /* Fundo e degradê das rodas na mesma cor do card (senão aparece uma faixa clara/escura) */
      --background: var(--ft-surface);
      --background-rgb: var(--ft-surface-rgb);
      --wheel-fade-background-rgb: var(--ft-surface-rgb);
      --wheel-highlight-background: var(--ft-accent-soft);
      --wheel-highlight-border-radius: 12px;
      --title-color: var(--ft-text-muted);
      color: var(--ft-text);
      width: 100%; min-width: 0; max-width: none;
    }
    .cal-wrap ion-datetime.wheel { --wheel-highlight-border-radius: 12px; height: 200px; margin: 0 6px; width: calc(100% - 12px); }
    .cal-wrap ion-datetime::part(wheel-item) { color: var(--ft-text-faint) !important; font-size: 1rem; }
    .cal-wrap ion-datetime::part(wheel-item active) { color: var(--ft-accent) !important; font-weight: 800 !important; font-size: 1.1rem; }
    /* Títulos das colunas (na mesma ordem das rodas, que muda com o idioma) */
    .wheel-heads { display: flex; margin: 6px 6px 2px; }
    .wheel-heads span {
      flex: 1; text-align: center; font-size: 0.66rem; font-weight: 700; letter-spacing: 0.06em;
      text-transform: uppercase; color: var(--ft-text-faint);
    }
    .cal-wrap ion-datetime::part(month-year-button) { color: var(--ft-text); font-weight: 700; }
    .cal-wrap ion-datetime::part(calendar-day) { font-weight: 600; border-radius: 50%; }
    .cal-wrap ion-datetime::part(calendar-day today) { color: var(--ft-accent); border: 1.5px solid var(--ft-accent); }
    .cal-wrap ion-datetime::part(calendar-day active) {
      background: var(--ft-accent); color: #fff; border: 0; box-shadow: 0 4px 12px rgba(var(--ft-accent-rgb), 0.35);
    }
    .cal-wrap ion-datetime::part(calendar-day disabled) { color: var(--ft-text-faint); opacity: 0.45; }
    .cal-actions { display: flex; justify-content: flex-end; padding: 0 10px; }
    .cal-actions.full { padding: 8px 8px 0; }
    .cal-actions.full button {
      width: 100%; padding: 12px; border-radius: var(--ft-radius); font-size: 0.9rem;
      background: var(--ft-accent); color: #fff; box-shadow: 0 4px 14px rgba(var(--ft-accent-rgb), 0.3);
    }
    .cal-actions.full button:active { transform: scale(0.98); }
    .date-btn .date-btn-age { color: var(--ft-text-muted); font-weight: 500; font-size: 0.85rem; }
    .cal-actions button {
      background: var(--ft-accent-soft); color: var(--ft-accent); border: 0; border-radius: 999px;
      padding: 7px 14px; font-family: inherit; font-size: 0.8rem; font-weight: 700; cursor: pointer;
    }

    ion-modal { --height: auto; --max-height: 92vh; --border-radius: 16px 16px 0 0; }
  `],
  template: `
    <ion-header [translucent]="false">
      <ion-toolbar>
        <ion-title><app-page-title [title]="'meas.title' | t"></app-page-title></ion-title>
        <app-profile-button slot="end"></app-profile-button>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <p class="hint">{{ 'meas.hint' | t }}</p>
      <div class="add-wrap">
        <ion-button expand="block" (click)="openForm()">
          <ion-icon name="add" slot="start"></ion-icon>
          {{ 'meas.add' | t }}
        </ion-button>
      </div>

      <div class="seg" role="tablist" [class.second]="view() === 'progress'">
        <button type="button" role="tab" [class.active]="view() === 'history'" [attr.aria-selected]="view() === 'history'" (click)="switchView('history')">{{ 'meas.tab_history' | t }}</button>
        <button type="button" role="tab" [class.active]="view() === 'progress'" [attr.aria-selected]="view() === 'progress'" (click)="switchView('progress')">{{ 'meas.tab_progress' | t }}</button>
      </div>

      @if (loading() || switching()) {
        <div class="view-loading" aria-busy="true">
          <div class="skeleton">
            <ion-skeleton-text [animated]="true" style="width: 45%; height: 16px; margin-bottom: 12px;"></ion-skeleton-text>
            <ion-skeleton-text [animated]="true" style="width: 100%; height: 120px; border-radius: 10px;"></ion-skeleton-text>
          </div>
          @for (i of [1, 2]; track i) {
            <div class="skeleton">
              <ion-skeleton-text [animated]="true" style="width: 35%; height: 14px; margin-bottom: 12px;"></ion-skeleton-text>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <ion-skeleton-text [animated]="true" style="height: 48px; border-radius: 10px; margin: 0;"></ion-skeleton-text>
                <ion-skeleton-text [animated]="true" style="height: 48px; border-radius: 10px; margin: 0;"></ion-skeleton-text>
              </div>
            </div>
          }
        </div>
      } @else if (entries().length === 0) {
        <div class="empty-state">
          <div class="empty-icon"><ion-icon name="body-outline"></ion-icon></div>
          <p>{{ 'meas.empty' | t }}</p>
        </div>
      } @else if (view() === 'progress') {
        <div class="view-body">
        @if (entries().length < 2) {
          <div class="empty-state">
            <div class="empty-icon"><ion-icon name="body-outline"></ion-icon></div>
            <p>{{ 'meas.need_two' | t }}</p>
          </div>
        } @else {
          <div class="cmp">
            <div class="two">
              <div class="field">
                <label>{{ 'meas.from' | t }}</label>
                <select class="date-select" [ngModel]="fromId()" (ngModelChange)="fromId.set($event)">
                  @for (e of entries(); track e.item.id) { <option [value]="e.item.id">{{ formatDate(e.item.measuredDate) }}</option> }
                </select>
              </div>
              <div class="field">
                <label>{{ 'meas.to' | t }}</label>
                <select class="date-select" [ngModel]="toId()" (ngModelChange)="toId.set($event)">
                  @for (e of entries(); track e.item.id) { <option [value]="e.item.id">{{ formatDate(e.item.measuredDate) }}</option> }
                </select>
              </div>
            </div>
            <div class="period-row">
              <p class="period">{{ 'meas.period' | t: { n: periodDays() } }}</p>
              <button type="button" class="share-progress" [disabled]="sharingProgress()" (click)="shareProgress()">
                @if (sharingProgress()) { <ion-spinner name="crescent"></ion-spinner> } @else { <ion-icon name="share-social"></ion-icon> }
                {{ 'share.progress_btn' | t }}
              </button>
            </div>
          </div>

          <!-- Sexo e altura -->
          <div class="card">
            @if (editingProfile() || !profileComplete()) {
              <p class="card-title">{{ 'meas.profile_title' | t }}</p>
              <p class="card-sub">{{ 'meas.profile_sub' | t }}</p>
              <div class="sex-row">
                <button type="button" [class.active]="profileForm.sex === 'M'" (click)="profileForm.sex = 'M'">{{ 'meas.male' | t }}</button>
                <button type="button" [class.active]="profileForm.sex === 'F'" (click)="profileForm.sex = 'F'">{{ 'meas.female' | t }}</button>
              </div>
              <div class="field" style="margin-bottom: 0;">
                <label>{{ 'meas.height' | t }}</label>
                <ion-input type="number" inputmode="decimal" placeholder="175" [(ngModel)]="profileForm.height" fill="outline"></ion-input>
              </div>
              <div class="field" style="margin: 12px 0 0;">
                <label>{{ 'meas.birth' | t }}</label>
                <button type="button" class="date-btn" [class.open]="showBirthPicker()" (click)="showBirthPicker.set(!showBirthPicker())"
                        [attr.aria-expanded]="showBirthPicker()">
                  <ion-icon name="calendar-outline"></ion-icon>
                  <span class="date-btn-text" [class.placeholder]="!profileForm.birthDate">
                    {{ profileForm.birthDate ? formatDate(profileForm.birthDate) : ('meas.birth' | t) }}
                  </span>
                  @if (profileForm.birthDate && formAge() !== null) {
                    <span class="date-btn-age">{{ 'meas.age_years' | t: { n: formAge() } }}</span>
                  }
                  <ion-icon name="chevron-down" class="date-btn-chev"></ion-icon>
                </button>
                @if (showBirthPicker()) {
                  <!-- Rodas de dia/mês/ano: mais rápido que um calendário para datas antigas -->
                  <div class="cal-wrap">
                    <div class="wheel-heads" aria-hidden="true">
                      @for (h of wheelHeads(); track h) { <span>{{ h | t }}</span> }
                    </div>
                    <ion-datetime class="wheel" presentation="date" [preferWheel]="true" [value]="profileForm.birthDate ?? '1990-01-01'"
                                  min="1900-01-01" [max]="today" [locale]="i18n.locale()" (ionChange)="pickBirth($event)"></ion-datetime>
                    <div class="cal-actions full">
                      <button type="button" (click)="confirmBirth()">{{ 'meas.confirm' | t }}</button>
                    </div>
                  </div>
                }
              </div>
              @if (profileError()) { <p class="form-error">{{ profileError() }}</p> }
              <div class="profile-actions">
                @if (profileComplete()) {
                  <ion-button fill="outline" (click)="editingProfile.set(false)">{{ 'common.cancel' | t }}</ion-button>
                }
                <ion-button (click)="saveProfile()">{{ 'common.save' | t }}</ion-button>
              </div>
            } @else {
              <div class="profile-view">
                <span>{{ (profile().sex === 'M' ? 'meas.male' : 'meas.female') | t }} · {{ profile().heightCm }} cm · {{ 'meas.age_years' | t: { n: ageNow() } }}</span>
                <button type="button" class="link-btn" (click)="startEditProfile()">{{ 'meas.edit' | t }}</button>
              </div>
            }
          </div>

          <!-- IMC -->
          <div class="card">
            <p class="card-title">{{ 'meas.bmi_title' | t }}</p>
            @if (bmiInfo(); as b) {
              <div class="bmi-head">
                <div class="bmi-value">{{ b.bmi }}</div>
                @if (b.cls; as c) {
                  <span class="bmi-badge" [class]="'lvl-' + c.level">{{ c.label | t }}</span>
                }
                @if (b.diff !== null && b.diff !== 0) {
                  <span class="bmi-diff">{{ b.before }} → {{ b.bmi }} ({{ b.diff > 0 ? '+' : '' }}{{ b.diff }})</span>
                }
              </div>
              <p class="bmi-date">{{ formatDate(b.date) }}</p>

              @if (b.group === 'teen') {
                <p class="card-sub" style="margin: 10px 0 0;">{{ 'meas.bmi_teen' | t }}</p>
              } @else {
                <!-- Escala colorida com a posição do IMC -->
                <div class="bmi-scale" aria-hidden="true">
                  @for (s of b.segments; track s.label) {
                    <span class="seg-bar" [class]="'lvl-' + s.level" [class.active]="s.active"
                          [style.left.%]="s.left" [style.width.%]="s.width"></span>
                  }
                  <span class="bmi-marker" [style.left.%]="b.marker"></span>
                </div>

                <p class="bmi-group">{{ (b.group === 'elderly' ? 'meas.bmi_group_elderly' : 'meas.bmi_group_adult') | t }}</p>
                <div class="bmi-table">
                  @for (s of b.segments; track s.label) {
                    <div class="bmi-row" [class]="'lvl-' + s.level" [class.active]="s.active">
                      <span class="dot"></span>
                      <span class="bmi-row-label">{{ s.label | t }}</span>
                      <span class="bmi-row-range">{{ rangeText(s, b.group) }}</span>
                    </div>
                  }
                </div>
              }
              <p class="bf-note">{{ 'meas.bmi_note' | t }}</p>
            } @else {
              <p class="card-sub" style="margin-bottom: 0;">{{ 'meas.bmi_need' | t }}</p>
            }
          </div>

          <!-- Gordura corporal -->
          <div class="card">
            <p class="card-title">{{ 'meas.bf' | t }}</p>
            @if (weightBreakdown(); as wb) {
              <div class="wb">
                <p class="wb-title">{{ (wb.lost ? 'meas.wb_lost' : 'meas.wb_gained') | t: { kg: wb.kg } }}</p>
                <div class="wb-bar" role="img"
                     [attr.aria-label]="('meas.fat_mass' | t) + ' ' + wb.fatPct + '%, ' + ('meas.lean_mass' | t) + ' ' + wb.leanPct + '%'">
                  <span class="fat" [style.width.%]="wb.fatPct"></span>
                  <span class="lean" [style.width.%]="wb.leanPct"></span>
                </div>
                <div class="wb-legend">
                  <div class="wb-item">
                    <span class="wb-dot fat"></span>
                    <div><strong>{{ wb.fatPct }}%</strong><small>{{ 'meas.fat_mass' | t }} · {{ wb.fatKg }} kg</small></div>
                  </div>
                  <div class="wb-item">
                    <span class="wb-dot lean"></span>
                    <div><strong>{{ wb.leanPct }}%</strong><small>{{ 'meas.lean_mass' | t }} · {{ wb.leanKg }} kg</small></div>
                  </div>
                </div>
                @if (wb.noteKey) {
                  <p class="wb-note">{{ wb.noteKey | t: { kg: wb.noteKg } }}</p>
                }
              </div>
            }
            @if (fat(); as f) {
              <div class="bf-grid">
                <div class="cell"><div class="cell-label">{{ 'meas.before' | t }}</div><div class="cell-value">{{ f.bfBefore }}<small>%</small></div></div>
                <div class="cell"><div class="cell-label">{{ 'meas.after' | t }}</div><div class="cell-value">{{ f.bfAfter }}<small>%</small></div></div>
                <div class="cell"><div class="cell-label">Δ</div><div class="cell-value" [class.up]="f.bfDiff < 0" [class.down]="f.bfDiff > 0">{{ f.bfDiff > 0 ? '+' : '' }}{{ f.bfDiff }}<small>%</small></div></div>
              </div>
              @if (f.mass; as m) {
                <div class="bf-grid">
                  <div class="cell"><div class="cell-label">{{ 'meas.fat_mass' | t }}</div><div class="cell-value">{{ m.fatBefore }} → {{ m.fatAfter }}<small>kg</small></div></div>
                  <div class="cell"><div class="cell-label">{{ 'meas.lean_mass' | t }}</div><div class="cell-value">{{ m.leanBefore }} → {{ m.leanAfter }}<small>kg</small></div></div>
                  <div class="cell"><div class="cell-label">{{ 'meas.weight' | t }}</div><div class="cell-value">{{ m.weightBefore }} → {{ m.weightAfter }}<small>kg</small></div></div>
                </div>
                <div class="bf-result" [class.good]="m.fatDiff < 0" [class.bad]="m.fatDiff > 0">
                  {{ (m.fatDiff <= 0 ? 'meas.fat_lost' : 'meas.fat_gained') | t }}: {{ absDelta(m.fatDiff) }} kg
                </div>
                <div class="bf-result" [class.good]="m.leanDiff > 0" [class.bad]="m.leanDiff < 0" style="margin-top: 8px;">
                  {{ (m.leanDiff >= 0 ? 'meas.lean_gained' : 'meas.lean_lost') | t }}: {{ absDelta(m.leanDiff) }} kg
                </div>
                @if (verdictOf(m.fatDiff, m.leanDiff); as v) {
                  <div class="bf-result verdict" [class.good]="v.tone === 'good'" [class.bad]="v.tone === 'bad'"
                       [class.mixed]="v.tone === 'mixed'" style="margin-top: 8px;">
                    {{ v.key | t }}
                  </div>
                }
              }
              <p class="bf-note">{{ 'meas.bf_note' | t }}</p>
            } @else {
              <p class="card-sub" style="margin-bottom: 0;">{{ 'meas.bf_need' | t }}</p>
            }
          </div>

          @if (progress().length === 0) {
            <p class="hint">{{ 'meas.nothing_common' | t }}</p>
          } @else {
            @for (p of progress(); track p.field.key) {
              <div class="prow">
                <div class="prow-head">
                  <span class="cell-label">{{ p.field.label | t }}</span>
                  <span class="delta-big" [class.up]="p.diff > 0" [class.down]="p.diff < 0">
                    {{ p.diff > 0 ? '▲' : p.diff < 0 ? '▼' : '=' }} {{ absDelta(p.diff) }} {{ p.field.unit }}
                  </span>
                </div>
                <div class="prow-vals">
                  <span>{{ 'meas.before' | t }}: <strong>{{ p.before }}{{ p.field.unit }}</strong></span>
                  <span>{{ 'meas.after' | t }}: <strong>{{ p.after }}{{ p.field.unit }}</strong></span>
                </div>
                @if (p.points.length > 1) {
                  <svg class="spark" viewBox="0 0 100 28" preserveAspectRatio="none" role="img" [attr.aria-label]="'meas.trend' | t">
                    <polyline [attr.points]="sparkPoints(p.points)" fill="none" stroke="var(--ft-accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
                  </svg>
                }
              </div>
            }
          }
        }
        </div>
      } @else {
        <div class="view-body">
        <!-- Gráfico de evolução -->
        <div class="card">
          <p class="card-title">{{ 'meas.chart_title' | t }}</p>
          @if (metricList().length === 0) {
            <p class="card-sub" style="margin-bottom: 0;">{{ 'meas.chart_need' | t }}</p>
          } @else {
            <!-- Escolha da medida do gráfico: lista própria (a nativa do navegador não aceita estilo) -->
            <div class="metric-pick" [class.open]="metricMenuOpen()">
              @if (currentMetric(); as cm) {
                <button type="button" class="mp-trigger" (click)="metricMenuOpen.set(!metricMenuOpen())"
                        aria-haspopup="listbox" [attr.aria-expanded]="metricMenuOpen()" [attr.aria-label]="'meas.chart_title' | t">
                  <ion-icon name="stats-chart" class="mp-icon"></ion-icon>
                  <span class="mp-label">{{ cm.label | t }}</span>
                  <span class="mp-last">{{ lastValue(cm) }}{{ cm.unit ? ' ' + cm.unit : '' }}</span>
                  <ion-icon name="chevron-down" class="mp-chev"></ion-icon>
                </button>
              }
              @if (metricMenuOpen()) {
                <div class="mp-backdrop" (click)="metricMenuOpen.set(false)"></div>
                <div class="mp-menu" role="listbox" (keydown.escape)="metricMenuOpen.set(false)">
                  @for (m of metricList(); track m.id) {
                    <button type="button" role="option" class="mp-opt" [class.active]="currentId() === m.id"
                            [attr.aria-selected]="currentId() === m.id" (click)="pickMetric(m.id)">
                      <span class="mp-opt-text">
                        <span class="mp-opt-name">{{ m.label | t }}</span>
                        <span class="mp-opt-sub">{{ lastValue(m) }}{{ m.unit ? ' ' + m.unit : '' }}</span>
                      </span>
                      <span class="mp-chg" [class.up]="m.change > 0" [class.down]="m.change < 0">
                        {{ m.change > 0 ? '▲' : m.change < 0 ? '▼' : '=' }} {{ absDelta(m.change) }}{{ m.unit }}
                      </span>
                      <ion-icon name="checkmark" class="mp-check"></ion-icon>
                    </button>
                  }
                </div>
              }
            </div>
            @if (currentMetric(); as cm) {
              <app-line-chart [points]="cm.points" [unit]="cm.unit" [ariaLabel]="cm.label | t"></app-line-chart>
              <div class="chart-sum">
                <span>{{ 'meas.chart_change' | t }}</span>
                <strong>
                  {{ cm.points[0].value }}{{ cm.unit }} → {{ lastValue(cm) }}{{ cm.unit }}
                  <span class="mp-chg" [class.up]="cm.change > 0" [class.down]="cm.change < 0">{{ cm.change > 0 ? '+' : '' }}{{ cm.change }}{{ cm.unit }}</span>
                </strong>
              </div>
            }
          }
        </div>

        <!-- Uma aba por data, da menor para a maior -->
        <div class="date-tabs" role="tablist" #dateTabs>
          @for (e of entries(); track e.item.id) {
            <button type="button" role="tab" class="date-tab" [class.active]="selectedEntry().item.id === e.item.id"
                    [attr.aria-selected]="selectedEntry().item.id === e.item.id" (click)="selectedEntryId.set(e.item.id)">
              <span class="dt-day">{{ tabDay(e.item.measuredDate) }}</span>
              <span class="dt-year">{{ tabYear(e.item.measuredDate) }}</span>
            </button>
          }
        </div>

        @if (selectedEntry(); as e) {
          <div class="entry">
            <div class="entry-head">
              <span class="entry-date">{{ formatDate(e.item.measuredDate) }}</span>
              <button class="del-btn" (click)="confirmDelete(e.item)" [attr.aria-label]="'common.delete' | t">
                <ion-icon name="trash"></ion-icon>
              </button>
            </div>
            <div class="grid">
              @if (e.bf !== null) {
                <div class="cell bf">
                  <div class="cell-label">{{ 'meas.bf_short' | t }}</div>
                  <div class="cell-value">{{ e.bf }}<small>%</small></div>
                </div>
              }
              @if (e.bmi !== null) {
                <div class="cell bmi-cell">
                  <div class="cell-label">{{ 'meas.bmi' | t }}</div>
                  <div class="cell-value">
                    {{ e.bmi }}
                    @if (e.bmiClass; as c) { <span class="bmi-badge sm" [class]="'lvl-' + c.level">{{ c.label | t }}</span> }
                  </div>
                </div>
              }
              @for (r of e.rows; track r.field.key) {
                <div class="cell">
                  <div class="cell-label">{{ r.field.label | t }}</div>
                  <div class="cell-value">
                    {{ r.value }}<small>{{ r.field.unit }}</small>
                    @if (r.delta !== null && r.delta !== 0) {
                      <span class="delta" [class.up]="r.delta > 0" [class.down]="r.delta < 0">
                        {{ r.delta > 0 ? '▲' : '▼' }} {{ absDelta(r.delta) }}
                      </span>
                    }
                  </div>
                </div>
              }
            </div>
            @if (e.item.notes) { <p class="notes">{{ e.item.notes }}</p> }
          </div>
        }
        </div>
      }
    </ion-content>

    <ion-modal [isOpen]="showForm()" (willDismiss)="showForm.set(false)">
      <ng-template>
        <div class="modal-content">
          <p class="modal-title">{{ 'meas.add' | t }}</p>

          <div class="field">
            <label>{{ 'meas.date' | t }}</label>
            <button type="button" class="date-btn" [class.open]="showCalendar()" (click)="showCalendar.set(!showCalendar())"
                    [attr.aria-expanded]="showCalendar()">
              <ion-icon name="calendar-outline"></ion-icon>
              <span class="date-btn-text">{{ form.date ? formatDate(form.date) : ('meas.date' | t) }}</span>
              <ion-icon name="chevron-down" class="date-btn-chev"></ion-icon>
            </button>
            @if (showCalendar()) {
              <div class="cal-wrap">
                <ion-datetime presentation="date" [value]="form.date" [max]="today" [locale]="i18n.locale()"
                              [firstDayOfWeek]="0" [showDefaultButtons]="false" (ionChange)="pickDate($event)"></ion-datetime>
                <div class="cal-actions">
                  <button type="button" (click)="pickToday()">{{ 'meas.today' | t }}</button>
                </div>
              </div>
            }
          </div>

          <div class="two">
            @for (f of fields; track f.key) {
              <div class="field">
                <label>{{ f.label | t }} ({{ f.unit }})</label>
                <ion-input type="number" inputmode="decimal" step="0.1" min="0" placeholder="0"
                           [(ngModel)]="form.values[f.key]" fill="outline"></ion-input>
              </div>
            }
          </div>

          <div class="field">
            <label>{{ 'meas.notes' | t }} ({{ 'common.optional' | t }})</label>
            <ion-textarea [(ngModel)]="form.notes" rows="2" maxlength="300" fill="outline"></ion-textarea>
          </div>

          @if (formError()) { <p class="form-error">{{ formError() }}</p> }

          <div class="modal-actions">
            <ion-button fill="outline" (click)="showForm.set(false)">{{ 'common.cancel' | t }}</ion-button>
            <ion-button (click)="save()" [disabled]="saving()">{{ 'common.save' | t }}</ion-button>
          </div>
        </div>
      </ng-template>
    </ion-modal>
  `
})
export class MedidasPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly alertCtrl = inject(AlertController);
  private readonly toastCtrl = inject(ToastController);
  readonly i18n = inject(I18nService);

  readonly fields = FIELDS;
  readonly today = this.localToday();

  loading = signal(true);
  entries = signal<Entry[]>([]);
  showForm = signal(false);
  showCalendar = signal(false);
  saving = signal(false);
  formError = signal('');

  form = this.emptyForm();

  view = signal<'history' | 'progress'>('history');
  /** Carregamento curto ao trocar de aba (mostra o esqueleto e depois o conteúdo entra suave) */
  switching = signal(false);
  private switchTimer: ReturnType<typeof setTimeout> | null = null;

  switchView(v: 'history' | 'progress') {
    if (this.view() === v) return;
    this.view.set(v);
    this.switching.set(true);
    if (this.switchTimer) clearTimeout(this.switchTimer);
    this.switchTimer = setTimeout(() => this.switching.set(false), 450);
  }

  /** Aba de data aberta no histórico; sem escolha (ou se o registro sumiu), mostra a mais recente (a última) */
  selectedEntryId = signal<string | null>(null);
  private readonly dateTabs = viewChild<ElementRef<HTMLElement>>('dateTabs');
  private scrolledTo: { id: string; box: HTMLElement } | null = null;
  selectedEntry = computed(() => {
    const list = this.entries();
    return list.find(e => e.item.id === this.selectedEntryId()) ?? list[list.length - 1] ?? null;
  });
  fromId = signal<string | null>(null);
  toId = signal<string | null>(null);

  /** Compara dois registros: só entram as medidas preenchidas nos dois. */
  progress = computed(() => {
    const list = this.entries();
    const from = list.find(e => e.item.id === this.fromId());
    const to = list.find(e => e.item.id === this.toId());
    if (!from || !to) return [];
    const chronological = list;
    const rows: { field: Field; before: number; after: number; diff: number; points: number[] }[] = [];
    for (const field of FIELDS) {
      const before = from.item[field.key];
      const after = to.item[field.key];
      if (before == null || after == null) continue;
      const points = chronological.map(e => e.item[field.key]).filter((v): v is number => v != null);
      rows.push({ field, before, after, diff: Math.round((after - before) * 10) / 10, points });
    }
    return rows;
  });

  periodDays = computed(() => {
    const list = this.entries();
    const a = list.find(e => e.item.id === this.fromId())?.item.measuredDate;
    const b = list.find(e => e.item.id === this.toId())?.item.measuredDate;
    if (!a || !b) return 0;
    return Math.abs(Math.round((Date.parse(b.slice(0, 10)) - Date.parse(a.slice(0, 10))) / 86_400_000));
  });

  /** Pontos da linha do tempo (caixa 100x28), do mais antigo ao mais novo. */
  sparkPoints(values: number[]): string {
    const min = Math.min(...values), max = Math.max(...values);
    const range = max - min || 1;
    return values
      .map((v, i) => `${((i / (values.length - 1)) * 100).toFixed(1)},${(26 - ((v - min) / range) * 24).toFixed(1)}`)
      .join(' ');
  }

  // --- Sexo, altura e nascimento (gordura corporal e IMC por idade) ---
  profile = signal<BodyProfile>({ sex: null, heightCm: null, birthDate: null });
  profileComplete = computed(() => !!this.profile().sex && !!this.profile().heightCm && !!this.profile().birthDate);
  editingProfile = signal(false);
  profileError = signal('');
  profileForm: { sex: Sex | null; height: number | string | null; birthDate: string | null } = { sex: null, height: null, birthDate: null };
  showBirthPicker = signal(false);
  /** Idade hoje (mostrada no resumo do perfil) */
  ageNow = computed(() => ageAt(this.profile().birthDate, this.today));

  pickBirth(ev: CustomEvent) {
    const v = ev.detail.value;
    const iso = Array.isArray(v) ? v[0] : v;
    if (typeof iso === 'string' && iso) this.profileForm.birthDate = iso.slice(0, 10);
  }

  /** Fecha as rodas; se o usuário não girou nada, fica valendo a data que aparecia nelas */
  confirmBirth() {
    if (!this.profileForm.birthDate) this.profileForm.birthDate = '1990-01-01';
    this.showBirthPicker.set(false);
  }

  /** Ordem dia/mês/ano igual à das rodas do idioma atual (ex.: en-US = mês, dia, ano) */
  wheelHeads = computed(() => {
    const parts = new Intl.DateTimeFormat(this.i18n.locale(), { day: 'numeric', month: 'long', year: 'numeric' })
      .formatToParts(new Date(2000, 0, 2))
      .map(p => p.type)
      .filter(t => t === 'day' || t === 'month' || t === 'year');
    return (parts.length === 3 ? parts : ['day', 'month', 'year']).map(t => `meas.wheel_${t}`);
  });

  formAge(): number | null {
    return ageAt(this.profileForm.birthDate, this.today);
  }

  /** Conclusão sobre gordura x massa magra, a mesma usada na imagem compartilhada */
  verdictOf(fatDiff: number, leanDiff: number) {
    return compositionVerdict(fatDiff, leanDiff);
  }

  // --- Compartilhar evolução (imagem + texto) ---
  private readonly progressShare = inject(ProgressShareService);
  sharingProgress = signal(false);

  async shareProgress() {
    const a = this.entryOf(this.fromId()), b = this.entryOf(this.toId());
    if (!a || !b || this.sharingProgress()) return;
    this.sharingProgress.set(true);
    const t = (k: string) => this.i18n.t(k);
    try {

    const f = this.fat();
    const bmi = this.bmiInfo();
    // Músculos crescendo é bom; cintura e quadril diminuindo é bom; pescoço não tem lado certo
    const better = (key: FieldKey) => MUSCLE_KEYS.has(key) ? 'up' as const : key === 'waistCm' || key === 'hipCm' ? 'down' as const : 'none' as const;
    const toRow = (p: { field: Field; before: number; after: number; diff: number }): ProgressRow =>
      ({ label: t(p.field.label), before: p.before, after: p.after, diff: p.diff, unit: p.field.unit, better: better(p.field.key) });
    // Músculos: ganhos primeiro (o que mais cresceu no topo); outras medidas: o que mais mudou
    const rows = this.progress().filter(p => p.field.key !== 'weightKg');
    const muscles = rows.filter(p => MUSCLE_KEYS.has(p.field.key)).sort((x, y) => y.diff - x.diff).map(toRow);
    const others = rows.filter(p => !MUSCLE_KEYS.has(p.field.key)).sort((x, y) => Math.abs(y.diff) - Math.abs(x.diff)).map(toRow);

    const result = await this.progressShare.share({
      from: a.measuredDate, to: b.measuredDate, days: this.periodDays(),
      weight: a.weightKg && b.weightKg ? { before: a.weightKg, after: b.weightKg } : undefined,
      lean: f?.mass ? { before: f.mass.leanBefore, after: f.mass.leanAfter } : undefined,
      fatMass: f?.mass ? { before: f.mass.fatBefore, after: f.mass.fatAfter } : undefined,
      bf: f ? { before: f.bfBefore, after: f.bfAfter } : undefined,
      bmi: bmi && bmi.before !== null ? { before: bmi.before, after: bmi.bmi, label: bmi.cls ? t(bmi.cls.label) : undefined } : undefined,
      muscles, others
    }, () => this.sharingProgress.set(false)); // tira o carregamento assim que a imagem fica pronta
    if (result === 'downloaded') (await this.toastCtrl.create({ message: t('share.downloaded'), duration: 2200 })).present();
    else if (result === 'error') (await this.toastCtrl.create({ message: t('share.error'), duration: 2200, color: 'danger' })).present();
    } finally {
      this.sharingProgress.set(false);
    }
  }

  // --- IMC ---
  /** IMC da medição mais recente com peso, e da comparação De/Até na aba Progresso */
  bmiInfo = computed(() => {
    const list = this.entries();
    const withBmi = list.filter(e => e.bmi !== null);
    const from = list.find(e => e.item.id === this.fromId());
    const to = list.find(e => e.item.id === this.toId());
    // Na aba Progresso usa a data "Até"; sem ela, a última medição com peso
    const current = to?.bmi != null ? to : withBmi[withBmi.length - 1] ?? null;
    if (!current || current.bmi === null) return null;

    const group = current.bmiGroup;
    const ranges = bmiRanges(group);
    // Escala visual de 15 a 45 de IMC
    const MIN = 15, MAX = 45;
    const pos = (v: number) => Math.min(100, Math.max(0, ((v - MIN) / (MAX - MIN)) * 100));
    const segments = ranges.map(r => ({
      ...r,
      left: pos(r.from ?? MIN),
      width: pos(r.to ?? MAX) - pos(r.from ?? MIN),
      active: r === current.bmiClass
    }));
    const before = from && from !== current && from.bmi !== null ? from.bmi : null;
    return {
      bmi: current.bmi,
      cls: current.bmiClass,
      group,
      date: current.item.measuredDate,
      marker: pos(current.bmi),
      segments,
      before,
      diff: before !== null ? Math.round((current.bmi - before) * 10) / 10 : null
    };
  });

  rangeText(r: BmiRange, group: BmiGroup): string {
    const n = (v: number) => v.toLocaleString(this.i18n.locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    if (group === 'elderly') {
      if (r.from === null) return `≤ ${n(r.to!)}`;
      if (r.to === null) return `≥ ${n(r.from)}`;
      return r.to === 30 ? `${n(27.1)} – ${n(29.9)}` : `${n(r.from)} – ${n(r.to)}`;
    }
    if (r.from === null) return `< ${n(r.to!)}`;
    if (r.to === null) return `≥ ${n(r.from)}`;
    return `${n(r.from)} – ${n(Math.round((r.to - 0.1) * 10) / 10)}`;
  }

  // --- Gráfico de evolução (histórico) ---
  metricId = signal<string | null>(null);

  /** Séries com pelo menos 2 pontos: gordura, massa gorda/magra, peso e cada medida. */
  metricList = computed(() => {
    const chronological = this.entries();
    const r1 = (n: number) => Math.round(n * 10) / 10;
    const defs: { id: string; label: string; unit: string; get: (e: Entry) => number | null }[] = [
      { id: 'bf', label: 'meas.bf', unit: '%', get: e => e.bf },
      { id: 'bmi', label: 'meas.bmi', unit: '', get: e => e.bmi },
      {
        id: 'fat', label: 'meas.fat_mass', unit: 'kg',
        get: e => (e.bf !== null && e.item.weightKg ? r1(e.item.weightKg * e.bf / 100) : null)
      },
      {
        id: 'lean', label: 'meas.lean_mass', unit: 'kg',
        get: e => (e.bf !== null && e.item.weightKg ? r1(e.item.weightKg - e.item.weightKg * e.bf / 100) : null)
      },
      ...FIELDS.map(f => ({ id: f.key as string, label: f.label, unit: f.unit, get: (e: Entry) => e.item[f.key] ?? null }))
    ];

    return defs
      .map(d => {
        const points: ChartPoint[] = chronological
          .map(e => ({ v: d.get(e), e }))
          .filter((x): x is { v: number; e: Entry } => x.v !== null)
          .map(x => ({ t: Date.parse(x.e.item.measuredDate.slice(0, 10)), value: x.v, label: this.shortDate(x.e.item.measuredDate) }));
        const change = points.length ? r1(points[points.length - 1].value - points[0].value) : 0;
        return { id: d.id, label: d.label, unit: d.unit, points, change };
      })
      .filter(m => m.points.length >= 2);
  });

  currentMetric = computed(() => {
    const list = this.metricList();
    return list.find(m => m.id === this.metricId()) ?? list[0] ?? null;
  });

  currentId = computed(() => this.currentMetric()?.id ?? null);

  metricMenuOpen = signal(false);

  pickMetric(id: string) {
    this.metricId.set(id);
    this.metricMenuOpen.set(false);
  }

  /** Valor mais recente de uma série do gráfico */
  lastValue(m: { points: ChartPoint[] }): number {
    return m.points[m.points.length - 1]?.value ?? 0;
  }

  shortDate(iso: string): string {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(this.i18n.locale(), { day: '2-digit', month: 'short' });
  }

  private entryOf(id: string | null): BodyMeasurement | null {
    return this.entries().find(e => e.item.id === id)?.item ?? null;
  }

  /** Gordura estimada nas duas datas + massa gorda/magra quando há peso nos dois registros. */
  fat = computed(() => {
    const a = this.entryOf(this.fromId()), b = this.entryOf(this.toId());
    const { sex, heightCm } = this.profile();
    if (!a || !b) return null;
    const bfBefore = navyBodyFat(a, sex, heightCm);
    const bfAfter = navyBodyFat(b, sex, heightCm);
    if (bfBefore === null || bfAfter === null) return null;

    const r1 = (n: number) => Math.round(n * 10) / 10;
    let mass = null as null | {
      fatBefore: number; fatAfter: number; fatDiff: number;
      leanBefore: number; leanAfter: number; leanDiff: number; weightBefore: number; weightAfter: number;
    };
    if (a.weightKg && b.weightKg) {
      const fatBefore = r1(a.weightKg * bfBefore / 100), fatAfter = r1(b.weightKg * bfAfter / 100);
      const leanBefore = r1(a.weightKg - fatBefore), leanAfter = r1(b.weightKg - fatAfter);
      mass = {
        fatBefore, fatAfter, fatDiff: r1(fatAfter - fatBefore),
        leanBefore, leanAfter, leanDiff: r1(leanAfter - leanBefore),
        weightBefore: a.weightKg, weightAfter: b.weightKg
      };
    }
    return { bfBefore, bfAfter, bfDiff: r1(bfAfter - bfBefore), mass };
  });

  /**
   * Do peso que mudou, quanto foi gordura e quanto foi massa magra (em % e kg).
   * Se uma parte foi no sentido contrário (ex.: perdeu peso mas ganhou massa magra), ela vira uma nota.
   */
  weightBreakdown = computed(() => {
    const m = this.fat()?.mass;
    if (!m) return null;
    const r1 = (n: number) => Math.round(n * 10) / 10;
    const dw = r1(m.weightAfter - m.weightBefore);
    if (Math.abs(dw) < 0.1) return null;
    const lost = dw < 0;
    // Só conta a parte que foi no mesmo sentido do peso
    const fatPart = Math.max(0, lost ? -m.fatDiff : m.fatDiff);
    const leanPart = Math.max(0, lost ? -m.leanDiff : m.leanDiff);
    const total = fatPart + leanPart;
    if (total === 0) return null;
    const fatPct = Math.round((fatPart / total) * 100);
    const fmt = (n: number) => r1(n).toLocaleString(this.i18n.locale());
    let noteKey: string | null = null, noteKg = '';
    if (lost && m.leanDiff > 0.3) { noteKey = 'meas.wb_lean_up'; noteKg = fmt(m.leanDiff); }
    if (!lost && m.fatDiff < -0.3) { noteKey = 'meas.wb_fat_down'; noteKg = fmt(-m.fatDiff); }
    return {
      lost, kg: fmt(Math.abs(dw)),
      fatPct, leanPct: 100 - fatPct, fatKg: fmt(fatPart), leanKg: fmt(leanPart),
      noteKey, noteKg
    };
  });

  loadProfile() {
    this.api.get<{ sex: Sex | null; heightCm: number | null; birthDate: string | null }>('/api/measurements/profile').subscribe({
      next: p => {
        const birthDate = p.birthDate ? p.birthDate.slice(0, 10) : null;
        this.profile.set({ sex: p.sex ?? null, heightCm: p.heightCm ?? null, birthDate });
        this.profileForm = { sex: p.sex ?? null, height: p.heightCm ?? null, birthDate };
        // Entradas dependem do perfil (gordura estimada por registro)
        this.rebuildEntriesFromRaw();
      },
      error: () => {}
    });
  }

  startEditProfile() {
    const p = this.profile();
    this.profileForm = { sex: p.sex, height: p.heightCm, birthDate: p.birthDate };
    this.showBirthPicker.set(false);
    this.profileError.set('');
    this.editingProfile.set(true);
  }

  saveProfile() {
    const height = Number(String(this.profileForm.height ?? '').replace(',', '.'));
    const birthDate = this.profileForm.birthDate;
    if (!this.profileForm.sex || !Number.isFinite(height) || height < 80 || height > 250 || !birthDate || birthDate > this.today) {
      this.profileError.set(this.i18n.t('meas.profile_invalid'));
      return;
    }
    this.profileError.set('');
    this.api.put<void>('/api/measurements/profile', { sex: this.profileForm.sex, heightCm: height, birthDate }).subscribe({
      next: async () => {
        this.profile.set({ sex: this.profileForm.sex, heightCm: height, birthDate });
        this.editingProfile.set(false);
        this.showBirthPicker.set(false);
        this.rebuildEntriesFromRaw();
        (await this.toastCtrl.create({ message: this.i18n.t('meas.profile_saved'), duration: 1600, color: 'success' })).present();
      },
      error: async err => {
        const message = err?.error?.message ?? this.i18n.t('meas.error');
        (await this.toastCtrl.create({ message, duration: 2400, color: 'danger' })).present();
      }
    });
  }

  private raw: BodyMeasurement[] = [];

  private rebuildEntriesFromRaw() {
    if (this.raw.length) this.entries.set(this.buildEntries(this.raw));
  }

  constructor() {
    // A aba aberta (por padrão a mais recente, no fim da fileira) sempre fica visível
    afterRender(() => {
      const id = this.selectedEntry()?.item.id ?? null;
      const box = this.dateTabs()?.nativeElement;
      if (!box || !id || (this.scrolledTo?.id === id && this.scrolledTo.box === box)) return;
      this.scrolledTo = { id, box }; // box muda quando a lista é recriada (ex.: voltar da aba Progresso)
      const tab = box.querySelector<HTMLElement>('.date-tab.active');
      if (tab) box.scrollTo({ left: tab.offsetLeft - box.clientWidth / 2 + tab.offsetWidth / 2, behavior: 'smooth' });
    });
    addIcons({ add, trash, bodyOutline, calendarOutline, chevronDown, shareSocial, statsChart, checkmark });
  }

  ngOnInit() {
    this.loadProfile();
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.get<BodyMeasurement[]>('/api/measurements/me').subscribe({
      next: list => {
        this.raw = list;
        const entries = this.buildEntries(list);
        this.entries.set(entries);
        // Padrão da comparação: primeiro registro (mais antigo) contra o último (mais recente)
        const ids = new Set(entries.map(e => e.item.id));
        if (entries.length >= 2) {
          if (!ids.has(this.fromId() ?? '')) this.fromId.set(entries[0].item.id);
          if (!ids.has(this.toId() ?? '')) this.toId.set(entries[entries.length - 1].item.id);
        }
        this.loading.set(false);
      },
      error: () => { this.entries.set([]); this.loading.set(false); }
    });
  }

  handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    this.load();
    setTimeout(() => event.detail.complete(), 800);
  }

  /** Para cada medida, compara com o registro anterior que tenha o mesmo campo preenchido. */
  private buildEntries(raw: BodyMeasurement[]): Entry[] {
    // Sempre da data menor para a maior (no mesmo dia, pela ordem em que foi cadastrado)
    const list = [...raw].sort((a, b) =>
      a.measuredDate.slice(0, 10).localeCompare(b.measuredDate.slice(0, 10)) || a.createdAt.localeCompare(b.createdAt));
    return list.map((item, i) => {
      const rows: Row[] = [];
      for (const field of FIELDS) {
        const value = item[field.key];
        if (value == null) continue;
        const previous = list.slice(0, i).reverse().find(o => o[field.key] != null);
        const delta = previous ? Math.round((value - (previous[field.key] as number)) * 10) / 10 : null;
        rows.push({ field, value, delta });
      }
      const { sex, heightCm, birthDate } = this.profile();
      const bmi = bmiOf(item.weightKg, heightCm);
      const group = bmiGroup(ageAt(birthDate, item.measuredDate));
      return { item, rows, bf: navyBodyFat(item, sex, heightCm), bmi, bmiClass: bmi === null ? null : classifyBmi(bmi, group), bmiGroup: group };
    });
  }

  absDelta(d: number): number { return Math.abs(d); }

  formatDate(iso: string): string {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(this.i18n.locale(), { day: '2-digit', month: 'short', year: 'numeric' });
  }

  tabDay(iso: string): string {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(this.i18n.locale(), { day: '2-digit', month: 'short' }).replace('.', '');
  }

  tabYear(iso: string): string {
    return iso.slice(0, 4);
  }

  private localToday(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private emptyForm() {
    return { date: this.localToday(), values: {} as Partial<Record<FieldKey, string | number | null>>, notes: '' };
  }

  openForm() {
    this.form = this.emptyForm();
    this.formError.set('');
    this.showCalendar.set(false);
    this.showForm.set(true);
  }

  /** Data escolhida no calendário (vem como ISO; guarda só AAAA-MM-DD) e fecha o calendário */
  pickDate(ev: CustomEvent) {
    const v = ev.detail.value;
    const iso = Array.isArray(v) ? v[0] : v;
    if (typeof iso === 'string' && iso) this.form.date = iso.slice(0, 10);
    this.showCalendar.set(false);
  }

  pickToday() {
    this.form.date = this.today;
    this.showCalendar.set(false);
  }

  save() {
    const body: Record<string, unknown> = { measuredDate: this.form.date || null, notes: this.form.notes.trim() || null };
    let filled = 0;
    for (const f of FIELDS) {
      const raw = this.form.values[f.key];
      const n = raw === null || raw === undefined || raw === '' ? NaN : Number(String(raw).replace(',', '.'));
      if (Number.isFinite(n) && n > 0) { body[f.key] = n; filled++; }
    }
    if (!filled) { this.formError.set(this.i18n.t('meas.need_one')); return; }

    this.formError.set('');
    this.saving.set(true);
    this.api.post<BodyMeasurement>('/api/measurements', body).subscribe({
      next: async () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.selectedEntryId.set(null); // volta para a aba mais recente
        this.load();
        (await this.toastCtrl.create({ message: this.i18n.t('meas.saved'), duration: 1800, color: 'success', position: 'bottom' })).present();
      },
      error: async err => {
        this.saving.set(false);
        const message = err?.error?.message ?? this.i18n.t('meas.error');
        (await this.toastCtrl.create({ message, duration: 2400, color: 'danger', position: 'bottom' })).present();
      }
    });
  }

  async confirmDelete(item: BodyMeasurement) {
    const alert = await this.alertCtrl.create({
      header: this.i18n.t('meas.delete_title'),
      message: this.i18n.t('meas.delete_msg', { date: this.formatDate(item.measuredDate) }),
      cssClass: 'fitmob-alert',
      buttons: [
        { text: this.i18n.t('common.cancel'), role: 'cancel' },
        {
          text: this.i18n.t('common.delete'),
          role: 'destructive',
          handler: () => {
            this.api.delete<void>(`/api/measurements/${item.id}`).subscribe({
              next: () => this.load(),
              error: async () => (await this.toastCtrl.create({ message: this.i18n.t('common.delete_error'), duration: 2000, color: 'danger' })).present()
            });
          }
        }
      ]
    });
    await alert.present();
  }
}
