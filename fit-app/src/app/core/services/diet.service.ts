import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { ApiService } from './api.service';
import { Diet, FoodSearchResult } from '../models';

@Injectable({ providedIn: 'root' })
export class DietService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  private getUserIdFromToken(): string {
    const token = localStorage.getItem('fitmob_token');
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      // ClaimTypes.NameIdentifier maps to this long URI key in .NET JWT
      return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
        ?? payload['sub']
        ?? payload['nameid']
        ?? '';
    } catch {
      return '';
    }
  }

  getMyDiets(): Observable<Diet[]> {
    const userId = this.getUserIdFromToken();
    return this.api.get<Diet[]>(`/api/diets/user/${userId}`);
  }

  getDiet(id: string): Observable<Diet> {
    return this.api.get<Diet>(`/api/diets/${id}`);
  }

  createDiet(dto: { name: string; description?: string }): Observable<Diet> {
    const userId = this.getUserIdFromToken();
    return this.api.post<Diet>('/api/diets', dto).pipe(
      switchMap(diet =>
        this.api.post<unknown>('/api/diets/assign', { userId, dietId: diet.id }).pipe(map(() => diet))
      )
    );
  }

  addMeal(dietId: string, dto: { name: string; mealOrder: number; mealTime: string }): Observable<any> {
    return this.api.post<any>(`/api/diets/${dietId}/meals`, { dietId, ...dto });
  }

  updateMealTime(mealId: string, mealTime: string): Observable<void> {
    return this.api.put<void>(`/api/diets/meals/${mealId}/time`, { mealTime });
  }

  resetMealTime(mealId: string): Observable<void> {
    return this.api.delete<void>(`/api/diets/meals/${mealId}/time`);
  }

  addFood(mealId: string, dto: {
    foodName: string;
    quantityGrams: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    openFoodFactsId?: string;
    servingUnit?: string;
    servingGrams?: number;
  }): Observable<any> {
    return this.api.post<any>(`/api/diets/meals/${mealId}/foods`, { mealId, ...dto });
  }

  updateFood(foodId: string, dto: {
    mealId: string;
    foodName: string;
    quantityGrams: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingUnit?: string;
    servingGrams?: number;
  }): Observable<void> {
    return this.api.put<void>(`/api/diets/foods/${foodId}`, dto);
  }

  /** Apaga a dieta inteira (só funciona para quem criou) */
  deleteDiet(dietId: string): Observable<void> {
    return this.api.delete<void>(`/api/diets/${dietId}`);
  }

  /** Tira a dieta da minha lista; uma dieta padrão do personal continua existindo para os outros */
  removeDietFromMyList(dietId: string): Observable<void> {
    return this.api.delete<void>(`/api/diets/${dietId}/me`);
  }

  deleteMeal(mealId: string): Observable<void> {
    return this.api.delete<void>(`/api/diets/meals/${mealId}`);
  }

  deleteFood(foodId: string): Observable<void> {
    return this.api.delete<void>(`/api/diets/foods/${foodId}`);
  }

  searchFood(query: string): Observable<FoodSearchResult[]> {
    return this.api.get<FoodSearchResult[]>(`/api/diets/search-food?query=${encodeURIComponent(query)}`);
  }
}
