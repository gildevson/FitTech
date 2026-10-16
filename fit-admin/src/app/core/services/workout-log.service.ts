import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { WorkoutStats, UserWorkoutStats, UserWorkoutLog } from '../models';

@Injectable({ providedIn: 'root' })
export class WorkoutLogService {
  private api = inject(ApiService);

  getAdminStats(): Observable<WorkoutStats> {
    return this.api.get<WorkoutStats>('/api/workoutlogs/admin/stats');
  }

  getUserStats(): Observable<UserWorkoutStats[]> {
    return this.api.get<UserWorkoutStats[]>('/api/workoutlogs/admin/users');
  }

  getUserLogs(userId: string): Observable<UserWorkoutLog[]> {
    return this.api.get<UserWorkoutLog[]>(`/api/workoutlogs/admin/users/${userId}`);
  }
}
