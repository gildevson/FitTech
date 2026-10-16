import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DietService } from '../../core/services/diet.service';
import { Diet, Meal, MealFood, FoodSearchResult } from '../../core/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { DrawerComponent } from '../../shared/components/drawer/drawer.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-diets',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ButtonComponent, DrawerComponent, IconComponent],
  styles: [`
    .loading { color: var(--color-text-muted); padding: 32px; text-align: center; }
    .empty-state { text-align: center; padding: 40px; color: var(--color-text-muted); }

    .diet-list { display: flex; flex-direction: column; gap: 18px; }

    .diet-card {
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(16,24,40,0.05);
      transition: box-shadow 0.2s, border-color 0.2s;
    }
    .diet-card:hover { box-shadow: 0 4px 14px rgba(16,24,40,0.08); }

    .diet-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .diet-header:hover { background: var(--color-surface-hover); }

    .diet-header-left { display: flex; align-items: center; gap: 14px; }
    .diet-icon {
      width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 8px;
      background: var(--color-primary-soft, rgba(110,139,255,0.14));
      color: var(--color-primary);
      flex-shrink: 0;
      --ui-icon-size: 18px;
    }
    .diet-name { font-size: 1.02rem; font-weight: 700; color: var(--color-text); letter-spacing: -0.01em; }
    .diet-description { font-size: 0.82rem; color: var(--color-text-muted); margin-top: 2px; }

    .diet-header-right { display: flex; align-items: center; gap: 10px; }
    .diet-stats {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--color-warning, #f59e0b);
      background: color-mix(in srgb, var(--color-warning, #f59e0b) 12%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-warning, #f59e0b) 35%, transparent);
      border-radius: 20px;
      padding: 4px 12px;
      white-space: nowrap;
    }
    .diet-stats span { font-size: 0.92rem; font-weight: 700; }

    .creator-badge {
      font-size: 0.74rem;
      font-weight: 600;
      color: var(--color-primary);
      background: var(--color-primary-soft, rgba(110,139,255,0.12));
      border: 1px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
      border-radius: 20px;
      padding: 3px 10px;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .chevron {
      width: 20px; height: 20px;
      color: var(--color-text-muted);
      transition: transform 0.2s;
    }
    .chevron.open { transform: rotate(180deg); }

    .btn-icon {
      background: transparent;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      color: var(--color-text-muted);
      cursor: pointer;
      padding: 5px 8px;
      font-size: 0.8rem;
      transition: background 0.15s, color 0.15s;
    }
    .btn-icon:hover { background: var(--color-danger-soft); color: var(--color-danger); border-color: var(--color-danger); }

    .diet-body { padding: 0 20px 20px; border-top: 1px solid var(--color-border); background: var(--color-surface); }

    .meals-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 0 12px;
    }
    .meals-title { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-muted); }

    .meal-card {
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-left: 3px solid var(--color-primary);
      border-radius: var(--radius-sm);
      margin-bottom: 12px;
      overflow: hidden;
      transition: box-shadow 0.15s;
    }
    .meal-card:hover { box-shadow: 0 2px 8px rgba(16,24,40,0.06); }

    .meal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      gap: 12px;
    }
    .meal-name { display: flex; align-items: center; gap: 8px; font-size: 0.92rem; font-weight: 700; color: var(--color-text); flex-wrap: wrap; }
    .meal-icon { width: 18px; height: 18px; color: var(--color-primary); flex-shrink: 0; }
    .meal-time-badge { font-size: 0.72rem; font-weight: 600; color: var(--color-primary); background: var(--color-primary-soft, rgba(110,139,255,0.12)); border: 1px solid color-mix(in srgb, var(--color-primary) 30%, transparent); padding: 2px 8px; border-radius: 10px; }
    .meal-macros { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    .meal-macros span {
      font-size: 0.72rem; font-weight: 700;
      padding: 2px 8px; border-radius: 10px;
      white-space: nowrap;
    }
    .macro-cal { color: var(--color-warning, #f59e0b); background: color-mix(in srgb, var(--color-warning, #f59e0b) 14%, transparent); }
    .macro-prot { color: #2563eb; background: rgba(96,165,250,0.16); }
    .macro-carb { color: #0d9488; background: rgba(52,211,153,0.16); }
    .macro-fat { color: #dc2626; background: rgba(248,113,113,0.16); }

    .meal-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

    .foods-list { border-top: 1px solid var(--color-border); }

    .food-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      border-bottom: 1px solid var(--color-border);
      transition: background 0.12s;
      gap: 12px;
    }
    .food-item:hover { background: var(--color-surface-hover); }
    .food-item:last-child { border-bottom: none; }
    .food-info { flex: 1; min-width: 0; }
    .food-name { color: var(--color-text); font-weight: 600; font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .food-detail { display: flex; align-items: center; gap: 8px; margin-top: 4px; flex-wrap: wrap; }
    .food-qty { color: var(--color-text-muted); font-size: 0.75rem; }
    .food-qty::after { content: '·'; margin-left: 8px; color: var(--color-border); }
    .food-macro { font-size: 0.72rem; font-weight: 600; padding: 1px 6px; border-radius: 8px; }
    .food-macro-p { color: #2563eb; background: rgba(96,165,250,0.14); }
    .food-macro-c { color: #0d9488; background: rgba(52,211,153,0.14); }
    .food-macro-g { color: #dc2626; background: rgba(248,113,113,0.14); }
    .food-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .food-cals {
      font-size: 0.8rem; font-weight: 700;
      color: var(--color-warning, #f59e0b);
      background: color-mix(in srgb, var(--color-warning, #f59e0b) 12%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-warning, #f59e0b) 30%, transparent);
      border-radius: 20px; padding: 3px 10px; white-space: nowrap;
    }
    .btn-food-action {
      display: flex; align-items: center; justify-content: center;
      width: 28px; height: 28px;
      background: transparent; border: 1px solid transparent;
      border-radius: var(--radius-sm); cursor: pointer;
      color: var(--color-text-muted);
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .btn-food-action:hover { background: var(--color-surface-hover); border-color: var(--color-border); }
    .btn-food-action.edit:hover { color: var(--color-primary); border-color: var(--color-primary); }
    .btn-food-action.del:hover { color: var(--color-danger); border-color: var(--color-danger); }
    .btn-food-action svg { width: 14px; height: 14px; }

    .totals-bar {
      margin-top: 14px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 12px 16px;
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }
    .totals-bar .total-item { font-size: 0.82rem; }
    .totals-bar .total-label { color: var(--color-text-muted); margin-right: 4px; }
    .totals-bar .total-val { font-weight: 700; }
    .total-val.cal { color: var(--color-warning, #f59e0b); }
    .total-val.prot { color: #2563eb; }
    .total-val.carb { color: #0d9488; }
    .total-val.fat { color: #dc2626; }

    .drawer-title { margin: 0 0 24px 0; color: var(--color-text); font-size: 1.25rem; }

    /* Confirm dialog */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(16,24,40,0.55);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
    }
    .modal {
      width: 480px; max-width: 95vw; max-height: 85vh; overflow-y: auto;
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      padding: 28px;
    }
    .modal h3 { color: var(--color-text); margin: 0 0 20px; font-size: 1.15rem; }
    .field { margin-bottom: 16px; }
    label { display: block; color: var(--color-text-muted); font-size: 0.82rem; font-weight: 600; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
    input[type=text], input[type=number], input[type=time], textarea, select {
      width: 100%; padding: 10px 14px;
      background: var(--color-card-bg); border: 1px solid var(--color-border);
      border-radius: var(--radius-sm); color: var(--color-text);
      font-size: 0.9rem; font-family: var(--font-family); box-sizing: border-box;
      transition: border-color 0.15s;
      -webkit-appearance: none; appearance: none;
    }
    input[type=text]:focus, input[type=number]:focus, input[type=time]:focus, textarea:focus, select:focus {
      outline: none; border-color: var(--color-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
    }
    input[type=time]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
    textarea { resize: vertical; min-height: 80px; }
    .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--color-border); }
    .error-msg {
      background: var(--color-danger-soft); border: 1px solid var(--color-danger);
      color: var(--color-danger); padding: 10px 14px; border-radius: var(--radius-sm);
      font-size: 0.85rem; margin-bottom: 12px;
    }

    /* Measure toggle */
    .measure-toggle { display: flex; gap: 0; border: 1px solid var(--color-border); border-radius: var(--radius-sm); overflow: hidden; }
    .measure-btn {
      flex: 1; padding: 9px 16px; cursor: pointer; font-size: 0.85rem; font-weight: 600;
      background: var(--color-card-bg); color: var(--color-text-muted);
      border: none; transition: background 0.15s, color 0.15s;
    }
    .measure-btn:not(:last-child) { border-right: 1px solid var(--color-border); }
    .measure-btn.active { background: var(--color-primary); color: #fff; }
    .serving-preview {
      font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 12px;
      padding: 10px 14px; background: var(--color-surface);
      border: 1px solid var(--color-border); border-radius: var(--radius-sm);
    }
    .serving-preview strong { color: var(--color-text); }

    /* Food search */
    .search-row { display: flex; gap: 8px; margin-bottom: 10px; }
    .search-row input { flex: 1; }
    .search-results { max-height: 220px; overflow-y: auto; border: 1px solid var(--color-border); border-radius: var(--radius-sm); margin-bottom: 16px; }
    .search-result-item {
      padding: 10px 14px; cursor: pointer;
      border-bottom: 1px solid var(--color-border);
      transition: background 0.12s;
    }
    .search-result-item:last-child { border-bottom: none; }
    .search-result-item:hover { background: var(--color-surface-hover); }
    .search-result-item.selected { background: var(--color-primary-soft, rgba(110,139,255,0.12)); border-left: 3px solid var(--color-primary); }
    .search-result-name { font-size: 0.88rem; font-weight: 600; color: var(--color-text); }
    .search-result-macros { font-size: 0.75rem; color: var(--color-text-muted); margin-top: 2px; }
    .searching-msg { padding: 20px; text-align: center; color: var(--color-text-muted); font-size: 0.85rem; }
    .no-results { padding: 20px; text-align: center; color: var(--color-text-muted); font-size: 0.85rem; }
    .macros-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .divider { border: none; border-top: 1px solid var(--color-border); margin: 16px 0; }
  `],
  template: `
    <ui-page-header title="Dietas">
      <ui-button (click)="openCreateDiet()">+ Nova Dieta</ui-button>
    </ui-page-header>

    @if (loading()) {
      <p class="loading">Carregando...</p>
    } @else if (diets().length === 0) {
      <div class="empty-state">
        <p>Nenhuma dieta cadastrada.</p>
      </div>
    } @else {
      <div class="diet-list">
        @for (diet of diets(); track diet.id) {
          <div class="diet-card">
            <div class="diet-header" (click)="toggleDiet(diet.id)">
              <div class="diet-header-left">
                <span class="diet-icon"><ui-icon name="diet" /></span>
                <div>
                  <div class="diet-name">{{ diet.name }}</div>
                  @if (diet.description) {
                    <div class="diet-description">{{ diet.description }}</div>
                  }
                </div>
              </div>
              <div class="diet-header-right">
                @if (diet.createdByName) {
                  <div class="creator-badge" title="Criado por {{ diet.createdByName }}">
                    👤 {{ diet.createdByName }}
                  </div>
                }
                <div class="diet-stats">
                  <span>{{ getDietTotals(diet).calories | number:'1.0-0' }}</span> kcal/dia
                </div>
                <button class="btn-icon" (click)="$event.stopPropagation(); confirmDeleteDiet(diet)" title="Excluir dieta">✕</button>
                <svg class="chevron" [class.open]="expandedDiet() === diet.id" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>

            @if (expandedDiet() === diet.id) {
              <div class="diet-body">
                <div class="meals-header">
                  <span class="meals-title">Refeições ({{ diet.meals.length }})</span>
                  <ui-button (click)="openAddMeal(diet)">+ Refeição</ui-button>
                </div>

                @if (!diet.meals || diet.meals.length === 0) {
                  <p style="color: var(--color-text-muted); font-size: 0.85rem;">Nenhuma refeição cadastrada.</p>
                }

                @for (meal of diet.meals; track meal.id) {
                  <div class="meal-card">
                    <div class="meal-header">
                      <div>
                        <div class="meal-name">
                          {{ meal.name }}
                          @if (meal.mealTime) {
                            <span class="meal-time-badge">⏰ {{ meal.mealTime }}</span>
                          }
                        </div>
                        <div class="meal-macros">
                          <span class="macro-cal">{{ getMealTotals(meal).calories | number:'1.0-0' }} kcal</span>
                          <span class="macro-prot">P: {{ getMealTotals(meal).protein | number:'1.0-1' }}g</span>
                          <span class="macro-carb">C: {{ getMealTotals(meal).carbs | number:'1.0-1' }}g</span>
                          <span class="macro-fat">G: {{ getMealTotals(meal).fat | number:'1.0-1' }}g</span>
                        </div>
                      </div>
                      <div class="meal-actions">
                        <ui-button (click)="openAddFood(diet, meal)">+ Alimento</ui-button>
                        <button class="btn-icon" (click)="openEditMeal(diet, meal)" title="Editar refeição" style="color: var(--color-primary);">✎</button>
                        <button class="btn-icon" (click)="deleteMeal(diet, meal)" title="Excluir refeição">✕</button>
                      </div>
                    </div>

                    @if (meal.foods && meal.foods.length > 0) {
                      <div class="foods-list">
                        @for (food of meal.foods; track food.id) {
                          <div class="food-item">
                            <div class="food-info">
                              <div class="food-name">{{ food.foodName }}</div>
                              <div class="food-detail">
                                <span class="food-qty">{{ getFoodQtyDisplay(food) }}</span>
                                <span class="food-macro food-macro-p">P {{ food.protein | number:'1.0-1' }}g</span>
                                <span class="food-macro food-macro-c">C {{ food.carbs | number:'1.0-1' }}g</span>
                                <span class="food-macro food-macro-g">G {{ food.fat | number:'1.0-1' }}g</span>
                              </div>
                            </div>
                            <div class="food-right">
                              <span class="food-cals">{{ food.calories | number:'1.0-0' }} kcal</span>
                              <button class="btn-food-action edit" (click)="openEditFood(food, meal)" title="Editar">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                              </button>
                              <button class="btn-food-action del" (click)="deleteFood(meal, food)" title="Remover">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                  <polyline points="3 6 5 6 21 6"/>
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                  <path d="M10 11v6M14 11v6"/>
                                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>
                }

                @if (diet.meals && diet.meals.length > 0) {
                  <div class="totals-bar">
                    <div class="total-item">
                      <span class="total-label">Total:</span>
                      <span class="total-val cal">{{ getDietTotals(diet).calories | number:'1.0-0' }} kcal</span>
                    </div>
                    <div class="total-item">
                      <span class="total-label">Proteína:</span>
                      <span class="total-val prot">{{ getDietTotals(diet).protein | number:'1.0-1' }}g</span>
                    </div>
                    <div class="total-item">
                      <span class="total-label">Carboidrato:</span>
                      <span class="total-val carb">{{ getDietTotals(diet).carbs | number:'1.0-1' }}g</span>
                    </div>
                    <div class="total-item">
                      <span class="total-label">Gordura:</span>
                      <span class="total-val fat">{{ getDietTotals(diet).fat | number:'1.0-1' }}g</span>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    }

    <!-- Drawer: Nova Dieta -->
    @if (showDietModal()) {
      <ui-drawer size="md" (close)="closeDietModal()">
        <h2 class="drawer-title">Nova Dieta</h2>
        <form (ngSubmit)="saveDiet()">
          <div class="field">
            <label>Nome</label>
            <input type="text" [(ngModel)]="dietForm.name" name="name" required placeholder="Ex: Dieta de Ganho de Massa" />
          </div>
          <div class="field">
            <label>Descrição</label>
            <textarea [(ngModel)]="dietForm.description" name="description" placeholder="Descrição opcional..."></textarea>
          </div>
          @if (errorMsg()) {
            <div class="error-msg">{{ errorMsg() }}</div>
          }
          <div class="modal-actions">
            <ui-button type="button" variant="ghost" (click)="closeDietModal()">Cancelar</ui-button>
            <ui-button type="submit">Salvar</ui-button>
          </div>
        </form>
      </ui-drawer>
    }

    <!-- Drawer: Nova Refeição -->
    @if (showMealModal()) {
      <ui-drawer size="md" (close)="closeMealModal()">
        <h2 class="drawer-title">Nova Refeição</h2>
        <form (ngSubmit)="saveMeal()">
          <div class="field">
            <label>Nome da Refeição</label>
            <input type="text" [(ngModel)]="mealForm.name" name="name" required placeholder="Ex: Café da Manhã" />
          </div>
          <div class="form-grid-2">
            <div class="field">
              <label>Horário</label>
              <input type="time" [(ngModel)]="mealForm.mealTime" name="mealTime" required />
            </div>
            <div class="field">
              <label>Ordem</label>
              <input type="number" [(ngModel)]="mealForm.mealOrder" name="mealOrder" min="0" />
            </div>
          </div>
          @if (errorMsg()) {
            <div class="error-msg">{{ errorMsg() }}</div>
          }
          <div class="modal-actions">
            <ui-button type="button" variant="ghost" (click)="closeMealModal()">Cancelar</ui-button>
            <ui-button type="submit">Salvar</ui-button>
          </div>
        </form>
      </ui-drawer>
    }

    <!-- Drawer: Editar Refeição -->
    @if (showEditMealModal()) {
      <ui-drawer size="md" (close)="closeEditMealModal()">
        <h2 class="drawer-title">Editar Refeição</h2>
        <form (ngSubmit)="saveEditMeal()">
          <div class="field">
            <label>Nome da Refeição</label>
            <input type="text" [(ngModel)]="mealForm.name" name="name" required placeholder="Ex: Café da Manhã" />
          </div>
          <div class="form-grid-2">
            <div class="field">
              <label>Horário</label>
              <input type="time" [(ngModel)]="mealForm.mealTime" name="mealTime" required />
            </div>
            <div class="field">
              <label>Ordem</label>
              <input type="number" [(ngModel)]="mealForm.mealOrder" name="mealOrder" min="0" />
            </div>
          </div>
          @if (errorMsg()) {
            <div class="error-msg">{{ errorMsg() }}</div>
          }
          <div class="modal-actions">
            <ui-button type="button" variant="ghost" (click)="closeEditMealModal()">Cancelar</ui-button>
            <ui-button type="submit">Salvar</ui-button>
          </div>
        </form>
      </ui-drawer>
    }

    <!-- Drawer: Adicionar Alimento -->
    @if (showFoodModal()) {
      <ui-drawer size="md" (close)="closeFoodModal()">
        <h2 class="drawer-title">Adicionar Alimento</h2>

        <div class="field">
          <label>Buscar alimento <span style="font-weight:400; text-transform:none; letter-spacing:0; color: var(--color-text-faint); font-size:0.78rem;">(opcional — você também pode preencher manualmente abaixo)</span></label>
          <div class="search-row">
            <input type="text" [(ngModel)]="foodSearchQuery" name="foodSearch" placeholder="Ex: creatina, whey, arroz, frango..." (keydown.enter)="searchFood()" />
            <ui-button type="button" (click)="searchFood()">Buscar</ui-button>
          </div>
        </div>

        @if (searching()) {
          <div class="searching-msg">Buscando alimentos...</div>
        } @else if (searchResults().length > 0) {
          <div class="search-results">
            @for (result of searchResults(); track result.code) {
              <div class="search-result-item" [class.selected]="selectedFood()?.code === result.code" (click)="selectFood(result)">
                <div class="search-result-name">{{ result.name }}</div>
                <div class="search-result-macros">
                  {{ result.calories | number:'1.0-0' }} kcal · P: {{ result.protein | number:'1.0-1' }}g · C: {{ result.carbs | number:'1.0-1' }}g · G: {{ result.fat | number:'1.0-1' }}g
                </div>
              </div>
            }
          </div>
        } @else if (searchPerformed()) {
          <div class="no-results">Nenhum resultado encontrado.</div>
        }

        <form (ngSubmit)="saveFood()">
          <div class="field" style="margin-top: 16px;">
            <label>Nome do Alimento</label>
            <input type="text" [(ngModel)]="foodForm.foodName" name="foodName" required placeholder="Nome do alimento" />
          </div>
          <div class="field">
            <label>Tipo de medida</label>
            <div class="measure-toggle">
              <button type="button" class="measure-btn" [class.active]="foodForm.measureType==='grams'" (click)="foodForm.measureType='grams'; onMeasureTypeChange()">Gramas</button>
              <button type="button" class="measure-btn" [class.active]="foodForm.measureType==='unit'" (click)="foodForm.measureType='unit'; onMeasureTypeChange()">Unidades</button>
            </div>
          </div>
          @if (foodForm.measureType === 'grams') {
            <div class="field">
              <label>Quantidade (gramas)</label>
              <input type="number" [(ngModel)]="foodForm.quantityGrams" name="quantityGrams" min="0" required (input)="recalcMacros()" />
            </div>
          } @else {
            <div class="form-grid-2">
              <div class="field">
                <label>Quantidade</label>
                <input type="number" [(ngModel)]="foodForm.servingQuantity" name="servingQuantity" min="0.1" step="0.5" (input)="onServingChange()" />
              </div>
              <div class="field">
                <label>Nome da unidade</label>
                <input type="text" [(ngModel)]="foodForm.servingUnit" name="servingUnit" placeholder="unidade, fatia, colher..." />
              </div>
            </div>
            <div class="field">
              <label>Gramas por unidade</label>
              <input type="number" [(ngModel)]="foodForm.servingGrams" name="servingGrams" min="1" (input)="onServingChange()" />
            </div>
            <div class="serving-preview">
              Total: <strong>{{ foodForm.servingQuantity }} {{ foodForm.servingUnit }}</strong> = <strong>{{ foodForm.quantityGrams }}g</strong>
            </div>
          }
          <hr class="divider" />
          <div class="macros-grid">
            <div class="field">
              <label>Calorias (kcal)</label>
              <input type="number" [(ngModel)]="foodForm.calories" name="calories" min="0" step="0.01" />
            </div>
            <div class="field">
              <label>Proteína (g)</label>
              <input type="number" [(ngModel)]="foodForm.protein" name="protein" min="0" step="0.01" />
            </div>
            <div class="field">
              <label>Carboidrato (g)</label>
              <input type="number" [(ngModel)]="foodForm.carbs" name="carbs" min="0" step="0.01" />
            </div>
            <div class="field">
              <label>Gordura (g)</label>
              <input type="number" [(ngModel)]="foodForm.fat" name="fat" min="0" step="0.01" />
            </div>
          </div>
          @if (errorMsg()) {
            <div class="error-msg">{{ errorMsg() }}</div>
          }
          <div class="modal-actions">
            <ui-button type="button" variant="ghost" (click)="closeFoodModal()">Cancelar</ui-button>
            <ui-button type="submit">Adicionar</ui-button>
          </div>
        </form>
      </ui-drawer>
    }

    <!-- Drawer: Editar Alimento -->
    @if (showEditFoodModal()) {
      <ui-drawer size="md" (close)="closeEditFoodModal()">
        <h2 class="drawer-title">Editar Alimento</h2>
        <form (ngSubmit)="saveEditFood()">
          <div class="field">
            <label>Nome do Alimento</label>
            <input type="text" [(ngModel)]="foodForm.foodName" name="foodName" required placeholder="Nome do alimento" />
          </div>
          <div class="field">
            <label>Tipo de medida</label>
            <div class="measure-toggle">
              <button type="button" class="measure-btn" [class.active]="foodForm.measureType==='grams'" (click)="foodForm.measureType='grams'; onMeasureTypeChange()">Gramas</button>
              <button type="button" class="measure-btn" [class.active]="foodForm.measureType==='unit'" (click)="foodForm.measureType='unit'; onMeasureTypeChange()">Unidades</button>
            </div>
          </div>
          @if (foodForm.measureType === 'grams') {
            <div class="field">
              <label>Quantidade (gramas)</label>
              <input type="number" [(ngModel)]="foodForm.quantityGrams" name="quantityGrams" min="0" required />
            </div>
          } @else {
            <div class="form-grid-2">
              <div class="field">
                <label>Quantidade</label>
                <input type="number" [(ngModel)]="foodForm.servingQuantity" name="servingQuantity" min="0.1" step="0.5" (input)="onServingChange()" />
              </div>
              <div class="field">
                <label>Nome da unidade</label>
                <input type="text" [(ngModel)]="foodForm.servingUnit" name="servingUnit" placeholder="unidade, fatia, colher..." />
              </div>
            </div>
            <div class="field">
              <label>Gramas por unidade</label>
              <input type="number" [(ngModel)]="foodForm.servingGrams" name="servingGrams" min="1" (input)="onServingChange()" />
            </div>
            <div class="serving-preview">
              Total: <strong>{{ foodForm.servingQuantity }} {{ foodForm.servingUnit }}</strong> = <strong>{{ foodForm.quantityGrams }}g</strong>
            </div>
          }
          <hr class="divider" />
          <div class="macros-grid">
            <div class="field">
              <label>Calorias (kcal)</label>
              <input type="number" [(ngModel)]="foodForm.calories" name="calories" min="0" step="0.01" />
            </div>
            <div class="field">
              <label>Proteína (g)</label>
              <input type="number" [(ngModel)]="foodForm.protein" name="protein" min="0" step="0.01" />
            </div>
            <div class="field">
              <label>Carboidrato (g)</label>
              <input type="number" [(ngModel)]="foodForm.carbs" name="carbs" min="0" step="0.01" />
            </div>
            <div class="field">
              <label>Gordura (g)</label>
              <input type="number" [(ngModel)]="foodForm.fat" name="fat" min="0" step="0.01" />
            </div>
          </div>
          @if (errorMsg()) {
            <div class="error-msg">{{ errorMsg() }}</div>
          }
          <div class="modal-actions">
            <ui-button type="button" variant="ghost" (click)="closeEditFoodModal()">Cancelar</ui-button>
            <ui-button type="submit">Salvar</ui-button>
          </div>
        </form>
      </ui-drawer>
    }

    <!-- Confirm delete diet -->
    @if (deleteDietTarget()) {
      <div class="modal-overlay" (click)="cancelDeleteDiet()">
        <div class="modal" style="max-width: 400px;" (click)="$event.stopPropagation()">
          <h3>Excluir Dieta</h3>
          <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 20px;">
            Tem certeza que deseja excluir a dieta <strong style="color: var(--color-text);">{{ deleteDietTarget()!.name }}</strong>? Todas as refeições e alimentos serão removidos.
          </p>
          <div class="modal-actions">
            <ui-button type="button" variant="ghost" (click)="cancelDeleteDiet()">Cancelar</ui-button>
            <ui-button type="button" variant="danger" (click)="doDeleteDiet()">Excluir</ui-button>
          </div>
        </div>
      </div>
    }
  `
})
export class DietsComponent implements OnInit {
  private readonly dietService = inject(DietService);

