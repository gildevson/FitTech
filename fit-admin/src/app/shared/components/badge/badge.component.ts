import { Component, input } from '@angular/core';

export type BadgeVariant = 'neutral' | 'primary' | 'success' | 'danger' | 'warning';

@Component({
  selector: 'ui-badge',
  standalone: true,
  styles: [`
    span {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 600;
    }
    .neutral { background: var(--color-surface-hover); color: var(--color-text-muted); }
    .primary { background: var(--color-primary-soft); color: var(--color-primary); }
    .success { background: var(--color-success-soft); color: var(--color-success); }
    .danger { background: var(--color-danger-soft); color: var(--color-danger); }
    .warning { background: var(--color-warning-soft); color: var(--color-warning); }
  `],
  template: `<span [class]="variant()"><ng-content /></span>`,
})
export class BadgeComponent {
  variant = input<BadgeVariant>('neutral');
}
