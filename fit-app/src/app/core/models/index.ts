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
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  muscleGroupId: string;
  muscleGroupName?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Workout {
  id: string;
  workoutPlanId: string;
  workoutPlanName?: string;
  name: string;
  dayOfWeek: number;
  orderIndex: number;
  createdAt: string;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  exerciseName?: string;
  muscleGroupName?: string;
  sets: number;
  reps: string;
  restSeconds: number;
  orderIndex: number;
  notes?: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}