  diets = signal<Diet[]>([]);
  loading = signal(true);
  errorMsg = signal('');
  expandedDiet = signal<string | null>(null);

  showDietModal = signal(false);
  showMealModal = signal(false);
  showEditMealModal = signal(false);
  editingMeal = signal<Meal | null>(null);
  showFoodModal = signal(false);
  showEditFoodModal = signal(false);
  editingFood = signal<MealFood | null>(null);

  dietForm = { name: '', description: '' };
  mealForm = { name: '', mealOrder: 0, mealTime: '' };
  foodForm = { foodName: '', quantityGrams: 100, calories: 0, protein: 0, carbs: 0, fat: 0, measureType: 'grams' as 'grams' | 'unit', servingUnit: 'unidade', servingGrams: 50, servingQuantity: 1, baseCal: 0, baseProt: 0, baseCarb: 0, baseFat: 0 };

  foodSearchQuery = '';
  searchResults = signal<FoodSearchResult[]>([]);
  selectedFood = signal<FoodSearchResult | null>(null);
  searching = signal(false);
  searchPerformed = signal(false);

  activeDiet = signal<Diet | null>(null);
  activeMeal = signal<Meal | null>(null);
  deleteDietTarget = signal<Diet | null>(null);

  ngOnInit() {
    this.loadDiets();
  }

