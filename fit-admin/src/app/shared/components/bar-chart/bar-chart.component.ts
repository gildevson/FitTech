import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BarChartPoint {
  label: string;
  value: number;
}

@Component({
  selector: 'ui-bar-chart',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    :host {
      display: block;
    }
    .chart {
      position: relative;
      display: flex;
      align-items: stretch;
      justify-content: center;
      gap: 48px;
      height: 220px;
      padding: 8px 12px 0;
    }
    .gridlines {
      position: absolute;
      inset: 0 12px 28px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      pointer-events: none;
    }
    .gridlines span {
      border-top: 1px dashed var(--color-border);
      height: 0;
    }
    .bar-col {
      position: relative;
      width: 64px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      height: 100%;
      justify-content: flex-end;
      z-index: 1;
    }
    .bar-value {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--color-text);
    }
    .bar {
      width: 36px;
      max-width: 36px;
      flex: 1;
      display: flex;
      align-items: flex-end;
      border-radius: 8px 8px 0 0;
      background: var(--color-surface-hover);
      overflow: hidden;
    }
    .bar-fill {
      width: 100%;
      border-radius: 8px 8px 0 0;
      background: linear-gradient(180deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
      transition: height 0.4s ease-out;
    }
    .bar-col:hover .bar-fill {
      filter: brightness(1.08);
    }
    .bar-label {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--color-text-muted);
    }
  `],
  template: `
    <div class="chart">
      <div class="gridlines">
        <span></span><span></span><span></span><span></span>
      </div>
      @for (point of data(); track point.label) {
        <div class="bar-col">
          <span class="bar-value">{{ point.value }}</span>
          <div class="bar">
            <div class="bar-fill" [style.height.%]="percent(point.value)"></div>
          </div>
          <span class="bar-label">{{ point.label }}</span>
        </div>
      }
    </div>
  `,
})
export class BarChartComponent {
  data = input.required<BarChartPoint[]>();

  private max = computed(() => Math.max(...this.data().map((d) => d.value), 1));

  percent(value: number): number {
    return Math.max((value / this.max()) * 100, value > 0 ? 4 : 0);
  }
}
