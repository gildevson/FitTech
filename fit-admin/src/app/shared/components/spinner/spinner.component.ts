import { Component, input } from '@angular/core';

export type SpinnerSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-spinner',
  standalone: true,
  styles: [`
    :host {
      display: inline-flex;
    }
    .spinner {
      display: block;
      border: 3px solid var(--color-border);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: ui-spin 0.65s linear infinite;
    }
    .sm { width: 16px; height: 16px; border-width: 2px; }
    .md { width: 26px; height: 26px; border-width: 3px; }
    .lg { width: 40px; height: 40px; border-width: 4px; }
    @keyframes ui-spin {
      to { transform: rotate(360deg); }
    }
  `],
  template: `<span class="spinner" [class]="size()"></span>`,
})
export class SpinnerComponent {
  size = input<SpinnerSize>('md');
}
