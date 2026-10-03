import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { MuscleGroup } from '../models';

@Injectable({ providedIn: 'root' })
export class MuscleGroupService {
  private api = inject(ApiService);

  getAll(): Observable<MuscleGroup[]> {
    return this.api.get<MuscleGroup[]>('/api/musclegroups');
  }

  getById(id: string): Observable<MuscleGroup> {
    return this.api.get<MuscleGroup>(`/api/musclegroups/${id}`);
  }

  create(data: Partial<MuscleGroup>): Observable<MuscleGroup> {
    return this.api.post<MuscleGroup>('/api/musclegroups', data);
  }

  update(id: string, data: Partial<MuscleGroup>): Observable<MuscleGroup> {
    return this.api.put<MuscleGroup>(`/api/musclegroups/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/api/musclegroups/${id}`);
  }
}
