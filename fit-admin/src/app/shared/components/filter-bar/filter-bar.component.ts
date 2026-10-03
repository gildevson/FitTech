import { Component } from '@angular/core';

@Component({
  selector: 'ui-filter-bar',
  standalone: true,
  styles: [`
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 16px;
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      padding: 16px 20px;
      margin-bottom: 20px;
    }
    ::ng-deep .ui-filter-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 200px;
    }
    ::ng-deep .ui-filter-field label {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    ::ng-deep .ui-filter-field input,
    ::ng-deep .ui-filter-field select {
      box-sizing: border-box;
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      color: var(--color-text);
      padding: 9px 12px;
      font-size: 0.9rem;
      font-family: var(--font-family);
      transition: border-color 0.15s;
    }
    ::ng-deep .ui-filter-field input:focus,
    ::ng-deep .ui-filter-field select:focus {
      outline: none;
      border-color: var(--color-primary);
    }
  `],
  template: `<ng-content />`,
})
export class FilterBarComponent {}