  loadDiets() {
    this.loading.set(true);
    this.dietService.getAll().subscribe({
      next: (diets) => {
        // Load full details for each diet to get meals/foods
        const loadPromises = diets.map(d =>
          new Promise<Diet>(resolve => {
            this.dietService.getById(d.id).subscribe({
              next: full => resolve(full),
              error: () => resolve({ ...d, meals: [] })
            });
          })
        );
        Promise.all(loadPromises).then(fullDiets => {
          this.diets.set(fullDiets);
          this.loading.set(false);
        });
      },
      error: () => this.loading.set(false)
    });
  }

  toggleDiet(id: string) {
    this.expandedDiet.set(this.expandedDiet() === id ? null : id);
  }

  // --- Diet modal ---
  openCreateDiet() {
    this.dietForm = { name: '', description: '' };
    this.errorMsg.set('');
    this.showDietModal.set(true);
  }

  closeDietModal() {
    this.showDietModal.set(false);
  }

  saveDiet() {
    if (!this.dietForm.name.trim()) { this.errorMsg.set('Nome é obrigatório'); return; }
    this.dietService.create({ name: this.dietForm.name, description: this.dietForm.description || undefined }).subscribe({
      next: () => { this.closeDietModal(); this.loadDiets(); },
      error: () => this.errorMsg.set('Erro ao criar dieta')
    });
  }

