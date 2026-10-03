import { Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md';

@Component({
  selector: 'ui-button',
  standalone: true,
  styles: [`
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border-radius: var(--radius-sm);
      font-family: var(--font-family);
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      transition: background 0.15s, border-color 0.15s, color 0.15s, opacity 0.15s;
      white-space: nowrap;
    }
    button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .size-md { padding: 10px 20px; font-size: 0.9rem; }
    .size-sm { padding: 6px 12px; font-size: 0.82rem; }

    .variant-primary {
      background: var(--color-primary);
      color: #fff;
    }
    .variant-primary:hover:not(:disabled) { background: var(--color-primary-hover); }

    .variant-secondary {
      background: var(--color-card-bg);
      color: var(--color-text);
      border-color: var(--color-border);
    }
    .variant-secondary:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }

    .variant-danger {
      background: transparent;
      color: var(--color-danger);
      border-color: var(--color-danger);
    }
    .variant-danger:hover:not(:disabled) { background: var(--color-danger-soft); }

    .variant-ghost {
      background: transparent;
      color: var(--color-text-muted);
      border-color: transparent;
    }
    .variant-ghost:hover:not(:disabled) { background: var(--color-surface-hover); color: var(--color-text); }
  `],
  template: `
    <button
      [class]="'size-' + size() + ' variant-' + variant()"
      [type]="type()"
      [disabled]="disabled()"
    >
      <ng-content />
    </button>
  `,
})
export class ButtonComponent {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  type = input<'button' | 'submit'>('button');
  disabled = input(false);
}
