import { Component, input, output } from '@angular/core';

export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const WIDTHS: Record<DrawerSize, string> = {
  sm: '400px',
  md: '480px',
  lg: '640px',
  xl: '900px',
  full: '80vw',
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
      position: relative;
      background: var(--color-card-bg); border-left: 1px solid var(--color-border);
      box-shadow: var(--shadow-lg);
      padding: 32px; width: var(--ui-drawer-width); max-width: 95vw; height: 100vh; overflow-y: auto;
      animation: ui-drawer-slide 0.25s ease-out;
    }
    .close-btn {
      position: absolute; top: 20px; right: 20px; z-index: 1;
      width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
      background: transparent; border: none; border-radius: 50%;
      color: var(--color-text-muted); cursor: pointer; font-size: 1.1rem; line-height: 1;
      transition: background 0.15s, color 0.15s;
    }
    .close-btn:hover { background: var(--color-surface-hover); color: var(--color-text); }
    @keyframes ui-drawer-fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes ui-drawer-slide { from { transform: translateX(100%); } to { transform: translateX(0); } }
  `],
  host: {
    '[style.--ui-drawer-width]': 'width()',
  },
  template: `
    <div class="overlay" (click)="close.emit()">
      <div class="panel" (click)="$event.stopPropagation()">
        <button type="button" class="close-btn" (click)="close.emit()" aria-label="Fechar">✕</button>
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
