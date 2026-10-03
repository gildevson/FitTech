import { Component, input, output } from '@angular/core';

export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl';

const WIDTHS: Record<DrawerSize, string> = {
  sm: '400px',
  md: '480px',
  lg: '640px',
  xl: '900px',
};

@Component({
  selector: 'ui-drawer',
  standalone: true,
  styles: [`
    .overlay {
      position: fixed; inset: 0; background: rgba(16,24,40,0.45);
      display: flex; align-items: stretch; justify-content: flex-end; z-index: 1000;
      animation: ui-drawer-fade 0.2s ease-out;
    }
    .panel {
      background: var(--color-card-bg); border-left: 1px solid var(--color-border);
      box-shadow: var(--shadow-lg);
      padding: 32px; width: var(--ui-drawer-width); max-width: 95vw; height: 100vh; overflow-y: auto;
      animation: ui-drawer-slide 0.25s ease-out;
    }
    @keyframes ui-drawer-fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes ui-drawer-slide { from { transform: translateX(100%); } to { transform: translateX(0); } }
  `],
  host: {
    '[style.--ui-drawer-width]': 'width()',
  },
  template: `
    <div class="overlay" (click)="close.emit()">
      <div class="panel" (click)="$event.stopPropagation()">
        <ng-content />
      </div>
    </div>
  `,
})
export class DrawerComponent {
  size = input<DrawerSize>('md');
  close = output<void>();

  protected width(): string {
    return WIDTHS[this.size()];
  }
}
