import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TPipe } from '../../core/i18n/t.pipe';
import { AuthService } from '../../core/services/auth.service';
import { ProfilePhotoService } from '../../core/services/profile-photo.service';

/** Avatar no canto do cabeçalho que abre o Perfil (foto do aparelho ou inicial do nome). */
@Component({
  selector: 'app-profile-button',
  standalone: true,
  imports: [RouterLink, TPipe],
  styles: [`
    :host { display: inline-flex; padding-right: 14px; }
    /* Anel colorido (degradê do tema) em volta da foto */
    a {
      width: 42px; height: 42px; padding: 2px; border-radius: 50%;
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--ft-gradient); text-decoration: none;
      box-shadow: 0 4px 12px rgba(var(--ft-accent-rgb), 0.28);
      transition: transform 0.12s, box-shadow 0.2s;
      -webkit-tap-highlight-color: transparent;
    }
    a:active { transform: scale(0.92); }
    .inner {
      width: 100%; height: 100%; border-radius: 50%; overflow: hidden;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid var(--ft-surface); background: var(--ft-gradient);
      color: #fff; font-weight: 800; font-size: 0.95rem;
    }
    img { width: 100%; height: 100%; object-fit: cover; display: block; }
  `],
  template: `
    <a routerLink="/tabs/perfil" [attr.aria-label]="'tabs.profile' | t">
      <span class="inner">
        @if (photo.photo(); as p) {
          <img [src]="p" [alt]="'profile.photo_alt' | t" />
        } @else {
          {{ initial() }}
        }
      </span>
    </a>
  `
})
export class ProfileButtonComponent {
  private readonly auth = inject(AuthService);
  readonly photo = inject(ProfilePhotoService);

  initial = computed(() => (this.auth.currentUser()?.name?.trim()[0] ?? '?').toUpperCase());
}
