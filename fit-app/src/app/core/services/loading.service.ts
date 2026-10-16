import { Injectable, computed, signal } from '@angular/core';

const MIN_VISIBLE_MS = 400;

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly navigating = signal(false);
  private readonly pendingRequests = signal(0);
  private navStartedAt = 0;
  private hideTimer?: ReturnType<typeof setTimeout>;

  /** Mensagem de uma ação longa (ex.: "Aplicando idioma..."); mostra o overlay enquanto existir */
  readonly message = signal<string | null>(null);
  /** Overlay: troca de página ou ação com mensagem */
  readonly pageLoading = computed(() => this.navigating() || this.message() !== null);
  /** Barra de topo: navegação ou requisições HTTP em andamento */
  readonly busy = computed(() => this.navigating() || this.pendingRequests() > 0);

  startNavigation() {
    clearTimeout(this.hideTimer);
    this.navStartedAt = Date.now();
    this.navigating.set(true);
  }

  endNavigation() {
    const remaining = MIN_VISIBLE_MS - (Date.now() - this.navStartedAt);
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this.navigating.set(false), Math.max(remaining, 0));
  }

  showMessage(text: string) {
    this.message.set(text);
  }

  hideMessage() {
    this.message.set(null);
  }

  requestStarted() {
    this.pendingRequests.update(n => n + 1);
  }

  requestFinished() {
    this.pendingRequests.update(n => Math.max(n - 1, 0));
  }
}
