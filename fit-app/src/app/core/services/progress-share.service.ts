import { Injectable, inject } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';
import { ShareResult, SharePalette, WorkoutShareService, sharePalette } from './workout-share.service';

export interface BeforeAfter { before: number; after: number; }

/** Qual direção da variação é boa: músculos crescendo ('up'), cintura/quadril diminuindo ('down') */
export type Better = 'up' | 'down' | 'none';

export interface ProgressRow {
  label: string;          // já traduzido
  before: number;
  after: number;
  diff: number;
  unit: string;
  better?: Better;        // padrão: 'up'
}

export interface ProgressShareData {
  from: string;           // AAAA-MM-DD
  to: string;
  days: number;
  weight?: BeforeAfter;
  lean?: BeforeAfter;     // massa magra (kg)
  fatMass?: BeforeAfter;  // massa gorda (kg)
  bf?: BeforeAfter;       // % de gordura
  bmi?: BeforeAfter & { label?: string };
  muscles: ProgressRow[]; // ombros, peitoral, braços, coxas, panturrilhas
  others: ProgressRow[];  // cintura, quadril, pescoço
}

export type VerdictTone = 'good' | 'mixed' | 'bad' | 'neutral';

/**
 * Resume o que aconteceu com o corpo a partir da variação de gordura e de massa magra (kg).
 * Variações menores que 0,3 kg contam como "manteve" (margem de erro da estimativa).
 */
export function compositionVerdict(fatDiff: number, leanDiff: number): { key: string; tone: VerdictTone } {
  const eps = 0.3;
  const fatDown = fatDiff < -eps, fatUp = fatDiff > eps;
  const leanDown = leanDiff < -eps, leanUp = leanDiff > eps;
  if (fatDown && leanUp) return { key: 'share.verdict_recomp', tone: 'good' };
  if (fatDown && !leanDown) return { key: 'share.verdict_fat_keep', tone: 'good' };
  if (fatDown && leanDown) return { key: 'share.verdict_cut_lean', tone: 'mixed' };
  if (leanUp && !fatUp) return { key: 'share.verdict_lean', tone: 'good' };
  if (leanUp && fatUp) return { key: 'share.verdict_bulk', tone: 'mixed' };
  if (fatUp) return { key: 'share.verdict_fat_up', tone: 'bad' };
  if (leanDown) return { key: 'share.verdict_lean_down', tone: 'bad' };
  return { key: 'share.verdict_stable', tone: 'neutral' };
}

const W = 1080;
const H = 1920;   // 9:16 — formato de story (Instagram e status do WhatsApp)
const X = 72;     // margem lateral
const CW = W - X * 2;
const FOOTER_Y = 1800;
const LEAN_COLOR = '#38bdf8';
const FAT_COLOR = '#f5a524';
const MIXED_COLOR = '#f5a524';

/** Peso dividido em massa magra e gordura, antes e depois */
interface Composition {
  weight: BeforeAfter;
  lean: BeforeAfter;
  fat: BeforeAfter;
  leanDiff: number;
  fatDiff: number;
  verdict: { key: string; tone: VerdictTone };
}

/** Um indicador do topo: valor atual grande, valor anterior pequeno e a variação */
interface Kpi { label: string; before: number; after: number; unit: string; better: Better; }

type Font = (size: number, weight?: number) => string;

/**
 * Imagem da evolução no formato de relatório: indicadores, composição corporal e tabela de medidas.
 * Sem emojis no desenho (cada celular mostra de um jeito); o texto que acompanha continua curto.
 */
@Injectable({ providedIn: 'root' })
export class ProgressShareService {
  private readonly i18n = inject(I18nService);
  private readonly sharer = inject(WorkoutShareService);

  async share(data: ProgressShareData, onReady?: () => void): Promise<ShareResult> {
    let blob: Blob | null = null;
    try { blob = await this.drawCard(data); } catch { blob = null; }
    return this.sharer.shareImage(blob, this.buildText(data), this.i18n.t('share.progress_title'), 'evolucao-fitmob', onReady);
  }

