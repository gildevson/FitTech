import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { WorkoutExercise } from '../models';

@Injectable({ providedIn: 'root' })
export class WorkoutExerciseService {
  private api = inject(ApiService);

  getByWorkout(workoutId: string): Observable<WorkoutExercise[]> {
    return this.api.get<WorkoutExercise[]>('/api/workoutexercises', { workoutId });
  }

  create(dto: {
    workoutId: string;
    exerciseId: string;
    sets: number;
    reps: string;
    restSeconds: number;
    orderIndex: number;
    notes?: string;
  }): Observable<WorkoutExercise> {
    return this.api.post<WorkoutExercise>('/api/workoutexercises', dto);
  }

  update(id: string, dto: {
    sets: number;
    reps: string;
    restSeconds: number;
    orderIndex: number;
    notes?: string;
  }): Observable<void> {
    return this.api.put<void>(`/api/workoutexercises/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/api/workoutexercises/${id}`);
  }
}
