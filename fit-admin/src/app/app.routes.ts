import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/layout/layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'muscle-groups', loadComponent: () => import('./features/muscle-groups/muscle-groups.component').then(m => m.MuscleGroupsComponent) },
      { path: 'exercises', loadComponent: () => import('./features/exercises/exercises.component').then(m => m.ExercisesComponent) },
      { path: 'workout-plans', loadComponent: () => import('./features/workout-plans/workout-plans.component').then(m => m.WorkoutPlansComponent) },
      { path: 'workouts', loadComponent: () => import('./features/workouts/workouts.component').then(m => m.WorkoutsComponent) },
      { path: 'users', loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent) },
    ]
  }
];
