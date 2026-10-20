import { Injectable, inject } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';
import { ShareResult, WorkoutShareService, sharePalette } from './workout-share.service';

export interface BeforeAfter { before: number; after: number; }

export interface ProgressRow {
  label: string;          // já traduzido
  before: number;
  after: number;
  diff: number;
  unit: string;
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
const H = 1920; // 9:16 — formato de story (Instagram e status do WhatsApp)
const COMP_H = 700; // altura do bloco de composição corporal
const LEAN_COLOR = '#38bdf8';
const FAT_COLOR = '#f5a524';

/** Peso dividido em massa magra e gordura, antes e depois */
interface Composition {
  weight: BeforeAfter;
  lean: BeforeAfter;
  fat: BeforeAfter;
  leanDiff: number;
  fatDiff: number;
  verdict: { key: string; tone: VerdictTone };
}

interface Hero { kind: 'lean' | 'weight'; label: string; value: number; unit: string; sub: string; }
interface Card { label: string; sub: string; diff: number; unit: string; }

/**
 * Imagem da evolução pensada para story: um número grande em destaque e no máximo 3 cartões.
 * O texto que acompanha também é curto; a lista completa fica no app.
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

  /** Só existe quando dá para separar o peso em gordura e massa magra (precisa de sexo, altura e medidas) */
  private composition(d: ProgressShareData): Composition | null {
    if (!d.lean || !d.fatMass) return null;
    const weight = d.weight ?? { before: d.lean.before + d.fatMass.before, after: d.lean.after + d.fatMass.after };
    const leanDiff = this.diff(d.lean), fatDiff = this.diff(d.fatMass);
    return { weight, lean: d.lean, fat: d.fatMass, leanDiff, fatDiff, verdict: compositionVerdict(fatDiff, leanDiff) };
  }

  /** Destaque principal: massa magra (se ganhou) ou, senão, o peso */
  private hero(d: ProgressShareData): Hero | null {
    const t = (k: string) => this.i18n.t(k);
    if (d.lean && this.diff(d.lean) > 0) {
      const fat = d.fatMass ? this.diff(d.fatMass) : 0;
      return {
        kind: 'lean', label: `💪 ${t('meas.lean_mass')}`, value: this.diff(d.lean), unit: 'kg',
        sub: fat < 0 ? this.massPhrase('fat', fat) : `${this.num(d.lean.before)} → ${this.num(d.lean.after)} kg`
      };
    }
    if (d.weight) {
      return {
        kind: 'weight', label: `⚖️ ${t('meas.weight')}`, value: this.diff(d.weight), unit: 'kg',
        sub: `${this.num(d.weight.before)} kg → ${this.num(d.weight.after)} kg`
      };
    }
    return null;
  }

  /** Até 3 cartões: maiores ganhos de músculo; se faltar, as medidas que mais mudaram */
  private cards(d: ProgressShareData, hero: Hero | null): Card[] {
    const out: Card[] = [];
    // Se o destaque foi a massa magra, o peso vira o primeiro cartão
    if (hero?.kind === 'lean' && d.weight) {
      out.push({ label: this.i18n.t('meas.weight'), sub: `${this.num(d.weight.before)} → ${this.num(d.weight.after)} kg`, diff: this.diff(d.weight), unit: 'kg' });
    }
    const toCard = (r: ProgressRow): Card => ({ label: r.label, sub: `${this.num(r.before)} → ${this.num(r.after)} ${r.unit}`, diff: r.diff, unit: r.unit });
    const gains = d.muscles.filter(r => r.diff > 0).sort((a, b) => b.diff - a.diff);
    const rest = [...d.muscles.filter(r => r.diff < 0), ...d.others.filter(r => r.diff !== 0)]
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
    for (const r of [...gains, ...rest]) {
      if (out.length >= 3) break;
      out.push(toCard(r));
    }
    return out;
  }

  buildText(d: ProgressShareData): string {
    const t = (k: string, p?: Record<string, string | number | null | undefined>) => this.i18n.t(k, p);
    const sign = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + this.num(Math.abs(n));
    const comp = this.composition(d);
    const hero = comp ? null : this.hero(d);
    const lines = [`📈 ${t('share.progress_title')} · ${t('share.progress_days', { n: d.days })}`];
    if (comp) {
      lines.push(`⚖️ ${t('meas.weight')}: ${sign(this.diff(comp.weight))} kg`);
      lines.push(`${t('meas.fat_mass')} ${sign(comp.fatDiff)} kg · ${t('meas.lean_mass')} ${sign(comp.leanDiff)} kg`);
      lines.push(t(comp.verdict.key));
    }
    if (hero) lines.push(`${hero.label}: ${sign(hero.value)} ${hero.unit}`);
    const cards = this.cards(d, hero).slice(0, comp ? 2 : 3);
    if (cards.length) lines.push(cards.map(c => `${c.label} ${sign(c.diff)} ${c.unit}`).join(' · '));
    lines.push('', t('share.footer_progress'));
    return lines.join('\n');
  }

