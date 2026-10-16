import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

@Component({
  selector: 'ui-donut-chart',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    :host { display: block; }
    .donut-wrap {
      display: flex;
      align-items: center;
      gap: 24px;
    }
    .donut-svg { flex-shrink: 0; }
    .donut-center-text {
      text-anchor: middle;
      dominant-baseline: middle;
    }
    .donut-center-val {
      font-size: 1.4rem;
      font-weight: 800;
      fill: var(--color-text, #111);
    }
    .donut-center-label {
      font-size: 0.55rem;
      font-weight: 600;
      fill: var(--color-text-muted, #888);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .legend { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 0; }
    .legend-item { display: flex; align-items: center; gap: 8px; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .legend-label { font-size: 0.78rem; color: var(--color-text-muted); flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .legend-val { font-size: 0.82rem; font-weight: 700; color: var(--color-text); }
    .legend-pct { font-size: 0.72rem; color: var(--color-text-muted); margin-left: 2px; }
  `],
  template: `
    <div class="donut-wrap">
      <svg class="donut-svg" [attr.width]="size()" [attr.height]="size()" [attr.viewBox]="'0 0 ' + size() + ' ' + size()">
        @for (arc of arcs(); track arc.label) {
          <circle
            [attr.cx]="cx()"
            [attr.cy]="cy()"
            [attr.r]="radius()"
            fill="none"
            [attr.stroke]="arc.color"
            [attr.stroke-width]="thickness()"
            [attr.stroke-dasharray]="arc.dashArray"
            [attr.stroke-dashoffset]="arc.dashOffset"
            stroke-linecap="round"
            style="transform-origin: center; transform: rotate(-90deg);"
          />
        }
        <!-- Center text -->
        <text class="donut-center-text" [attr.x]="cx()" [attr.y]="cy() - 6">
          <tspan class="donut-center-val" [attr.x]="cx()" dy="0">{{ centerValue() }}</tspan>
          <tspan class="donut-center-label" [attr.x]="cx()" dy="14">{{ centerLabel() }}</tspan>
        </text>
      </svg>

      <div class="legend">
        @for (slice of slices(); track slice.label) {
          <div class="legend-item">
            <div class="legend-dot" [style.background]="slice.color"></div>
            <span class="legend-label">{{ slice.label }}</span>
            <span class="legend-val">{{ slice.value }}</span>
            <span class="legend-pct">({{ pct(slice.value) }}%)</span>
          </div>
        }
      </div>
    </div>
  `
})
export class DonutChartComponent {
  slices = input.required<DonutSlice[]>();
  size = input(120);
  thickness = input(16);
  centerLabel = input('total');

  cx = computed(() => this.size() / 2);
  cy = computed(() => this.size() / 2);
  radius = computed(() => (this.size() - this.thickness()) / 2);

  total = computed(() => this.slices().reduce((s, x) => s + x.value, 0));
  centerValue = computed(() => this.total());

  arcs = computed(() => {
    const r = this.radius();
    const circ = 2 * Math.PI * r;
    const total = this.total() || 1;
    let offset = 0;
    // small gap between slices
    const gap = circ * 0.01;

    return this.slices().map(slice => {
      const frac = slice.value / total;
      const dash = Math.max(frac * circ - gap, 0);
      const result = {
        label: slice.label,
        color: slice.color,
        dashArray: `${dash} ${circ - dash}`,
        dashOffset: -offset
      };
      offset += frac * circ;
      return result;
    });
  });

  pct(value: number): number {
    const t = this.total();
    return t ? Math.round((value / t) * 100) : 0;
  }
}