  confirmDeleteDiet(diet: Diet) {
    this.deleteDietTarget.set(diet);
  }

  cancelDeleteDiet() {
    this.deleteDietTarget.set(null);
  }

  doDeleteDiet() {
    const target = this.deleteDietTarget();
    if (!target) return;
    this.dietService.delete(target.id).subscribe({
      next: () => {
        this.deleteDietTarget.set(null);
        if (this.expandedDiet() === target.id) this.expandedDiet.set(null);
        this.loadDiets();
      }
    });
  }

  // --- Meal modal ---
  openAddMeal(diet: Diet) {
    this.activeDiet.set(diet);
    this.mealForm = { name: '', mealOrder: (diet.meals?.length ?? 0), mealTime: '' };
    this.errorMsg.set('');
    this.showMealModal.set(true);
  }

  closeMealModal() {
    this.showMealModal.set(false);
  }

  saveMeal() {
    const diet = this.activeDiet();
    if (!diet) return;
    if (!this.mealForm.name.trim()) { this.errorMsg.set('Nome é obrigatório'); return; }
    if (!this.mealForm.mealTime) { this.errorMsg.set('Horário é obrigatório'); return; }
    this.dietService.addMeal(diet.id, { name: this.mealForm.name, mealOrder: this.mealForm.mealOrder, mealTime: this.mealForm.mealTime }).subscribe({
      next: () => { this.closeMealModal(); this.loadDiets(); },
      error: () => this.errorMsg.set('Erro ao adicionar refeição')
    });
  }

