import { Component, computed, input, signal } from '@angular/core';

export interface ChartPoint {
  /** Data em milissegundos (posição no eixo X, proporcional ao tempo) */
  t: number;
  value: number;
  /** Texto da data já formatado para exibir */
  label: string;
}

const W = 340, H = 220;
const PAD = { left: 38, right: 14, top: 44, bottom: 28 };
let nextId = 0;

const r1 = (n: number) => Math.round(n * 10) / 10;
const fmt = (n: number) => String(+n.toFixed(2));

/** Passo "redondo" (1, 2, 2.5, 5 × 10^n) para o eixo Y não mostrar valores como 63,4 */
function niceStep(raw: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
}

/** Curva suave que não "passa do ponto" (monotone cubic, igual ao d3.curveMonotoneX) */
function smoothPath(p: { x: number; y: number }[]): string {
  const n = p.length;
  const f = (v: number) => v.toFixed(1);
  if (n < 3) return `M${f(p[0].x)},${f(p[0].y)} L${f(p[1].x)},${f(p[1].y)}`;

  const h: number[] = [], s: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h[i] = p[i + 1].x - p[i].x;
    s[i] = (p[i + 1].y - p[i].y) / h[i];
  }
  const t: number[] = [];
  for (let i = 1; i < n - 1; i++) {
    const m = (s[i - 1] * h[i] + s[i] * h[i - 1]) / (h[i - 1] + h[i]);
    t[i] = (Math.sign(s[i - 1]) + Math.sign(s[i])) * Math.min(Math.abs(s[i - 1]), Math.abs(s[i]), 0.5 * Math.abs(m)) || 0;
  }
  t[0] = (3 * s[0] - t[1]) / 2;
  t[n - 1] = (3 * s[n - 2] - t[n - 2]) / 2;

  let d = `M${f(p[0].x)},${f(p[0].y)}`;
  for (let i = 0; i < n - 1; i++) {
    const k = h[i] / 3;
    d += ` C${f(p[i].x + k)},${f(p[i].y + t[i] * k)} ${f(p[i + 1].x - k)},${f(p[i + 1].y - t[i + 1] * k)} ${f(p[i + 1].x)},${f(p[i + 1].y)}`;
  }
  return d;
}

