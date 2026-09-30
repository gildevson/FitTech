import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Workout } from '../models';

@Injectable({ providedIn: 'root' })
export class WorkoutService {
  private api = inject(ApiService);

  getAll(workoutPlanId?: number): Observable<Workout[]> {
    const params = workoutPlanId ? { workoutPlanId } : undefined;
    return this.api.get<Workout[]>('/api/workouts', params);
  }

  getById(id: number): Observable<Workout> {
    return this.api.get<Workout>(`/api/workouts/${id}`);
  }

  create(data: Partial<Workout>): Observable<Workout> {
    return this.api.post<Workout>('/api/workouts', data);
  }

  update(id: number, data: Partial<Workout>): Observable<Workout> {
    return this.api.put<Workout>(`/api/workouts/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/api/workouts/${id}`);
  }
}
