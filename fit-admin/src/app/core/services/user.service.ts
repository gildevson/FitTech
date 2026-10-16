import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { AppUser, UserAddress } from '../models';
import { Observable } from 'rxjs';
import type { StateCount, CityCount } from '../../shared/components/brazil-map/brazil-map.component';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiService);

  getAll(): Observable<AppUser[]> {
    return this.api.get<AppUser[]>('/api/users');
  }

  create(data: { name: string; email: string; password: string; role: string } & UserAddress): Observable<AppUser> {
    return this.api.post<AppUser>('/api/users', data);
  }

  update(id: string, data: { name: string; email: string; role: string; isActive: boolean } & UserAddress): Observable<void> {
    return this.api.put<void>(`/api/users/${id}`, data);
  }

  toggleActive(id: string, isActive: boolean): Observable<void> {
    return this.api.patch<void>(`/api/users/${id}/toggle-active`, isActive);
  }

  countByState(): Observable<StateCount[]> {
    return this.api.get<StateCount[]>('/api/users/stats/by-state');
  }

  countByCity(state: string): Observable<CityCount[]> {
    return this.api.get<CityCount[]>('/api/users/stats/by-city', { state });
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/api/users/${id}`);
  }
}
