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
  userId?: string;
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
  imageUrl?: string;
  sets: number;
  reps: string;
  restSeconds: number;
  orderIndex: number;
  notes?: string;
}

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

export interface UserAddress {
  zipCode?: string | null;
  street?: string | null;
  addressNumber?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface AppUser extends UserAddress {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface Diet {
  id: string;
  name: string;
  description?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  meals: Meal[];
}

export interface Meal {
  id: string;
  dietId: string;
  name: string;
  mealOrder: number;
  mealTime?: string;
  foods: MealFood[];
}

export interface MealFood {
  id: string;
  mealId: string;
  foodName: string;
  quantityGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingUnit?: string;
  servingGrams?: number;
}

export interface RecentWorkoutLog {
  id: string;
  userName: string;
  workoutName: string;
  planName: string;
  loggedDate: string;
  createdAt: string;
}

export interface PopularPlan {
  planName: string;
  logCount: number;
  userCount: number;
}

export interface UserWorkoutStats {
  id: string;
  name: string;
  email: string;
  totalLogs: number;
  logsThisWeek: number;
  logsThisMonth: number;
  lastWorkoutDate: string | null;
}

export interface UserWorkoutLog {
  id: string;
  loggedDate: string;
  workoutName: string;
  planName: string;
  status?: 'done' | 'skipped';
  skipReason?: string | null;
}

export interface WorkoutStats {
  recentActivity: RecentWorkoutLog[];
  popularPlans: PopularPlan[];
}

export interface WorkoutAssignee {
  assignmentId: string;
  userId: string;
  userName: string;
  userEmail: string;
  assignedAt: string;
}

export interface AssignedWorkout {
  id: string;
  workoutId: string;
  workoutName: string;
  planName: string;
  dayOfWeek: number;
  assignedAt: string;
}

export interface FoodSearchResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  code: string;
}
