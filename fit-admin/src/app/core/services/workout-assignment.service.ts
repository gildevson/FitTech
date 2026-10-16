import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { WorkoutAssignee, AssignedWorkout } from '../models';

@Injectable({ providedIn: 'root' })
export class WorkoutAssignmentService {
  private api = inject(ApiService);

  getAssignees(workoutId: string): Observable<WorkoutAssignee[]> {
    return this.api.get<WorkoutAssignee[]>(`/api/workout-assignments/${workoutId}/assignees`);
  }

  assign(workoutId: string, userIds: string[]): Observable<void> {
    return this.api.post<void>(`/api/workout-assignments/${workoutId}`, { userIds });
  }

  unassign(workoutId: string, userId: string): Observable<void> {
    return this.api.delete<void>(`/api/workout-assignments/${workoutId}/user/${userId}`);
  }

  getMyAssignments(): Observable<AssignedWorkout[]> {
    return this.api.get<AssignedWorkout[]>('/api/workout-assignments/me');
  }

  getAssignmentsForUser(userId: string): Observable<AssignedWorkout[]> {
    return this.api.get<AssignedWorkout[]>(`/api/workout-assignments/user/${userId}`);
  }
}
