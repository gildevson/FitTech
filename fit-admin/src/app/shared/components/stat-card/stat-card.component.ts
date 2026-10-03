import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';

@Component({
  selector: 'ui-stat-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  styles: [`
    :host {
      position: relative;
      display: block;
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      padding: 22px 24px 24px;
      overflow: hidden;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    :host::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: var(--stat-accent, var(--color-primary));
    }
    :host(:hover) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .top-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 18px;
    }
    .label {
      font-size: 0.74rem;
      color: var(--color-text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .icon {
      --ui-icon-size: 17px;
      width: 34px;
      height: 34px;
      border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--stat-accent, var(--color-primary)) 14%, transparent);
      color: var(--stat-accent, var(--color-primary));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }
    .value {
      font-size: 2.1rem;
      font-weight: 700;
      color: var(--color-text);
      line-height: 1;
      margin-bottom: 8px;
      font-variant-numeric: tabular-nums;
    }
    .trend {
      font-size: 0.82rem;
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--color-text-muted);
    }
    .trend-value.up { color: var(--color-success); font-weight: 700; }
    .trend-value.down { color: var(--color-danger); font-weight: 700; }
  `],
  host: {
    '[style.--stat-accent]': 'accent()',
  },
  template: `
    <div class="top-row">
      <span class="label">{{ label() }}</span>
      @if (iconName()) {
        <span class="icon"><ui-icon [name]="iconName()!" /></span>
      } @else if (icon()) {
        <span class="icon">{{ icon() }}</span>
      }
    </div>
    <div class="value">{{ value() }}</div>
    @if (trendLabel()) {
      <div class="trend">
        @if (trendValue()) {
          <span class="trend-value" [class.up]="trendDirection() === 'up'" [class.down]="trendDirection() === 'down'">
            {{ trendValue() }}
          </span>
        }
        <span>{{ trendLabel() }}</span>
      </div>
    }
  `,
})
export class StatCardComponent {
  label = input.required<string>();
  value = input.required<string | number>();
  icon = input<string>('');
  iconName = input<IconName | undefined>(undefined);
  accent = input<string>('var(--color-primary)');
  trendValue = input<string>('');
  trendLabel = input<string>('');
  trendDirection = input<'up' | 'down' | ''>('');
}