  deleteMeal(diet: Diet, meal: Meal) {
    this.dietService.deleteMeal(meal.id).subscribe({
      next: () => this.loadDiets()
    });
  }

  openEditMeal(diet: Diet, meal: Meal) {
    this.activeDiet.set(diet);
    this.editingMeal.set(meal);
    this.mealForm = { name: meal.name, mealOrder: meal.mealOrder, mealTime: meal.mealTime ?? '' };
    this.errorMsg.set('');
    this.showEditMealModal.set(true);
  }

  closeEditMealModal() {
    this.showEditMealModal.set(false);
    this.editingMeal.set(null);
  }

  saveEditMeal() {
    const meal = this.editingMeal();
    if (!meal) return;
    if (!this.mealForm.name.trim()) { this.errorMsg.set('Nome é obrigatório'); return; }
    if (!this.mealForm.mealTime) { this.errorMsg.set('Horário é obrigatório'); return; }
    this.dietService.updateMeal(meal.id, { name: this.mealForm.name, mealOrder: this.mealForm.mealOrder, mealTime: this.mealForm.mealTime }).subscribe({
      next: () => { this.closeEditMealModal(); this.loadDiets(); },
      error: () => this.errorMsg.set('Erro ao editar refeição')
    });
  }

  // --- Food modal ---
  openAddFood(diet: Diet, meal: Meal) {
    this.activeDiet.set(diet);
    this.activeMeal.set(meal);
    this.foodForm = { foodName: '', quantityGrams: 100, calories: 0, protein: 0, carbs: 0, fat: 0, measureType: 'grams', servingUnit: 'unidade', servingGrams: 50, servingQuantity: 1, baseCal: 0, baseProt: 0, baseCarb: 0, baseFat: 0 };
    this.foodSearchQuery = '';
    this.searchResults.set([]);
    this.selectedFood.set(null);
    this.searching.set(false);
    this.searchPerformed.set(false);
    this.errorMsg.set('');
    this.showFoodModal.set(true);
  }