  /** "Ganhou 2,1 kg de massa magra" / "Perdeu 3,4 kg de gordura" */
  private massPhrase(kind: 'lean' | 'fat', diff: number): string {
    const kg = this.num(Math.abs(diff));
    const key = diff >= 0 ? `share.${kind}_gained` : `share.${kind}_lost`;
    return this.i18n.t(key, { kg });
  }

  private diff(v: BeforeAfter): number {
    return Math.round((v.after - v.before) * 10) / 10;
  }

  // ---------- Imagem ----------

  private async drawCard(d: ProgressShareData): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    const font = (size: number, weight = 700) => `${weight} ${size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
    const p = sharePalette();
    const accent = p.accent;
    const { good: GOOD, bad: BAD, muted: MUTED, soft: SOFT } = p;
    const t = (k: string, p?: Record<string, string | number | null | undefined>) => this.i18n.t(k, p);
    const signed = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + this.num(Math.abs(n));
    const color = (n: number) => (n > 0 ? GOOD : n < 0 ? BAD : MUTED);

    // Fundo: degradê escuro com brilho vermelho em cima e verde suave embaixo
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, p.bgTop);
    bg.addColorStop(1, p.bgBottom);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    const glowTop = ctx.createRadialGradient(W / 2, -100, 40, W / 2, -100, 900);
    glowTop.addColorStop(0, `rgba(${p.accentRgb},${p.light ? 0.22 : 0.40})`);
    glowTop.addColorStop(1, `rgba(${p.accentRgb},0)`);
    ctx.fillStyle = glowTop;
    ctx.fillRect(0, 0, W, H);
    const glowBottom = ctx.createRadialGradient(W / 2, H + 200, 40, W / 2, H + 200, 900);
    glowBottom.addColorStop(0, this.alpha(GOOD, p.light ? 0.10 : 0.16));
    glowBottom.addColorStop(1, this.alpha(GOOD, 0));
    ctx.fillStyle = glowBottom;
    ctx.fillRect(0, 0, W, H);

    // Marca e dias
    ctx.textAlign = 'left';
    ctx.fillStyle = p.text;
    ctx.font = font(52, 800);
    ctx.fillText('Fit', 90, 150);
    const fitW = ctx.measureText('Fit').width;
    ctx.fillStyle = accent;
    ctx.fillText('Mob', 90 + fitW, 150);

    const days = t('share.progress_days', { n: d.days });
    ctx.font = font(34, 800);
    const pillW = ctx.measureText(days).width + 56;
    this.sharer.roundRect(ctx, W - 90 - pillW, 100, pillW, 66, 33);
    ctx.fillStyle = `rgba(${p.accentRgb},0.16)`;
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = p.accentText;
    ctx.fillText(days, W - 90 - pillW / 2, 146);

    // Título
    ctx.fillStyle = p.text;
    ctx.font = font(84, 900);
    ctx.fillText(t('share.progress_title'), W / 2, 340);
    ctx.fillStyle = MUTED;
    ctx.font = font(34, 600);
    ctx.fillText(`${this.date(d.from)}  →  ${this.date(d.to)}`, W / 2, 405);

    // Com gordura/massa magra o destaque é a composição corporal; senão, um número gigante
    const comp = this.composition(d);
    const hero = comp ? null : this.hero(d);
    const cards = this.cards(d, hero).slice(0, comp ? 2 : 3);
    // Centraliza o bloco (destaque + cartões) no espaço entre o título e o rodapé
    const blockH = (comp ? COMP_H + 70 : 0) + (hero ? 470 + 90 : 0) + (cards.length ? 36 + cards.length * 194 : 0);
    let y = 480 + Math.max(0, (H - 200 - 480 - blockH) / 2);
    if (comp) {
      this.drawComposition(ctx, comp, y, font);
      y += COMP_H + 70;
    }
    if (hero) {
      const c = color(hero.value);
      const h = 470;
      this.sharer.roundRect(ctx, 90, y, W - 180, h, 48);
      const heroBg = ctx.createLinearGradient(0, y, 0, y + h);
      heroBg.addColorStop(0, this.alpha(c, 0.20));
      heroBg.addColorStop(1, this.alpha(c, 0.05));
      ctx.fillStyle = heroBg;
      ctx.fill();
      ctx.strokeStyle = this.alpha(c, 0.45);
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = SOFT;
      ctx.font = font(42, 800);
      ctx.fillText(hero.label.toUpperCase(), W / 2, y + 100);

      // Número enorme + unidade menor, centralizados juntos
      const big = signed(hero.value);
      ctx.font = font(220, 900);
      const bigW = ctx.measureText(big).width;
      ctx.font = font(90, 900);
      const unitW = ctx.measureText(` ${hero.unit}`).width;
      const startX = W / 2 - (bigW + unitW) / 2;
      ctx.textAlign = 'left';
      ctx.fillStyle = c;
      ctx.font = font(220, 900);
      ctx.fillText(big, startX, y + 320);
      ctx.font = font(90, 900);
      ctx.fillText(` ${hero.unit}`, startX + bigW, y + 320);

      ctx.textAlign = 'center';
      ctx.fillStyle = SOFT;
      ctx.font = font(40, 600);
      ctx.fillText(this.sharer.ellipsis(ctx, hero.sub, W - 260), W / 2, y + 405);
      y += h + 90;
    }

    // Até 3 cartões grandes
    if (cards.length) {
      const allGains = cards.every(c => c.diff > 0);
      ctx.textAlign = 'left';
      ctx.fillStyle = MUTED;
      ctx.font = font(34, 800);
      ctx.fillText(`${allGains ? '🏆' : '✨'}  ${t(allGains ? 'share.top_gains' : 'share.highlights').toUpperCase()}`, 96, y);
      y += 36;
      for (const c of cards) {
        const h = 170;
        this.sharer.roundRect(ctx, 90, y, W - 180, h, 36);
        ctx.fillStyle = p.box;
        ctx.fill();
        ctx.strokeStyle = p.boxBorder;
        ctx.lineWidth = 2;
        ctx.stroke();
        // Faixa colorida à esquerda
        this.sharer.roundRect(ctx, 90, y + 30, 10, h - 60, 5);
        ctx.fillStyle = color(c.diff);
        ctx.fill();

        ctx.textAlign = 'left';
        ctx.fillStyle = p.text;
        ctx.font = font(48, 800);
        ctx.fillText(this.sharer.ellipsis(ctx, c.label, 520), 140, y + 78);
        ctx.fillStyle = MUTED;
        ctx.font = font(32, 600);
        ctx.fillText(c.sub, 140, y + 128);

        ctx.textAlign = 'right';
        ctx.fillStyle = color(c.diff);
        ctx.font = font(40, 800);
        const unitW = ctx.measureText(` ${c.unit}`).width;
        ctx.fillText(` ${c.unit}`, W - 130, y + 108);
        ctx.font = font(80, 900);
        ctx.fillText(signed(c.diff), W - 130 - unitW, y + 108);
        y += h + 24;
      }
    }

    // Rodapé
    ctx.textAlign = 'center';
    ctx.fillStyle = p.faint;
    ctx.font = font(34, 700);
    ctx.fillText(t('share.footer_progress'), W / 2, H - 110);

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('canvas'))), 'image/png'));
  }

  /** Variação do peso + barras Antes/Depois divididas em massa magra e gordura + conclusão */
  private drawComposition(ctx: CanvasRenderingContext2D, c: Composition, y: number, font: (size: number, weight?: number) => string) {
    const p = sharePalette();
    const t = (k: string) => this.i18n.t(k);
    const signed = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + this.num(Math.abs(n));
    const eps = 0.3;
    // Gordura caindo e massa magra subindo são boas notícias
    const fatColor = c.fatDiff < -eps ? p.good : c.fatDiff > eps ? p.bad : p.muted;
    const leanColor = c.leanDiff > eps ? p.good : c.leanDiff < -eps ? p.bad : p.muted;
    const toneColor = { good: p.good, mixed: FAT_COLOR, bad: p.bad, neutral: p.muted }[c.verdict.tone];

    this.sharer.roundRect(ctx, 90, y, W - 180, COMP_H, 48);
    ctx.fillStyle = p.box;
    ctx.fill();
    ctx.strokeStyle = p.boxBorder;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = p.soft;
    ctx.font = font(40, 800);
    ctx.fillText(`⚖️ ${t('share.composition').toUpperCase()}`, W / 2, y + 80);

    // Variação do peso, número grande + "kg" menor, centralizados juntos
    const big = signed(this.diff(c.weight));
    ctx.font = font(130, 900);
    const bigW = ctx.measureText(big).width;
    ctx.font = font(60, 900);
    const unitW = ctx.measureText(' kg').width;
    const startX = W / 2 - (bigW + unitW) / 2;
    ctx.textAlign = 'left';
    ctx.fillStyle = p.text;
    ctx.font = font(130, 900);
    ctx.fillText(big, startX, y + 210);
    ctx.font = font(60, 900);
    ctx.fillText(' kg', startX + bigW, y + 210);
    ctx.textAlign = 'center';
    ctx.fillStyle = p.muted;
    ctx.font = font(34, 600);
    ctx.fillText(`${this.num(c.weight.before)} kg → ${this.num(c.weight.after)} kg`, W / 2, y + 262);

    // Barras: mesma escala para Antes e Depois, para a diferença de tamanho aparecer
    const barX = 140, barW = W - 280, barH = 64;
    const max = Math.max(c.lean.before + c.fat.before, c.lean.after + c.fat.after, 1);
    const rows = [
      { label: t('meas.before'), lean: c.lean.before, fat: c.fat.before },
      { label: t('meas.after'), lean: c.lean.after, fat: c.fat.after }
    ];
    rows.forEach((r, i) => {
      const labelY = y + 330 + i * 120;
      ctx.textAlign = 'left';
      ctx.fillStyle = p.muted;
      ctx.font = font(30, 700);
      ctx.fillText(r.label, barX, labelY);
      ctx.textAlign = 'right';
      ctx.fillText(`${this.num(r.lean + r.fat)} kg`, barX + barW, labelY);

      const barY = labelY + 16;
      const leanW = (r.lean / max) * barW, fatW = (r.fat / max) * barW;
      ctx.save();
      this.sharer.roundRect(ctx, barX, barY, leanW + fatW, barH, 20);
      ctx.clip();
      ctx.fillStyle = LEAN_COLOR;
      ctx.fillRect(barX, barY, leanW, barH);
      ctx.fillStyle = FAT_COLOR;
      ctx.fillRect(barX + leanW, barY, fatW, barH);
      ctx.restore();

      // Valor dentro de cada parte, se couber
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0b1020';
      ctx.font = font(28, 800);
      if (leanW > 150) ctx.fillText(`${this.num(r.lean)} kg`, barX + leanW / 2, barY + 43);
      if (fatW > 150) ctx.fillText(`${this.num(r.fat)} kg`, barX + leanW + fatW / 2, barY + 43);
    });

    // Legenda com a variação de cada parte
    const legend = [
      { x: barX, color: LEAN_COLOR, label: t('meas.lean_mass'), diff: c.leanDiff, diffColor: leanColor },
      { x: W / 2 + 20, color: FAT_COLOR, label: t('meas.fat_mass'), diff: c.fatDiff, diffColor: fatColor }
    ];
    for (const l of legend) {
      const ly = y + 590;
      this.sharer.roundRect(ctx, l.x, ly - 26, 28, 28, 7);
      ctx.fillStyle = l.color;
      ctx.fill();
      ctx.textAlign = 'left';
      ctx.fillStyle = p.soft;
      ctx.font = font(30, 700);
      const label = this.sharer.ellipsis(ctx, l.label, 210);
      ctx.fillText(label, l.x + 42, ly);
      const labelW = ctx.measureText(label).width;
      ctx.fillStyle = l.diffColor;
      ctx.font = font(34, 900);
      ctx.fillText(`${signed(l.diff)} kg`, l.x + 42 + labelW + 14, ly);
    }

    // Conclusão: diminui a fonte até caber numa linha (só corta como último recurso)
    const verdict = t(c.verdict.key);
    let size = 38;
    ctx.font = font(size, 800);
    while (size > 28 && ctx.measureText(verdict).width > W - 240) ctx.font = font(--size, 800);
    ctx.textAlign = 'center';
    ctx.fillStyle = toneColor;
    ctx.fillText(this.sharer.ellipsis(ctx, verdict, W - 240), W / 2, y + 660);
  }

  private alpha(hex: string, a: number): string {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  private num(n: number): string {
    return new Intl.NumberFormat(this.i18n.locale(), { maximumFractionDigits: 1 }).format(n);
  }

  private date(iso: string): string {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(this.i18n.locale(), { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
