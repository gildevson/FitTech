import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { WorkoutPlan } from '../models';

@Injectable({ providedIn: 'root' })
export class WorkoutPlanService {
  private api = inject(ApiService);

  getAll(): Observable<WorkoutPlan[]> {
    return this.api.get<WorkoutPlan[]>('/api/workoutplans');
  }

  getById(id: number): Observable<WorkoutPlan> {
    return this.api.get<WorkoutPlan>(`/api/workoutplans/${id}`);
  }

  create(data: Partial<WorkoutPlan>): Observable<WorkoutPlan> {
    return this.api.post<WorkoutPlan>('/api/workoutplans', data);
  }

  update(id: number, data: Partial<WorkoutPlan>): Observable<WorkoutPlan> {
    return this.api.put<WorkoutPlan>(`/api/workoutplans/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/api/workoutplans/${id}`);
  }
}
