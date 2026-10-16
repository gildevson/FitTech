import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { I18nService } from '../i18n/i18n.service';

export interface ShareExercise {
  name: string;
  sets: number;      // séries feitas
  reps: string;      // "10" ou "8-12"
  maxKg: number | null;
}

export interface WorkoutShareData {
  workoutName: string;
  date: Date;
  duration: string;  // "32:10"
  setsDone: number;
  setsTotal: number;
  volumeKg: number;
  /** Calorias gastas (estimadas ou informadas pelo usuário) */
  kcal?: number;
  exercises: ShareExercise[];
}

export type ShareResult = 'shared' | 'downloaded' | 'cancelled' | 'error';

/** Cores das imagens de compartilhar, tiradas do tema atual do app (claro laranja ou escuro). */
export interface SharePalette {
  light: boolean;
  bgTop: string; bgBottom: string;
  accent: string; accentRgb: string; accentText: string;
  text: string; soft: string; muted: string; faint: string;
  box: string; boxBorder: string;
  good: string; bad: string;
}

export function sharePalette(): SharePalette {
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  const light = root.classList.contains('theme-light');
  return {
    light,
    bgTop: light ? '#ffffff' : '#141a2e',
    bgBottom: v('--ft-bg', '#0b1020'),
    accent: v('--ft-accent', '#e94560'),
    accentRgb: v('--ft-accent-rgb', '233, 69, 96'),
    accentText: light ? v('--ft-accent-strong', '#d9560b') : '#ff8da1',
    text: v('--ft-text', '#f1f4fb'),
    soft: light ? '#3b4256' : '#c9cfdb',
    muted: v('--ft-text-muted', '#9aa3b5'),
    faint: v('--ft-text-faint', '#6b7488'),
    box: light ? '#ffffff' : 'rgba(255,255,255,0.06)',
    boxBorder: light ? 'rgba(20,24,40,0.10)' : 'rgba(255,255,255,0.10)',
    good: v('--ft-success', '#3ecf8e'),
    bad: v('--ft-danger', '#ff5c6c')
  };
}

const W = 1080;
const H = 1350; // 4:5, bom para Instagram e WhatsApp

@Injectable({ providedIn: 'root' })
export class WorkoutShareService {
  private readonly i18n = inject(I18nService);

  async share(data: WorkoutShareData, onReady?: () => void): Promise<ShareResult> {
    let blob: Blob | null = null;
    try { blob = await this.drawCard(data); } catch { blob = null; }
    return this.shareImage(blob, this.buildText(data), data.workoutName, 'treino-fitmob', onReady);
  }

  /**
   * Compartilha uma imagem + texto pelo melhor caminho disponível (app nativo, celular ou download no computador).
   * `onReady` é chamado quando a imagem já está pronta e a janela de compartilhar vai abrir: a tela pode tirar o
   * carregamento nesse momento, porque a promessa do compartilhamento só termina quando o usuário fecha a janela
   * (e em alguns navegadores de computador ela nunca termina).
   */
  async shareImage(blob: Blob | null, text: string, title: string, fileName: string, onReady?: () => void): Promise<ShareResult> {
    try {
      if (Capacitor.isNativePlatform()) {
        onReady?.();
        return await this.shareNative(blob, text, fileName);
      }

      // Só usa a janela de compartilhar do navegador no celular; no computador ela pode não abrir e travar
      if (this.isMobileBrowser()) {
        const file = blob ? new File([blob], `${fileName}.png`, { type: 'image/png' }) : null;
        try {
          if (file && navigator.canShare?.({ files: [file] })) {
            onReady?.();
            await navigator.share({ files: [file], text });
            return 'shared';
          }
          if (navigator.share) {
            onReady?.();
            await navigator.share({ title, text });
            return 'shared';
          }
        } catch (err) {
          // Fechar a janela de compartilhar não é erro; outros erros (ex.: permissão) caem no download abaixo
          if (err instanceof Error && /abort|cancel/i.test(err.name + err.message)) return 'cancelled';
        }
      }

      // Computador (ou sem compartilhamento): baixa a imagem e copia o texto
      onReady?.();
      if (blob) this.download(blob, fileName);
      try { await navigator.clipboard?.writeText(text); } catch {}
      return blob ? 'downloaded' : 'error';
    } catch {
      onReady?.();
      return 'error';
    }
  }

  private isMobileBrowser(): boolean {
    const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
    return uaData?.mobile ?? /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  }

  private async shareNative(blob: Blob | null, text: string, fileName: string): Promise<ShareResult> {
    if (!blob) {
      await Share.share({ text });
      return 'shared';
    }
    // O compartilhamento nativo precisa de um arquivo: grava a imagem no cache do app
    const base64 = await this.blobToBase64(blob);
    const saved = await Filesystem.writeFile({
      path: `${fileName}-${Date.now()}.png`,
      data: base64,
      directory: Directory.Cache
    });
    await Share.share({ text, files: [saved.uri] });
    return 'shared';
  }

