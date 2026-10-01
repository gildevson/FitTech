export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  name: string;
  email: string;
  role: string;
}

export interface MuscleGroup {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Exercise {
  id: number;
  name: string;
  description?: string;
  muscleGroupId: number;
  muscleGroupName?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface WorkoutPlan {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Workout {
  id: number;
  workoutPlanId: number;
  workoutPlanName?: string;
  name: string;
  dayOfWeek: number;
  orderIndex: number;
  createdAt: string;
}

export interface WorkoutExercise {
  id: number;
  workoutId: number;
  exerciseId: number;
  exerciseName?: string;
  muscleGroupName?: string;
  sets: number;
  reps: string;
  restSeconds: number;
  orderIndex: number;
  notes?: string;
}

export interface AppUser {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}
