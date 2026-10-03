import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'ui-pagination',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  styles: [`
    :host {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      border-top: 1px solid var(--color-border);
    }
    .summary {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: var(--color-text-muted);
    }
    .pages {
      display: flex;
      align-items: center;
      gap: 4px;
      grid-column: 2;
      justify-self: center;
    }
    button {
      min-width: 32px;
      height: 32px;
      padding: 0 8px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
      background: var(--color-card-bg);
      color: var(--color-text);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    button:hover:not(:disabled):not(.active) {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
    button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    button.active {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: #fff;
    }
    .ellipsis {
      padding: 0 4px;
      color: var(--color-text-muted);
    }
  `],
  template: `
    <span class="summary">
      {{ rangeStart() }}–{{ rangeEnd() }} de {{ total() }}
      @if (loading()) {
        <ui-spinner size="sm" />
      }
    </span>
    <div class="pages">
      <button (click)="goTo(page() - 1)" [disabled]="loading() || page() === 1">‹</button>
      @for (p of pageNumbers(); track $index) {
        @if (p === -1) {
          <span class="ellipsis">…</span>
        } @else {
          <button [class.active]="p === page()" [disabled]="loading()" (click)="goTo(p)">{{ p }}</button>
        }
      }
      <button (click)="goTo(page() + 1)" [disabled]="loading() || page() === totalPages()">›</button>
    </div>
  `,
})
export class PaginationComponent {
  total = input.required<number>();
  page = input.required<number>();
  pageSize = input(10);
  loading = input(false);

  pageChange = output<number>();

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  rangeStart = computed(() => this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1);
  rangeEnd = computed(() => Math.min(this.page() * this.pageSize(), this.total()));

  pageNumbers = computed<number[]>(() => {
    const total = this.totalPages();
    const current = this.page();
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    if (current > 3) pages.push(-1);
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  });

  goTo(page: number) {
    if (page < 1 || page > this.totalPages() || page === this.page()) return;
    this.pageChange.emit(page);
  }
}
