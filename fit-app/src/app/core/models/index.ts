/** Medidas corporais: circunferências em cm, peso em kg. Todas opcionais. */
export interface BodyMeasurement {
  id: string;
  measuredDate: string;
  weightKg?: number | null;
  neckCm?: number | null;
  shouldersCm?: number | null;
  chestCm?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
  rightArmCm?: number | null;
  leftArmCm?: number | null;
  rightThighCm?: number | null;
  leftThighCm?: number | null;
  rightCalfCm?: number | null;
  leftCalfCm?: number | null;
  notes?: string | null;
  createdAt: string;
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
  userId: string;
  language?: string | null;
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
  sets: number;
  reps: string;
  restSeconds: number;
  orderIndex: number;
  notes?: string;
  // Carga planejada (kg) de cada série: [40, 45, 50]
  setWeights?: (number | null)[] | null;
}

export interface AppUser {
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
  // Quem criou: o próprio aluno pode editar/excluir; dieta do personal não
  createdBy?: string | null;
  createdAt: string;
  meals: Meal[];
}

export interface Meal {
  id: string;
  dietId: string;
  name: string;
  mealOrder: number;
  mealTime?: string;
  // Presente quando o aluno usa um horário só dele (dieta atribuída)
  originalMealTime?: string | null;
  // Quem adicionou: o aluno pode apagar o que ele mesmo adicionou
  createdBy?: string | null;
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
  createdBy?: string | null;
}

export interface FoodSearchResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  code: string;
}

export interface WorkoutLog {
  id: string;
  userId: string;
  workoutId: string;
  loggedDate: string;
  // done = treinou | skipped = pulou (sem tempo, machucado...)
  status?: 'done' | 'skipped';
  skipReason?: string | null;
  createdAt: string;
}

/** Treino registrado com nome, usado no calendário (GET /api/workoutlogs/me/calendar) */
export interface CalendarWorkoutLog {
  id: string;
  loggedDate: string;
  workoutName: string;
  planName: string;
  status: 'done' | 'skipped';
  skipReason?: string | null;
}

export interface AssignedWorkout {
  id: string;
  workoutId: string;
  workoutName: string;
  planName: string;
  dayOfWeek: number;
  assignedAt: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  language?: string;
  zipCode?: string;
  city?: string;
  state?: string;
}
