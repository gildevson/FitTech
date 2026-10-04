import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Diet, Meal, MealFood, FoodSearchResult } from '../models';

@Injectable({ providedIn: 'root' })
export class DietService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  getAll(): Observable<Diet[]> {
    return this.api.get<Diet[]>('/api/diets');
  }

  getById(id: string): Observable<Diet> {
    return this.api.get<Diet>(`/api/diets/${id}`);
  }

  create(dto: { name: string; description?: string }): Observable<Diet> {
    return this.api.post<Diet>('/api/diets', dto);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/api/diets/${id}`);
  }

  addMeal(dietId: string, dto: { name: string; mealOrder: number; mealTime: string }): Observable<Meal> {
    return this.api.post<Meal>(`/api/diets/${dietId}/meals`, { dietId, ...dto });
  }

  updateMeal(mealId: string, dto: { name: string; mealOrder: number; mealTime: string }): Observable<void> {
    return this.api.put<void>(`/api/diets/meals/${mealId}`, dto);
  }

  deleteMeal(mealId: string): Observable<void> {
    return this.api.delete<void>(`/api/diets/meals/${mealId}`);
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
  }): Observable<MealFood> {
    return this.api.post<MealFood>(`/api/diets/meals/${mealId}/foods`, { mealId, ...dto });
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

  deleteFood(foodId: string): Observable<void> {
    return this.api.delete<void>(`/api/diets/foods/${foodId}`);
  }

  assignToUser(dto: { userId: string; dietId: string }): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/api/diets/assign', dto);
  }

  getUserDiets(userId: string): Observable<Diet[]> {
    return this.api.get<Diet[]>(`/api/diets/user/${userId}`);
  }

  searchFood(query: string): Observable<FoodSearchResult[]> {
    return this.api.get<FoodSearchResult[]>(`/api/diets/search-food?query=${encodeURIComponent(query)}`);
  }
}