  buildText(d: ProgressShareData): string {
    const t = (k: string, p?: Record<string, string | number | null | undefined>) => this.i18n.t(k, p);
    const sign = (n: number) => this.signed(n);
    const comp = this.composition(d);
    const lines = [`${t('share.report_title')} · ${t('share.progress_days', { n: d.days })}`];
    if (d.weight) lines.push(`${t('meas.weight')}: ${this.num(d.weight.before)} → ${this.num(d.weight.after)} kg (${sign(this.diff(d.weight))})`);
    if (comp) {
      lines.push(`${t('meas.fat_mass')} ${sign(comp.fatDiff)} kg · ${t('meas.lean_mass')} ${sign(comp.leanDiff)} kg`);
      lines.push(t(comp.verdict.key));
    }
    const rows = this.tableRows(d, 3);
    if (rows.length) lines.push(rows.map(r => `${r.label} ${sign(r.diff)} ${r.unit}`).join(' · '));
    lines.push('', t('share.footer_progress'));
    return lines.join('\n');
  }

  /** Só existe quando dá para separar o peso em gordura e massa magra (precisa de sexo, altura e medidas) */
  private composition(d: ProgressShareData): Composition | null {
    if (!d.lean || !d.fatMass) return null;
    const weight = d.weight ?? { before: d.lean.before + d.fatMass.before, after: d.lean.after + d.fatMass.after };
    const leanDiff = this.diff(d.lean), fatDiff = this.diff(d.fatMass);
    return { weight, lean: d.lean, fat: d.fatMass, leanDiff, fatDiff, verdict: compositionVerdict(fatDiff, leanDiff) };
  }

  /** Indicadores do topo, na ordem: peso, % gordura, massa magra, massa gorda (ou IMC sem composição) */
  private kpis(d: ProgressShareData): Kpi[] {
    const t = (k: string) => this.i18n.t(k);
    const out: Kpi[] = [];
    if (d.weight) out.push({ label: t('meas.weight'), ...d.weight, unit: 'kg', better: 'none' });
    if (d.bf) out.push({ label: t('meas.bf'), ...d.bf, unit: '%', better: 'down' });
    if (d.lean) out.push({ label: t('meas.lean_mass'), ...d.lean, unit: 'kg', better: 'up' });
    if (d.fatMass) out.push({ label: t('meas.fat_mass'), ...d.fatMass, unit: 'kg', better: 'down' });
    if (out.length < 4 && d.bmi) out.push({ label: t('meas.bmi'), before: d.bmi.before, after: d.bmi.after, unit: '', better: 'none' });
    return out.slice(0, 4);
  }

  /** Medidas que mudaram, das maiores variações para as menores */
  private tableRows(d: ProgressShareData, max: number): ProgressRow[] {
    return [...d.muscles, ...d.others]
      .filter(r => r.diff !== 0)
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
      .slice(0, max);
  }

  // ---------- Imagem ----------

