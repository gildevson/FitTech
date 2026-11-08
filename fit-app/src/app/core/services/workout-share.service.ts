import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { I18nService } from '../i18n/i18n.service';
import { ProfilePhotoService } from './profile-photo.service';

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

/** Mesma fonte do app (Inter, ver global.scss), para o cartão ter o mesmo padrão em qualquer aparelho. */
const SHARE_FONT_FAMILY = `Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;

export function shareFont(size: number, weight = 700): string {
  return `${weight} ${size}px ${SHARE_FONT_FAMILY}`;
}

/** O canvas não espera a fonte da web carregar: garante a Inter nos pesos usados antes de desenhar. */
export async function loadShareFonts(): Promise<void> {
  try {
    await Promise.all([500, 600, 700, 800].map(w => document.fonts.load(`${w} 32px Inter`)));
  } catch {
    // Sem internet ou sem suporte: desenha com a fonte do sistema
  }
}

const W = 1080;
const H = 1350; // 4:5, bom para Instagram e WhatsApp

@Injectable({ providedIn: 'root' })
export class WorkoutShareService {
  private readonly i18n = inject(I18nService);
  private readonly profilePhoto = inject(ProfilePhotoService);

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
      ...d.exercises.slice(0, 8).map(e => `• ${e.name} — ${this.i18n.t('share.ex_detail', { sets: e.sets, reps: e.reps })}` +
        (e.maxKg ? ` · ${this.i18n.t('share.weight')} ${this.fmtNumber(e.maxKg)} kg` : '')),
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
    await loadShareFonts();
    const font = shareFont;
    const p = sharePalette();
    const accent = p.accent;

    // Fundo
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, p.bgTop);
    bg.addColorStop(1, p.bgBottom);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Foto de perfil: desfocada no fundo (ela é pequena, nítida ficaria pixelada) e nítida no lugar do selo
    const photo = await this.loadImage(this.profilePhoto.photo());
    if (photo) {
      this.drawBlurredCover(ctx, photo);
      // Camada mais leve em cima (a foto aparece) e mais forte embaixo (fundo limpo para o rodapé)
      const veil = ctx.createLinearGradient(0, 0, 0, H);
      const c = p.light ? '255,255,255' : '11,16,32';
      veil.addColorStop(0, `rgba(${c},0.55)`);
      veil.addColorStop(1, `rgba(${c},0.82)`);
      ctx.fillStyle = veil;
      ctx.fillRect(0, 0, W, H);
    }

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

    // Exercícios que entram na caixa (com "+N" sobra espaço para 3)
    const list = d.exercises.slice(0, d.exercises.length > 4 ? 3 : 4);
    const ROW = list.length >= 4 ? 92 : 104; // 4 linhas ficam mais juntas para não bater no rodapé
    const hasMore = d.exercises.length > list.length;
    const listBoxH = list.length > 0 ? 60 + (list.length - 1) * ROW + 76 + (hasMore ? 48 : 0) : 0;

    // Centraliza o bloco (selo → exercícios) entre o cabeçalho e o rodapé, sem sobrar vazio embaixo
    const blockTop = 190, blockBottom = list.length > 0 ? 810 + listBoxH : 770;
    const dy = Math.max(0, ((170 + (H - 120)) - (blockTop + blockBottom)) / 2);
    ctx.save();
    ctx.translate(0, dy);

    // Selo de concluído (com foto: a foto no círculo e um ✓ pequeno no canto)
    ctx.textAlign = 'center';
    if (photo) {
      const r = 92;
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, 290, r, 0, Math.PI * 2);
      ctx.clip();
      const side = Math.min(photo.width, photo.height);
      ctx.drawImage(photo, (photo.width - side) / 2, (photo.height - side) / 2, side, side, W / 2 - r, 290 - r, r * 2, r * 2);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(W / 2, 290, r, 0, Math.PI * 2);
      ctx.lineWidth = 8;
      ctx.strokeStyle = accent;
      ctx.stroke();

      const bx = W / 2 + r * 0.72, by = 290 + r * 0.72;
      ctx.beginPath();
      ctx.arc(bx, by, 34, 0, Math.PI * 2);
      ctx.fillStyle = p.good;
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = p.light ? '#ffffff' : '#141a2e';
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = font(40, 800);
      ctx.fillText('✓', bx, by + 14);
    } else {
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
    }

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
      ...(d.volumeKg > 0 ? [{ value: `${this.fmtNumber(d.volumeKg)} kg`, label: this.i18n.t('share.volume') }] : []),
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
      // Com 4 caixas o número fica menor; e diminui mais se ainda não couber (ex.: "1.250 kg")
      let size = stats.length > 3 ? 50 : 58;
      ctx.font = font(size, 800);
      while (size > 30 && ctx.measureText(s.value).width > boxW - 28) ctx.font = font(--size, 800);
      ctx.fillText(s.value, x + boxW / 2, 690);
      ctx.fillStyle = p.muted;
      // Rótulo diminui se não couber na caixa (ex.: "VOLUME TOTAL" com 4 caixas)
      const label = s.label.toUpperCase();
      let lsize = 28;
      ctx.font = font(lsize, 600);
      while (lsize > 18 && ctx.measureText(label).width > boxW - 28) ctx.font = font(--lsize, 600);
      ctx.fillText(label, x + boxW / 2, 735);
    });

    // Exercícios numa caixa: nome + "3 séries × 13 reps" embaixo, peso destacado à direita
    if (list.length > 0) {
      this.roundRect(ctx, 80, 810, W - 160, listBoxH, 28);
      ctx.fillStyle = p.box;
      ctx.fill();
      ctx.strokeStyle = p.boxBorder;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    const left = 116, textX = 144, right = W - 112;
    let y = 870;
    ctx.textAlign = 'left';
    list.forEach((e, i) => {
      if (i > 0) {
        ctx.strokeStyle = p.boxBorder;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(left - 8, y - 44);
        ctx.lineTo(right + 8, y - 44);
        ctx.stroke();
      }
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(left, y - 12, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.text;
      ctx.font = font(36, 700);
      ctx.fillText(this.ellipsis(ctx, e.name, right - textX - 200), textX, y);
      ctx.fillStyle = p.muted;
      ctx.font = font(28, 600);
      ctx.fillText(this.i18n.t('share.ex_detail', { sets: e.sets, reps: e.reps }), textX, y + 40);

      if (e.maxKg) {
        ctx.textAlign = 'right';
        ctx.fillStyle = p.faint;
        ctx.font = font(22, 700);
        ctx.fillText(this.i18n.t('share.weight').toUpperCase(), right, y - 8);
        ctx.fillStyle = p.accentText;
        ctx.font = font(40, 800);
        ctx.fillText(`${this.fmtNumber(e.maxKg)} kg`, right, y + 38);
        ctx.textAlign = 'left';
      }
      y += ROW;
    });
    if (hasMore) {
      ctx.fillStyle = p.muted;
      ctx.font = font(30, 600);
      ctx.fillText(this.i18n.t('share.more', { n: d.exercises.length - list.length }), textX, y - 18);
    }

    ctx.restore();

    // Rodapé numa pílula, para ficar legível por cima da foto
    ctx.textAlign = 'center';
    ctx.font = font(28, 700);
    const footer = this.i18n.t('share.footer');
    const fw = ctx.measureText(footer).width + 56;
    this.roundRect(ctx, (W - fw) / 2, H - 112, fw, 60, 30);
    ctx.fillStyle = p.box;
    ctx.fill();
    ctx.strokeStyle = p.boxBorder;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = p.soft;
    ctx.fillText(footer, W / 2, H - 72);

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('canvas'))), 'image/png'));
  }

  private loadImage(src: string | null): Promise<HTMLImageElement | null> {
    if (!src) return Promise.resolve(null);
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  /**
   * Cobre o cartão com a imagem desfocada. Desfoca reduzindo para poucos pixels e ampliando de volta,
   * porque `ctx.filter = 'blur()'` não funciona em todos os navegadores (ex.: Safari antigo).
   */
  private drawBlurredCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
    const small = document.createElement('canvas');
    small.width = 48;
    small.height = 60; // mesma proporção 4:5 do cartão
    const sctx = small.getContext('2d')!;
    const scale = Math.max(small.width / img.width, small.height / img.height);
    const w = img.width * scale, h = img.height * scale;
    sctx.drawImage(img, (small.width - w) / 2, (small.height - h) / 2, w, h);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(small, 0, 0, W, H);
    ctx.restore();
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