/** Gráfico de linha em SVG: toque ou arraste sobre o gráfico para ver o valor de cada data. */
@Component({
  selector: 'app-line-chart',
  standalone: true,
  styles: [`
    :host { display: block; }
    svg { width: 100%; height: auto; display: block; overflow: visible; user-select: none; -webkit-user-select: none; }
    .grid { stroke: var(--ft-border); stroke-width: 1; stroke-dasharray: 2 4; }
    .base { stroke: var(--ft-border-strong); stroke-width: 1; }
    .tick { fill: var(--ft-text-faint); font-size: 10px; font-variant-numeric: tabular-nums; }
    .xlab { fill: var(--ft-text-faint); font-size: 10px; }
    .line { fill: none; stroke-width: 2.5; stroke-linejoin: round; stroke-linecap: round;
            stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 0.7s ease-out forwards; }
    .area { opacity: 0; animation: fade 0.5s 0.25s ease-out forwards; }
    .guide { stroke: var(--ft-text-faint); stroke-width: 1; stroke-dasharray: 3 3; }
    .dot { stroke: var(--ft-surface); stroke-width: 2; transition: r 0.15s; }
    .halo { opacity: 0.22; }
    .scrub { fill: transparent; cursor: crosshair; touch-action: pan-y; }
    .bubble { fill: var(--ft-surface-2); stroke: var(--ft-border-strong); stroke-width: 1; }
    .bubble-text { fill: var(--ft-text); font-size: 12px; font-weight: 800; text-anchor: middle; font-variant-numeric: tabular-nums; }
    .bubble-sub { fill: var(--ft-text-muted); font-size: 9.5px; text-anchor: middle; }
    @keyframes draw { to { stroke-dashoffset: 0; } }
    @keyframes fade { to { opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { .line, .area { animation: none; stroke-dashoffset: 0; opacity: 1; } }
  `],
  template: `
    @if (geo(); as g) {
      <svg [attr.viewBox]="'0 0 ' + w + ' ' + h" role="img" [attr.aria-label]="ariaLabel()">
        <defs>
          <linearGradient [attr.id]="gradId" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" [attr.stop-color]="color()" stop-opacity="0.32"/>
            <stop offset="100%" [attr.stop-color]="color()" stop-opacity="0"/>
          </linearGradient>
        </defs>

        @for (tk of g.ticks; track tk.y; let first = $first) {
          <line [class.grid]="!first" [class.base]="first" [attr.x1]="pad.left" [attr.x2]="w - pad.right" [attr.y1]="tk.y" [attr.y2]="tk.y"/>
          <text class="tick" [attr.x]="pad.left - 6" [attr.y]="tk.y + 3" text-anchor="end">{{ tk.label }}</text>
        }

        @for (xl of g.xLabels; track $index) {
          <text class="xlab" [attr.x]="xl.x" [attr.y]="h - 8" [attr.text-anchor]="xl.anchor">{{ xl.label }}</text>
        }

        <!-- Recria a linha quando os dados mudam, para repetir a animação -->
        @for (key of [g.line]; track key) {
          <path class="area" [attr.d]="g.area" [attr.fill]="'url(#' + gradId + ')'"/>
          <path class="line" [attr.d]="g.line" [attr.stroke]="color()" pathLength="1"/>
        }

        @if (g.pts[active()]; as a) {
          <line class="guide" [attr.x1]="a.x" [attr.x2]="a.x" [attr.y1]="pad.top - 6" [attr.y2]="g.baseY"/>
        }

        @for (p of g.pts; track $index) {
          @if (g.showDots || $index === active()) {
            <circle class="dot" [attr.cx]="p.x" [attr.cy]="p.y" [attr.r]="$index === active() ? 5.5 : 3.5" [attr.fill]="color()"/>
          }
        }

        @if (g.pts[active()]; as a) {
          <circle class="halo" [attr.cx]="a.x" [attr.cy]="a.y" r="11" [attr.fill]="color()"/>
          <g [attr.transform]="'translate(' + a.bx + ',0)'">
            <rect class="bubble" [attr.x]="-a.bw / 2" y="2" [attr.width]="a.bw" height="32" rx="9"/>
            <text class="bubble-text" y="17">{{ a.value }}{{ unit() }}</text>
            <text class="bubble-sub" y="29">{{ a.sub }}</text>
          </g>
        }

        <rect class="scrub" [attr.x]="pad.left - 10" y="0" [attr.width]="w - pad.left - pad.right + 20" [attr.height]="h"
              (pointerdown)="scrub($event)" (pointermove)="scrubMove($event)"/>
      </svg>
    }
  `
})
export class LineChartComponent {
  points = input.required<ChartPoint[]>();
  unit = input('');
  color = input('var(--ft-accent)');
  ariaLabel = input('');

  readonly w = W;
  readonly h = H;
  readonly pad = PAD;
  readonly gradId = `lc-fill-${nextId++}`;

  /** Seleção vale só para a série em que foi feita: ao trocar de medida, volta ao último ponto */
  private selected = signal<{ pts: ChartPoint[]; i: number } | null>(null);

  active = computed(() => {
    const pts = this.points();
    const s = this.selected();
    return s && s.pts === pts && s.i < pts.length ? s.i : pts.length - 1;
  });

  scrub(ev: PointerEvent) {
    const g = this.geo();
    const svg = (ev.target as SVGElement).ownerSVGElement;
    if (!g || !svg) return;
    const box = svg.getBoundingClientRect();
    const x = ((ev.clientX - box.left) / box.width) * W;
    let best = 0;
    g.pts.forEach((p, i) => { if (Math.abs(p.x - x) < Math.abs(g.pts[best].x - x)) best = i; });
    this.selected.set({ pts: this.points(), i: best });
  }

