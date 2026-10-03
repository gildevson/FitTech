import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Exercise } from '../models';

@Injectable({ providedIn: 'root' })
export class ExerciseService {
  private api = inject(ApiService);

  getAll(muscleGroupId?: string): Observable<Exercise[]> {
    const params = muscleGroupId ? { muscleGroupId } : undefined;
    return this.api.get<Exercise[]>('/api/exercises', params);
  }

  getById(id: string): Observable<Exercise> {
    return this.api.get<Exercise>(`/api/exercises/${id}`);
  }

  create(data: Partial<Exercise>): Observable<Exercise> {
    return this.api.post<Exercise>('/api/exercises', data);
  }

  update(id: string, data: Partial<Exercise>): Observable<Exercise> {
    return this.api.put<Exercise>(`/api/exercises/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/api/exercises/${id}`);
  }
}
