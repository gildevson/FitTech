import { Component } from '@angular/core';

@Component({
  selector: 'ui-table-card',
  standalone: true,
  styles: [`
    :host {
      display: block;
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }
  `],
  template: `<ng-content />`,
})
export class TableCardComponent {}
