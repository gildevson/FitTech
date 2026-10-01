import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { AppUser } from '../models';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiService);

  getAll(): Observable<AppUser[]> {
    return this.api.get<AppUser[]>('/api/users');
  }

  create(data: { name: string; email: string; password: string; role: string }): Observable<AppUser> {
    return this.api.post<AppUser>('/api/users', data);
  }

  update(id: number, data: { name: string; email: string; role: string; isActive: boolean }): Observable<void> {
    return this.api.put<void>(`/api/users/${id}`, data);
  }

  toggleActive(id: number, isActive: boolean): Observable<void> {
    return this.api.patch<void>(`/api/users/${id}/toggle-active`, isActive);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/api/users/${id}`);
  }
}