  /** Texto que acompanha a imagem (ou vai sozinho quando não dá para mandar imagem) */
  buildText(d: WorkoutShareData): string {
    const lines = [
      `🏋️ ${this.i18n.t('share.done_line', { name: d.workoutName })}`,
      `⏱ ${d.duration} · ✅ ${d.setsDone}/${d.setsTotal} ${this.i18n.t('session.sets')}` +
        (d.volumeKg > 0 ? ` · 💪 ${this.fmtNumber(d.volumeKg)} kg` : '') +
        (d.kcal ? ` · 🔥 ${this.fmtNumber(d.kcal)} kcal` : ''),
      ...d.exercises.slice(0, 8).map(e => `• ${e.name} — ${e.sets}×${e.reps}${e.maxKg ? ` · ${this.fmtNumber(e.maxKg)} kg` : ''}`),
      '',
      this.i18n.t('share.footer')
    ];
    return lines.join('\n');
  }

  // ---------- Imagem ----------

  private async drawCard(d: WorkoutShareData): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    const font = (size: number, weight = 700) => `${weight} ${size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
    const p = sharePalette();
    const accent = p.accent;

    // Fundo
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, p.bgTop);
    bg.addColorStop(1, p.bgBottom);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, -120, 40, W / 2, -120, 700);
    glow.addColorStop(0, `rgba(${p.accentRgb},${p.light ? 0.22 : 0.35})`);
    glow.addColorStop(1, `rgba(${p.accentRgb},0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Marca
    ctx.textAlign = 'left';
    ctx.fillStyle = p.text;
    ctx.font = font(44, 800);
    ctx.fillText('Fit', 80, 120);
    const fitW = ctx.measureText('Fit').width;
    ctx.fillStyle = accent;
    ctx.fillText('Mob', 80 + fitW, 120);

    ctx.textAlign = 'right';
    ctx.fillStyle = p.muted;
    ctx.font = font(32, 500);
    ctx.fillText(d.date.toLocaleDateString(this.i18n.locale(), { day: '2-digit', month: 'short', year: 'numeric' }), W - 80, 120);

    // Selo de concluído
    ctx.textAlign = 'center';
    ctx.beginPath();
    ctx.arc(W / 2, 290, 78, 0, Math.PI * 2);
    ctx.fillStyle = p.good;
    ctx.fill();
    ctx.lineWidth = 18;
    ctx.strokeStyle = p.light ? 'rgba(22,163,74,0.18)' : 'rgba(34,197,94,0.22)';
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = font(88, 800);
    ctx.fillText('✓', W / 2, 322);

    ctx.fillStyle = p.text;
    ctx.font = font(64, 800);
    ctx.fillText(this.i18n.t('session.done_title'), W / 2, 470);
    ctx.fillStyle = p.soft;
    ctx.font = font(42, 600);
    ctx.fillText(this.ellipsis(ctx, d.workoutName, W - 160), W / 2, 535);

    // Estatísticas
    const stats = [
      { value: d.duration, label: this.i18n.t('session.duration') },
      { value: `${d.setsDone}/${d.setsTotal}`, label: this.i18n.t('session.sets') },
      ...(d.volumeKg > 0 ? [{ value: this.fmtNumber(d.volumeKg), label: this.i18n.t('session.volume') }] : []),
      ...(d.kcal ? [{ value: this.fmtNumber(d.kcal), label: '🔥 ' + this.i18n.t('session.kcal') }] : [])
    ];
    const gap = 24;
    const boxW = (W - 160 - gap * (stats.length - 1)) / stats.length;
    stats.forEach((s, i) => {
      const x = 80 + i * (boxW + gap);
      this.roundRect(ctx, x, 600, boxW, 170, 28);
      ctx.fillStyle = p.box;
      ctx.fill();
      ctx.strokeStyle = p.boxBorder;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = p.text;
      // Com 4 caixas o número fica menor para caber
      ctx.font = font(stats.length > 3 ? 50 : 58, 800);
      ctx.fillText(s.value, x + boxW / 2, 690);
      ctx.fillStyle = p.muted;
      ctx.font = font(28, 600);
      ctx.fillText(s.label.toUpperCase(), x + boxW / 2, 735);
    });

    // Exercícios
    const list = d.exercises.slice(0, 6);
    let y = 860;
    ctx.textAlign = 'left';
    for (const e of list) {
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(96, y - 12, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.text;
      ctx.font = font(36, 700);
      ctx.fillText(this.ellipsis(ctx, e.name, 560), 124, y);

      ctx.textAlign = 'right';
      ctx.fillStyle = p.soft;
      ctx.font = font(34, 600);
      ctx.fillText(`${e.sets}×${e.reps}${e.maxKg ? `  ·  ${this.fmtNumber(e.maxKg)} kg` : ''}`, W - 80, y);
      ctx.textAlign = 'left';
      y += 66;
    }
    if (d.exercises.length > list.length) {
      ctx.fillStyle = p.muted;
      ctx.font = font(30, 600);
      ctx.fillText(this.i18n.t('share.more', { n: d.exercises.length - list.length }), 124, y);
    }

    // Rodapé
    ctx.textAlign = 'center';
    ctx.fillStyle = p.faint;
    ctx.font = font(28, 600);
    ctx.fillText(this.i18n.t('share.footer'), W / 2, H - 70);

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('canvas'))), 'image/png'));
  }

  roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  ellipsis(ctx: CanvasRenderingContext2D, text: string, max: number): string {
    if (ctx.measureText(text).width <= max) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(t + '…').width > max) t = t.slice(0, -1);
    return t + '…';
  }

  private fmtNumber(n: number): string {
    return new Intl.NumberFormat(this.i18n.locale(), { maximumFractionDigits: 1 }).format(n);
  }

  private download(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
