import { Component, input } from '@angular/core';

/** Título do cabeçalho: marca "FitMob" pequena em cima e o nome da tela em destaque. */
@Component({
  selector: 'app-page-title',
  standalone: true,
  styles: [`
    :host { display: flex; flex-direction: column; justify-content: center; line-height: 1.1; min-width: 0; }
    .brand {
      font-size: 0.66rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase;
      color: var(--ft-text-faint); margin-bottom: 3px;
    }
    .brand b { color: var(--ft-accent); font-weight: 800; }
    .title {
      font-size: 1.32rem; font-weight: 800; letter-spacing: -0.02em; color: var(--ft-text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
  `],
  template: `
    <span class="brand">Fit<b>Mob</b></span>
    <span class="title">{{ title() }}</span>
  `
})
export class PageTitleComponent {
  title = input.required<string>();
}