  closeFoodModal() {
    this.showFoodModal.set(false);
  }

  searchFood() {
    if (!this.foodSearchQuery.trim()) return;
    this.searching.set(true);
    this.searchPerformed.set(false);
    this.searchResults.set([]);
    this.dietService.searchFood(this.foodSearchQuery).subscribe({
      next: (results) => {
        this.searchResults.set(results);
        this.searching.set(false);
        this.searchPerformed.set(true);
      },
      error: () => {
        this.searching.set(false);
        this.searchPerformed.set(true);
      }
    });
  }

  selectFood(food: FoodSearchResult) {
    this.selectedFood.set(food);
    this.foodForm.foodName = food.name;
    this.recalcMacros();
  }

  recalcMacros() {
    const searchFood = this.selectedFood();
    const base = searchFood
      ? { cal: searchFood.calories, prot: searchFood.protein, carb: searchFood.carbs, fat: searchFood.fat }
      : { cal: this.foodForm.baseCal, prot: this.foodForm.baseProt, carb: this.foodForm.baseCarb, fat: this.foodForm.baseFat };
    if (!base.cal && !base.prot && !base.carb && !base.fat) return;
    const grams = this.foodForm.measureType === 'unit'
      ? (Number(this.foodForm.servingQuantity) || 0) * (Number(this.foodForm.servingGrams) || 0)
      : Number(this.foodForm.quantityGrams) || 0;
    if (grams <= 0) return;
    this.foodForm.calories = parseFloat((base.cal * grams / 100).toFixed(2));
    this.foodForm.protein = parseFloat((base.prot * grams / 100).toFixed(2));
    this.foodForm.carbs = parseFloat((base.carb * grams / 100).toFixed(2));
    this.foodForm.fat = parseFloat((base.fat * grams / 100).toFixed(2));
    if (this.foodForm.measureType === 'unit') {
      this.foodForm.quantityGrams = grams;
    }
  }

