import { Component, input } from '@angular/core';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'ui-loading-overlay',
  standalone: true,
  imports: [SpinnerComponent],
  styles: [`
    :host {
      position: relative;
      display: block;
    }
    .overlay {
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.72);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 5;
      animation: ui-fade-in 0.1s ease-out;
    }
    @keyframes ui-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `],
  template: `
    <ng-content />
    @if (loading()) {
      <div class="overlay">
        <ui-spinner size="lg" />
      </div>
    }
  `,
})
export class LoadingOverlayComponent {
  loading = input(false);
}