  private async drawCard(d: ProgressShareData): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    const font: Font = (size, weight = 700) => `${weight} ${size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
    const p = sharePalette();
    const t = (k: string, params?: Record<string, string | number | null | undefined>) => this.i18n.t(k, params);

    // Fundo liso com uma faixa de destaque fina no topo
    ctx.fillStyle = p.bgBottom;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = p.accent;
    ctx.fillRect(0, 0, W, 10);

    // Cabeçalho: marca + tipo do documento, período e duração
    ctx.textAlign = 'left';
    ctx.fillStyle = p.text;
    ctx.font = font(44, 800);
    ctx.fillText('Fit', X, 120);
    const fitW = ctx.measureText('Fit').width;
    ctx.fillStyle = p.accent;
    ctx.fillText('Mob', X + fitW, 120);
    ctx.textAlign = 'right';
    ctx.fillStyle = p.muted;
    ctx.font = font(26, 700);
    this.spaced(ctx, t('share.report_title').toUpperCase(), W - X, 116, 3);

    ctx.textAlign = 'left';
    ctx.fillStyle = p.text;
    const period = `${this.date(d.from)} – ${this.date(d.to)}`;
    let size = 56;
    ctx.font = font(size, 800);
    while (size > 36 && ctx.measureText(period).width > CW) ctx.font = font(--size, 800);
    ctx.fillText(period, X, 236);
    ctx.fillStyle = p.muted;
    ctx.font = font(30, 600);
    ctx.fillText(t('share.report_days', { n: d.days }), X, 286);
    this.divider(ctx, p, 330);

    // Indicadores em grade 2x2
    let y = 370;
    const kpis = this.kpis(d);
    const tileW = (CW - 24) / 2, tileH = 196;
    kpis.forEach((k, i) => this.drawKpi(ctx, p, font, k, X + (i % 2) * (tileW + 24), y + Math.floor(i / 2) * (tileH + 24), tileW, tileH));
    if (kpis.length) y += Math.ceil(kpis.length / 2) * (tileH + 24) + 26;

    // Composição corporal
    const comp = this.composition(d);
    if (comp) y = this.drawComposition(ctx, p, font, comp, y);

    // Tabela de medidas com o espaço que sobrou
    const rowH = 66;
    const free = FOOTER_Y - 40 - y - 120;
    const rows = this.tableRows(d, Math.max(0, Math.floor(free / rowH)));
    if (rows.length) this.drawTable(ctx, p, font, rows, y, rowH);

    // Rodapé
    this.divider(ctx, p, FOOTER_Y);
    ctx.textAlign = 'left';
    ctx.fillStyle = p.faint;
    ctx.font = font(24, 600);
    ctx.fillText(comp || d.bf ? t('share.navy_note') : t('share.footer_report'), X, FOOTER_Y + 56);
    ctx.textAlign = 'right';
    ctx.font = font(26, 800);
    ctx.fillText('FitMob', W - X, FOOTER_Y + 56);

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('canvas'))), 'image/png'));
  }

  private drawKpi(ctx: CanvasRenderingContext2D, p: SharePalette, font: Font, k: Kpi, x: number, y: number, w: number, h: number) {
    this.panel(ctx, p, x, y, w, h, 24);
    const diff = Math.round((k.after - k.before) * 10) / 10;
    const unit = k.unit ? (k.unit === '%' ? '%' : ` ${k.unit}`) : '';

    ctx.textAlign = 'left';
    ctx.fillStyle = p.muted;
    ctx.font = font(24, 700);
    this.spaced(ctx, this.sharer.ellipsis(ctx, k.label.toUpperCase(), w - 200), x + 32, y + 56, 1.5);

    // Variação num selo no canto
    const tag = `${this.signed(diff)}${unit}`;
    ctx.font = font(26, 800);
    const tagW = ctx.measureText(tag).width + 28;
    const c = this.tone(p, diff, k.better);
    this.sharer.roundRect(ctx, x + w - 28 - tagW, y + 26, tagW, 44, 22);
    ctx.fillStyle = this.alpha(c, 0.14);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = c;
    ctx.fillText(tag, x + w - 28 - tagW / 2, y + 57);

    // Valor atual grande + unidade
    ctx.textAlign = 'left';
    ctx.fillStyle = p.text;
    ctx.font = font(68, 800);
    const value = this.num(k.after);
    ctx.fillText(value, x + 32, y + 136);
    const vW = ctx.measureText(value).width;
    ctx.fillStyle = p.muted;
    ctx.font = font(30, 700);
    ctx.fillText(unit, x + 32 + vW, y + 136);

    ctx.fillStyle = p.faint;
    ctx.font = font(24, 600);
    ctx.fillText(`${this.i18n.t('meas.before')}: ${this.num(k.before)}${unit}`, x + 32, y + 174);
  }

  /** Barras Antes/Depois divididas em massa magra e gordura + conclusão; devolve o y seguinte */
  private drawComposition(ctx: CanvasRenderingContext2D, p: SharePalette, font: Font, c: Composition, y: number): number {
    const t = (k: string) => this.i18n.t(k);
    const h = 400;
    this.panel(ctx, p, X, y, CW, h, 24);

    ctx.textAlign = 'left';
    ctx.fillStyle = p.muted;
    ctx.font = font(24, 700);
    this.spaced(ctx, t('share.composition').toUpperCase(), X + 32, y + 56, 1.5);

    // Legenda à direita do título
    ctx.font = font(24, 700);
    const legend = [{ label: t('meas.fat_mass'), color: FAT_COLOR }, { label: t('meas.lean_mass'), color: LEAN_COLOR }];
    let lx = X + CW - 32;
    ctx.textAlign = 'right';
    for (const l of legend) {
      ctx.fillStyle = p.soft;
      ctx.fillText(l.label, lx, y + 56);
      lx -= ctx.measureText(l.label).width + 12;
      this.sharer.roundRect(ctx, lx - 20, y + 37, 20, 20, 5);
      ctx.fillStyle = l.color;
      ctx.fill();
      lx -= 44;
    }

    // Barras na mesma escala, para a diferença de tamanho aparecer
    const labelW = 130, barX = X + 32 + labelW, barW = CW - 64 - labelW - 150, barH = 52;
    const max = Math.max(c.lean.before + c.fat.before, c.lean.after + c.fat.after, 1);
    const rows = [
      { label: t('meas.before'), lean: c.lean.before, fat: c.fat.before },
      { label: t('meas.after'), lean: c.lean.after, fat: c.fat.after }
    ];
    rows.forEach((r, i) => {
      const by = y + 100 + i * 84;
      ctx.textAlign = 'left';
      ctx.fillStyle = p.soft;
      ctx.font = font(28, 700);
      ctx.fillText(r.label, X + 32, by + 36);

      const leanW = (r.lean / max) * barW, fatW = (r.fat / max) * barW;
      ctx.save();
      this.sharer.roundRect(ctx, barX, by, leanW + fatW, barH, 12);
      ctx.clip();
      ctx.fillStyle = LEAN_COLOR;
      ctx.fillRect(barX, by, leanW, barH);
      ctx.fillStyle = FAT_COLOR;
      ctx.fillRect(barX + leanW, by, fatW, barH);
      ctx.restore();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#0b1020';
      ctx.font = font(24, 800);
      if (leanW > 130) ctx.fillText(`${this.num(r.lean)} kg`, barX + leanW / 2, by + 35);
      if (fatW > 110) ctx.fillText(`${this.num(r.fat)} kg`, barX + leanW + fatW / 2, by + 35);

      ctx.textAlign = 'right';
      ctx.fillStyle = p.text;
      ctx.font = font(30, 800);
      ctx.fillText(`${this.num(r.lean + r.fat)} kg`, X + CW - 32, by + 37);
    });

    // Variações e conclusão
    const dy = y + 300;
    ctx.textAlign = 'left';
    ctx.font = font(26, 700);
    let dx = X + 32;
    for (const part of [
      { label: t('meas.lean_mass'), diff: c.leanDiff, better: 'up' as Better },
      { label: t('meas.fat_mass'), diff: c.fatDiff, better: 'down' as Better }
    ]) {
      ctx.fillStyle = p.muted;
      ctx.font = font(26, 600);
      ctx.fillText(part.label, dx, dy);
      dx += ctx.measureText(part.label).width + 12;
      ctx.fillStyle = this.tone(p, part.diff, part.better);
      ctx.font = font(26, 800);
      const v = `${this.signed(part.diff)} kg`;
      ctx.fillText(v, dx, dy);
      dx += ctx.measureText(v).width + 40;
    }

    const toneColor = { good: p.good, mixed: MIXED_COLOR, bad: p.bad, neutral: p.muted }[c.verdict.tone];
    const verdict = t(c.verdict.key).replace(/\s*\p{Extended_Pictographic}️?/gu, '').trim();
    let size = 30;
    ctx.font = font(size, 800);
    while (size > 22 && ctx.measureText(verdict).width > CW - 104) ctx.font = font(--size, 800);
    const vy = y + 326;
    this.sharer.roundRect(ctx, X + 32, vy, CW - 64, 50, 12);
    ctx.fillStyle = this.alpha(toneColor, 0.12);
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.fillStyle = toneColor;
    ctx.fillText(this.sharer.ellipsis(ctx, verdict, CW - 104), X + 52, vy + 35);

    return y + h + 26;
  }

  private drawTable(ctx: CanvasRenderingContext2D, p: SharePalette, font: Font, rows: ProgressRow[], y: number, rowH: number) {
    const t = (k: string) => this.i18n.t(k);
    const h = 80 + rows.length * rowH + 16;
    this.panel(ctx, p, X, y, CW, h, 24);
    const colBefore = X + CW - 400, colAfter = X + CW - 230, colDiff = X + CW - 32;

    ctx.fillStyle = p.muted;
    ctx.font = font(24, 700);
    ctx.textAlign = 'left';
    this.spaced(ctx, t('share.measures').toUpperCase(), X + 32, y + 56, 1.5);
    ctx.textAlign = 'right';
    ctx.font = font(22, 700);
    ctx.fillText(t('meas.before'), colBefore, y + 56);
    ctx.fillText(t('meas.after'), colAfter, y + 56);
    ctx.fillText(t('share.col_change'), colDiff, y + 56);

    rows.forEach((r, i) => {
      const ry = y + 80 + i * rowH;
      ctx.fillStyle = p.boxBorder;
      ctx.fillRect(X + 32, ry, CW - 64, 2);
      const base = ry + rowH / 2 + 11;
      ctx.textAlign = 'left';
      ctx.fillStyle = p.text;
      ctx.font = font(30, 700);
      ctx.fillText(this.sharer.ellipsis(ctx, r.label, colBefore - X - 32 - 170), X + 32, base);
      ctx.textAlign = 'right';
      ctx.fillStyle = p.muted;
      ctx.font = font(28, 600);
      ctx.fillText(this.num(r.before), colBefore, base);
      ctx.fillStyle = p.text;
      ctx.fillText(this.num(r.after), colAfter, base);
      ctx.fillStyle = this.tone(p, r.diff, r.better ?? 'up');
      ctx.font = font(30, 800);
      ctx.fillText(`${this.signed(r.diff)} ${r.unit}`, colDiff, base);
    });
  }

  // ---------- Auxiliares ----------

  /** Cor da variação: verde se foi na direção boa, vermelho se na ruim, neutra se não há direção */
  private tone(p: SharePalette, diff: number, better: Better): string {
    if (diff === 0 || better === 'none') return p.soft;
    return (diff > 0) === (better === 'up') ? p.good : p.bad;
  }

  private panel(ctx: CanvasRenderingContext2D, p: SharePalette, x: number, y: number, w: number, h: number, r: number) {
    this.sharer.roundRect(ctx, x, y, w, h, r);
    ctx.fillStyle = p.box;
    ctx.fill();
    ctx.strokeStyle = p.boxBorder;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private divider(ctx: CanvasRenderingContext2D, p: SharePalette, y: number) {
    ctx.fillStyle = p.boxBorder;
    ctx.fillRect(X, y, CW, 2);
  }

  /** Texto com espaçamento entre letras (títulos em caixa alta) */
  private spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
    const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
    const prev = c.letterSpacing;
    if ('letterSpacing' in c) c.letterSpacing = `${spacing}px`;
    ctx.fillText(text, x, y);
    if ('letterSpacing' in c) c.letterSpacing = prev ?? '0px';
  }

  private signed(n: number): string {
    return (n > 0 ? '+' : n < 0 ? '−' : '') + this.num(Math.abs(n));
  }

  private diff(v: BeforeAfter): number {
    return Math.round((v.after - v.before) * 10) / 10;
  }

  private alpha(color: string, a: number): string {
    if (!color.startsWith('#')) return color;
    const n = parseInt(color.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  private num(n: number): string {
    return new Intl.NumberFormat(this.i18n.locale(), { maximumFractionDigits: 1 }).format(n);
  }

  /** "20 jul 2026" (sem o "de" e o ponto que o português põe) */
  private date(iso: string): string {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    const parts = new Intl.DateTimeFormat(this.i18n.locale(), { day: '2-digit', month: 'short', year: 'numeric' })
      .formatToParts(new Date(y, m - 1, d));
    const get = (type: string) => parts.find(p => p.type === type)?.value.replace('.', '') ?? '';
    return `${get('day')} ${get('month')} ${get('year')}`;
  }
}
