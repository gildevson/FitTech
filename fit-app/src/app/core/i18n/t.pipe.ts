import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from './i18n.service';

/**
 * Uso no template: {{ 'tabs.workouts' | t }} ou {{ 'session.progress' | t: { done: 2, total: 9 } }}.
 * Impuro para atualizar na hora quando o idioma muda (a busca é só uma leitura de objeto).
 */
@Pipe({ name: 't', standalone: true, pure: false })
export class TPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: string, params?: Record<string, string | number | null | undefined>): string {
    return this.i18n.t(key, params);
  }
}