  /** Mouse: acompanha ao passar por cima. Toque/caneta: só enquanto estiver pressionado */
  scrubMove(ev: PointerEvent) {
    if (ev.pointerType === 'mouse' || ev.buttons) this.scrub(ev);
  }

  geo = computed(() => {
    const pts = this.points();
    const unit = this.unit();
    if (pts.length < 2) return null;

    // Eixo Y com folga e valores redondos
    const values = pts.map(p => p.value);
    let lo = Math.min(...values), hi = Math.max(...values);
    if (lo === hi) { lo -= 1; hi += 1; }
    const pad = (hi - lo) * 0.15;
    lo -= pad; hi += pad;
    if (Math.min(...values) >= 0) lo = Math.max(0, lo); // medidas não são negativas
    const step = niceStep((hi - lo) / 4);
    const min = Math.floor(lo / step) * step;
    const max = Math.ceil(hi / step) * step;

    const t0 = pts[0].t, t1 = pts[pts.length - 1].t;
    const tSpan = t1 - t0 || 1;
    const plotW = W - PAD.left - PAD.right, plotH = H - PAD.top - PAD.bottom;
    const baseY = PAD.top + plotH;
    // Datas diferentes: espaço proporcional ao tempo. Dois registros no mesmo dia: espaçamento igual
    const distinctDays = new Set(pts.map(p => p.t)).size === pts.length;
    const x = (i: number) => PAD.left + (distinctDays ? (pts[i].t - t0) / tSpan : i / (pts.length - 1)) * plotW;
    const y = (v: number) => PAD.top + (1 - (v - min) / (max - min)) * plotH;

    const coords = pts.map((p, i) => {
      const px = x(i), py = y(p.value);
      const value = r1(p.value);
      const diff = i > 0 ? r1(p.value - pts[i - 1].value) : null;
      const sub = diff === null ? p.label : `${p.label} · ${diff > 0 ? '+' : ''}${diff}${unit}`;
      // Largura aproximada pelo texto; a bolha não pode sair do desenho nas pontas
      const bw = Math.max(64, (String(value) + unit).length * 7.5 + 20, sub.length * 5.4 + 16);
      const bx = Math.min(W - bw / 2, Math.max(bw / 2, px));
      return { x: px, y: py, bx, bw, value, sub };
    });

    const line = smoothPath(coords);
    const last = coords[coords.length - 1];
    const area = `${line} L${last.x.toFixed(1)},${baseY} L${coords[0].x.toFixed(1)},${baseY} Z`;

    const ticks: { y: number; label: string }[] = [];
    for (let v = min; v <= max + step / 2; v += step) ticks.push({ y: y(v), label: fmt(v) });

    // Datas no eixo X: primeira, última e as do meio que couberem sem encostar
    const MIN_GAP = 58;
    const xLabels: { x: number; label: string; anchor: string }[] = [];
    const lastLabel = pts[pts.length - 1].label;
    pts.forEach((p, i) => {
      const isLast = i === pts.length - 1;
      if (i > 0 && !isLast && (coords[i].x - (xLabels.at(-1)?.x ?? -1e9) < MIN_GAP || last.x - coords[i].x < MIN_GAP)) return;
      if (isLast && p.label === pts[0].label) return; // mesmo dia: mostra uma vez só
      if (xLabels.some(l => l.label === p.label) && !isLast) return;
      xLabels.push({ x: coords[i].x, label: p.label, anchor: i === 0 ? 'start' : isLast ? 'end' : 'middle' });
    });
    if (xLabels.at(-1)?.label !== lastLabel && lastLabel !== pts[0].label) {
      xLabels.push({ x: last.x, label: lastLabel, anchor: 'end' });
    }

    return { pts: coords, line, area, ticks, xLabels, baseY, showDots: pts.length <= 24 };
  });
}