  onMeasureTypeChange() {
    if (this.foodForm.measureType === 'unit') {
      this.foodForm.quantityGrams = this.foodForm.servingQuantity * this.foodForm.servingGrams;
    }
    this.recalcMacros();
  }

  onServingChange() {
    this.foodForm.quantityGrams = this.foodForm.servingQuantity * this.foodForm.servingGrams;
    this.recalcMacros();
  }

  getFoodQtyDisplay(food: { quantityGrams: number; servingUnit?: string; servingGrams?: number }): string {
    if (food.servingUnit && food.servingGrams && food.servingGrams > 0) {
      const qty = Math.round((food.quantityGrams / food.servingGrams) * 10) / 10;
      return `${qty} ${food.servingUnit} (${food.quantityGrams}g)`;
    }
    return `${food.quantityGrams}g`;
  }

  saveFood() {
    const meal = this.activeMeal();
    if (!meal) return;
    if (!this.foodForm.foodName.trim()) { this.errorMsg.set('Nome do alimento é obrigatório'); return; }
    const isUnit = this.foodForm.measureType === 'unit';
    this.dietService.addFood(meal.id, {
      foodName: this.foodForm.foodName,
      quantityGrams: this.foodForm.quantityGrams,
      calories: this.foodForm.calories,
      protein: this.foodForm.protein,
      carbs: this.foodForm.carbs,
      fat: this.foodForm.fat,
      openFoodFactsId: this.selectedFood()?.code,
      servingUnit: isUnit ? this.foodForm.servingUnit : undefined,
      servingGrams: isUnit ? this.foodForm.servingGrams : undefined
    }).subscribe({
      next: () => { this.closeFoodModal(); this.loadDiets(); },
      error: () => this.errorMsg.set('Erro ao adicionar alimento')
    });
  }

