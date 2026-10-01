import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { LoginRequest, LoginResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = 'https://localhost:7195';

  readonly currentUser = signal<LoginResponse | null>(this.loadFromStorage());

  private loadFromStorage(): LoginResponse | null {
    const data = localStorage.getItem('fittech_user');
    return data ? JSON.parse(data) : null;
  }

  login(credentials: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.baseUrl}/api/auth/login`, credentials).pipe(
      tap(response => {
        localStorage.setItem('fittech_user', JSON.stringify(response));
        localStorage.setItem('fittech_token', response.token);
        this.currentUser.set(response);
      })
    );
  }

  logout() {
    localStorage.removeItem('fittech_user');
    localStorage.removeItem('fittech_token');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('fittech_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'admin';
  }
}
