import { Injectable, computed, inject, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Diet } from '../models';
import { I18nService } from '../i18n/i18n.service';

export type ReminderSound = 'bip' | 'sino' | 'alarme';

export interface ReminderSettings {
  enabled: boolean;
  minutesBefore: number;
  sound: ReminderSound;
  disabledMealIds: string[];
}

export interface MealReminder {
  mealId: string;
  mealName: string;
  dietName: string;
  mealTime: string; // HH:mm
}

const SETTINGS_KEY = 'fitmob_meal_reminders';
const MEALS_KEY = 'fitmob_meal_reminder_list';
const FIRED_KEY = 'fitmob_meal_reminder_fired';
const CHANNEL_ID = 'meal-reminders';
// Faixa de ids reservada para os lembretes, para cancelar só os nossos
const ID_BASE = 7000;

const DEFAULTS: ReminderSettings = { enabled: false, minutesBefore: 0, sound: 'bip', disabledMealIds: [] };

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function readArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeJson(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

@Injectable({ providedIn: 'root' })
export class MealReminderService {
  readonly isNative = Capacitor.isNativePlatform();

  readonly settings = signal<ReminderSettings>(readJson(SETTINGS_KEY, DEFAULTS));
  readonly meals = signal<MealReminder[]>(readArray<MealReminder>(MEALS_KEY));
  readonly permissionDenied = signal(false);
  /** Lembrete que acabou de disparar com o app aberto (a tela mostra um aviso) */
  readonly ringing = signal<MealReminder | null>(null);

  readonly activeMeals = computed(() => {
    const s = this.settings();
    return this.meals().filter(m => !s.disabledMealIds.includes(m.mealId));
  });

  readonly nextReminder = computed(() => {
    const s = this.settings();
    if (!s.enabled) return null;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    let best: { meal: MealReminder; at: string; inMin: number } | null = null;
    for (const m of this.activeMeals()) {
      const alertMin = this.alertMinutes(m.mealTime, s.minutesBefore);
      const inMin = (alertMin - nowMin + 1440) % 1440;
      if (!best || inMin < best.inMin) best = { meal: m, at: this.fmt(alertMin), inMin };
    }
    return best;
  });

  private readonly i18n = inject(I18nService);
  private audioCtx?: AudioContext;
  private webTimer?: ReturnType<typeof setInterval>;

  constructor() {
    if (this.isNative) {
      // Notificação chegou com o app aberto: toca o som escolhido e mostra o aviso na tela
      LocalNotifications.addListener('localNotificationReceived', n => {
        const meal = this.meals().find(m => m.mealId === n.extra?.mealId);
        if (meal) this.ring(meal);
      });
    } else {
      this.startWebChecker();
    }
  }

  // ---------- Configuração ----------

  async update(patch: Partial<ReminderSettings>) {
    const next = { ...this.settings(), ...patch };
    if (patch.enabled && !(await this.ensurePermission())) {
      next.enabled = false;
    }
    this.settings.set(next);
    writeJson(SETTINGS_KEY, next);
    await this.reschedule();
  }

  toggleMeal(mealId: string, on: boolean) {
    const ids = new Set(this.settings().disabledMealIds);
    on ? ids.delete(mealId) : ids.add(mealId);
    this.update({ disabledMealIds: [...ids] });
  }

  isMealOn(mealId: string): boolean {
    return !this.settings().disabledMealIds.includes(mealId);
  }

  /** Chamado sempre que as dietas carregam, para manter horários em dia */
  async syncFromDiets(diets: Diet[]) {
    const list: MealReminder[] = [];
    for (const d of diets)
      for (const m of d.meals ?? [])
        if (m.mealTime && /^\d{2}:\d{2}/.test(m.mealTime))
          list.push({ mealId: m.id, mealName: m.name, dietName: d.name, mealTime: m.mealTime.slice(0, 5) });
    list.sort((a, b) => a.mealTime.localeCompare(b.mealTime));
    this.meals.set(list);
    writeJson(MEALS_KEY, list);
    await this.reschedule();
  }

  // ---------- Agendamento ----------

  private async reschedule() {
    if (!this.isNative) return; // no navegador o verificador por intervalo cuida disso

    const pending = await LocalNotifications.getPending();
    const ours = pending.notifications.filter(n => n.id >= ID_BASE && n.id < ID_BASE + 1000);
    if (ours.length) await LocalNotifications.cancel({ notifications: ours.map(n => ({ id: n.id })) });

    const s = this.settings();
    if (!s.enabled) return;

    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: this.i18n.t('rem.channel_name'),
      description: this.i18n.t('rem.channel_desc'),
      importance: 5,
      vibration: true,
      visibility: 1
    }).catch(() => {}); // iOS não usa canais

    await LocalNotifications.schedule({
      notifications: this.activeMeals().map((m, i) => {
        const alertMin = this.alertMinutes(m.mealTime, s.minutesBefore);
        return {
          id: ID_BASE + i,
          title: `🍽️ ${m.mealName}`,
          body: s.minutesBefore
            ? this.i18n.t('rem.notif_before', { n: s.minutesBefore, time: m.mealTime, diet: m.dietName })
            : this.i18n.t('rem.notif_now', { time: m.mealTime, diet: m.dietName }),
          channelId: CHANNEL_ID,
          extra: { mealId: m.mealId },
          // Repete todo dia nesse horário
          schedule: { on: { hour: Math.floor(alertMin / 60), minute: alertMin % 60 }, allowWhileIdle: true }
        };
      })
    });
  }

  private async ensurePermission(): Promise<boolean> {
    try {
      if (this.isNative) {
        const status = await LocalNotifications.requestPermissions();
        this.permissionDenied.set(status.display !== 'granted');
        return status.display === 'granted';
      }
      // No navegador o som toca mesmo sem permissão; a notificação do sistema é um extra
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      this.permissionDenied.set('Notification' in window && Notification.permission === 'denied');
      this.unlockAudio();
      return true;
    } catch {
      return !this.isNative;
    }
  }

  // ---------- Navegador: verificação enquanto o app está aberto ----------

  private startWebChecker() {
    this.webTimer = setInterval(() => this.checkWeb(), 15000);
  }

  private checkWeb() {
    const s = this.settings();
    if (!s.enabled) return;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const today = now.toDateString();
    const fired = readJson<Record<string, string>>(FIRED_KEY, {});

    for (const m of this.activeMeals()) {
      if (this.alertMinutes(m.mealTime, s.minutesBefore) !== nowMin) continue;
      const key = `${m.mealId}@${m.mealTime}-${s.minutesBefore}`;
      if (fired[key] === today) continue;
      fired[key] = today;
      writeJson(FIRED_KEY, fired);
      this.ring(m);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`🍽️ ${m.mealName}`, { body: this.i18n.t('rem.notif_now', { time: m.mealTime, diet: m.dietName }) });
      }
    }
  }

  // ---------- Alarme contínuo (até a pessoa parar) ----------

  readonly snoozeMinutes = 5;
  /** Horário em que a soneca vai tocar de novo (para mostrar na tela) */
  readonly snoozedUntil = signal<string | null>(null);
  private ringLoop?: ReturnType<typeof setInterval>;
  private ringTimeout?: ReturnType<typeof setTimeout>;
  private snoozeTimer?: ReturnType<typeof setTimeout>;

  /** Toca o som em repetição, vibrando, até "Parar alarme" (ou 2 min, por segurança) */
  ring(meal: MealReminder) {
    this.stopLoop();
    this.ringing.set(meal);
    const beat = () => {
      this.playSound(this.settings().sound);
      try { navigator.vibrate?.([400, 200, 400]); } catch {}
    };
    beat();
    this.ringLoop = setInterval(beat, 3000);
    this.ringTimeout = setTimeout(() => this.stopLoop(), 2 * 60 * 1000);
  }

  /** Parar alarme */
  dismissRinging() {
    this.stopLoop();
    this.ringing.set(null);
  }

  /** Para agora e toca de novo daqui a alguns minutos */
  async snooze() {
    const meal = this.ringing();
    this.dismissRinging();
    if (!meal) return;

    const at = new Date(Date.now() + this.snoozeMinutes * 60 * 1000);
    this.snoozedUntil.set(this.fmt(at.getHours() * 60 + at.getMinutes()));
    clearTimeout(this.snoozeTimer);
    // Com o app aberto, o próprio app toca de novo
    this.snoozeTimer = setTimeout(() => { this.snoozedUntil.set(null); this.ring(meal); }, this.snoozeMinutes * 60 * 1000);

    // No celular, agenda também uma notificação única, caso o app seja fechado
    if (this.isNative) {
      await LocalNotifications.schedule({
        notifications: [{
          id: ID_BASE + 999,
          title: `🍽️ ${meal.mealName}`,
          body: this.i18n.t('rem.notif_now', { time: meal.mealTime, diet: meal.dietName }),
          channelId: CHANNEL_ID,
          extra: { mealId: meal.mealId },
          schedule: { at, allowWhileIdle: true }
        }]
      }).catch(() => {});
    }
  }

  private stopLoop() {
    clearInterval(this.ringLoop);
    clearTimeout(this.ringTimeout);
    this.ringLoop = undefined;
    try { navigator.vibrate?.(0); } catch {}
  }

  // ---------- Som (gerado na hora, sem arquivos de áudio) ----------

  /** O navegador só libera áudio depois de um toque do usuário */
  unlockAudio() {
    try {
      this.audioCtx ??= new AudioContext();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    } catch {}
  }

  playSound(kind: ReminderSound) {
    this.unlockAudio();
    const ctx = this.audioCtx;
    if (!ctx) return;

    const tone = (freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.25) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      const t = ctx.currentTime + start;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    };

    if (kind === 'bip') {
      [0, 0.25, 0.5].forEach(s => tone(880, s, 0.15, 'square', 0.12));
    } else if (kind === 'sino') {
      [[1047, 0], [1319, 0.18], [1568, 0.36]].forEach(([f, s]) => tone(f, s, 1.2, 'sine', 0.3));
    } else {
      // alarme: 3 rajadas alternando duas notas
      for (let r = 0; r < 3; r++)
        for (let i = 0; i < 4; i++) tone(i % 2 ? 660 : 990, r * 0.9 + i * 0.12, 0.1, 'sawtooth', 0.1);
    }
  }

  // ---------- util ----------

  private alertMinutes(hhmm: string, before: number): number {
    const [h, m] = hhmm.split(':').map(Number);
    return ((h * 60 + m - before) % 1440 + 1440) % 1440;
  }

  private fmt(min: number): string {
    return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
  }
}
