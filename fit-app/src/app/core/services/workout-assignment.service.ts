import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AssignedWorkout } from '../models';

@Injectable({ providedIn: 'root' })
export class WorkoutAssignmentService {
  private api = inject(ApiService);

  getMyAssignments(): Observable<AssignedWorkout[]> {
    return this.api.get<AssignedWorkout[]>('/api/workout-assignments/me');
  }
}
