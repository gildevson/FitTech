import { Injectable, inject, signal, effect } from '@angular/core';
import { AuthService } from './auth.service';

const MAX_SIZE = 320;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Foto de perfil guardada no aparelho, uma por e-mail (a API ainda não tem campo de foto). */
@Injectable({ providedIn: 'root' })
export class ProfilePhotoService {
  private readonly auth = inject(AuthService);
  readonly photo = signal<string | null>(null);

  constructor() {
    effect(() => {
      const email = this.auth.currentUser()?.email;
      this.photo.set(email ? this.read(email) : null);
    }, { allowSignalWrites: true });
  }

  async setFromFile(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) throw new Error('Selecione um arquivo de imagem.');
    if (file.size > MAX_FILE_BYTES) throw new Error('A imagem deve ter no máximo 10 MB.');

    const email = this.auth.currentUser()?.email;
    if (!email) return;

    const dataUrl = await this.resize(file);
    try {
      localStorage.setItem(this.key(email), dataUrl);
    } catch {
      throw new Error('Não foi possível salvar a foto neste aparelho.');
    }
    this.photo.set(dataUrl);
  }

  remove() {
    const email = this.auth.currentUser()?.email;
    if (email) localStorage.removeItem(this.key(email));
    this.photo.set(null);
  }

  private key(email: string) {
    return `fitmob_photo_${email.toLowerCase()}`;
  }

  private read(email: string): string | null {
    try {
      return localStorage.getItem(this.key(email));
    } catch {
      return null;
    }
  }

  /** Recorta para quadrado centralizado e reduz para MAX_SIZE. */
  private async resize(file: File): Promise<string> {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    const size = Math.min(side, MAX_SIZE);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    canvas.getContext('2d')!.drawImage(
      bitmap,
      (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side,
      0, 0, size, size
    );
    bitmap.close();
    return canvas.toDataURL('image/jpeg', 0.85);
  }
}
