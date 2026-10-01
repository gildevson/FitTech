import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tabs/treinos',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'tabs',
    loadComponent: () => import('./pages/tabs/tabs.page').then(m => m.TabsPage),
    canActivate: [authGuard],
    children: [
      {
        path: 'treinos',
        loadComponent: () => import('./pages/treinos/treinos.page').then(m => m.TreinosPage)
      },
      {
        path: 'exercicios',
        loadComponent: () => import('./pages/exercicios/exercicios.page').then(m => m.ExerciciosPage)
      },
      {
        path: 'perfil',
        loadComponent: () => import('./pages/perfil/perfil.page').then(m => m.PerfilPage)
      },
      {
        path: '',
        redirectTo: 'treinos',
        pathMatch: 'full'
      }
    ]
  }
];