  openEditFood(food: MealFood, meal: Meal) {
    this.editingFood.set(food);
    this.activeMeal.set(meal);
    const hasUnit = !!food.servingUnit && !!food.servingGrams;
    const servingGrams = food.servingGrams ?? 50;
    const servingQty = hasUnit ? Math.round((food.quantityGrams / servingGrams) * 10) / 10 : 1;
    const qty = food.quantityGrams || 100;
    this.foodForm = {
      foodName: food.foodName,
      quantityGrams: food.quantityGrams,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      measureType: hasUnit ? 'unit' : 'grams',
      servingUnit: food.servingUnit ?? 'unidade',
      servingGrams,
      servingQuantity: servingQty,
      baseCal: parseFloat(((food.calories / qty) * 100).toFixed(4)),
      baseProt: parseFloat(((food.protein / qty) * 100).toFixed(4)),
      baseCarb: parseFloat(((food.carbs / qty) * 100).toFixed(4)),
      baseFat: parseFloat(((food.fat / qty) * 100).toFixed(4)),
    };
    this.errorMsg.set('');
    this.showEditFoodModal.set(true);
  }

  closeEditFoodModal() {
    this.showEditFoodModal.set(false);
    this.editingFood.set(null);
  }

  saveEditFood() {
    const food = this.editingFood();
    const meal = this.activeMeal();
    if (!food || !meal) return;
    if (!this.foodForm.foodName.trim()) { this.errorMsg.set('Nome do alimento é obrigatório'); return; }
    const isUnit = this.foodForm.measureType === 'unit';
    this.dietService.updateFood(food.id, {
      mealId: meal.id,
      foodName: this.foodForm.foodName,
      quantityGrams: this.foodForm.quantityGrams,
      calories: this.foodForm.calories,
      protein: this.foodForm.protein,
      carbs: this.foodForm.carbs,
      fat: this.foodForm.fat,
      servingUnit: isUnit ? this.foodForm.servingUnit : undefined,
      servingGrams: isUnit ? this.foodForm.servingGrams : undefined
    }).subscribe({
      next: () => { this.closeEditFoodModal(); this.loadDiets(); },
      error: () => this.errorMsg.set('Erro ao editar alimento')
    });
  }

  deleteFood(meal: Meal, food: MealFood) {
    this.dietService.deleteFood(food.id).subscribe({
      next: () => this.loadDiets()
    });
  }

  // --- Totals ---
  getMealTotals(meal: Meal) {
    const foods = meal.foods ?? [];
    return {
      calories: foods.reduce((s, f) => s + (f.calories || 0), 0),
      protein: foods.reduce((s, f) => s + (f.protein || 0), 0),
      carbs: foods.reduce((s, f) => s + (f.carbs || 0), 0),
      fat: foods.reduce((s, f) => s + (f.fat || 0), 0),
    };
  }

  getDietTotals(diet: Diet) {
    const meals = diet.meals ?? [];
    return {
      calories: meals.reduce((s, m) => s + this.getMealTotals(m).calories, 0),
      protein: meals.reduce((s, m) => s + this.getMealTotals(m).protein, 0),
      carbs: meals.reduce((s, m) => s + this.getMealTotals(m).carbs, 0),
      fat: meals.reduce((s, m) => s + this.getMealTotals(m).fat, 0),
    };
  }
}
