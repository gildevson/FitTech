import { Component, input } from '@angular/core';

export type IconName =
  | 'dashboard'
  | 'muscle-group'
  | 'exercise'
  | 'workout-plan'
  | 'workout'
  | 'users'
  | 'sun'
  | 'moon'
  | 'logout';

@Component({
  selector: 'ui-icon',
  standalone: true,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
    }
    svg {
      width: var(--ui-icon-size, 18px);
      height: var(--ui-icon-size, 18px);
    }
  `],
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      @switch (name()) {
        @case ('dashboard') {
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        }
        @case ('muscle-group') {
          <path d="M6.5 7.5a2.5 2.5 0 0 1 5 0V9h5V7.5a2.5 2.5 0 0 1 5 0v3a2.5 2.5 0 0 1-2.5 2.5H18v1.5a2.5 2.5 0 0 1-5 0V13h-2v1.5a2.5 2.5 0 0 1-5 0V13H4.5A2.5 2.5 0 0 1 2 10.5v-3a2.5 2.5 0 0 1 5 0" />
        }
        @case ('exercise') {
          <path d="M4 9v6M2.5 10.5v3M20 9v6M21.5 10.5v3M7 12h10" />
          <rect x="4" y="7.5" width="3" height="9" rx="1" />
          <rect x="17" y="7.5" width="3" height="9" rx="1" />
        }
        @case ('workout-plan') {
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 3v3h8V3M8 11h8M8 15h5" />
        }
        @case ('workout') {
          <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
        }
        @case ('users') {
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <circle cx="17.5" cy="9" r="2.6" />
          <path d="M16 14.3c2.6.4 4.5 2.6 4.5 5.4" />
        }
        @case ('sun') {
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
        }
        @case ('moon') {
          <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
        }
        @case ('logout') {
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        }
      }
    </svg>
  `,
})
export class IconComponent {
  name = input.required<IconName>();
}
