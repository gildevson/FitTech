import { Component, input } from '@angular/core';

@Component({
  selector: 'ui-page-header',
  standalone: true,
  styles: [`
    :host {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 28px;
    }
    h1 {
      font-size: 1.6rem;
      color: var(--color-text);
      font-weight: 700;
      margin: 0 0 4px 0;
    }
    p {
      color: var(--color-text-muted);
      font-size: 0.92rem;
      margin: 0;
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }
  `],
  template: `
    <div>
      <h1>{{ title() }}</h1>
      @if (subtitle()) {
        <p>{{ subtitle() }}</p>
      }
    </div>
    <div class="actions">
      <ng-content />
    </div>
  `,
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string>('');
}
