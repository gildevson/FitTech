import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonSkeletonText,
  IonRefresher,
  IonRefresherContent,
  IonModal,
  IonInput,
  IonTextarea,
  IonNote,
  AlertController,
  ToastController,
  RefresherEventDetail
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, trash, chevronDown, chevronUp, search, nutrition, informationCircle } from 'ionicons/icons';
import { DietService } from '../../core/services/diet.service';
import { Diet, Meal, MealFood, FoodSearchResult } from '../../core/models';

@Component({
  selector: 'app-dieta',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonSkeletonText,
    IonRefresher,
    IonRefresherContent,
    IonModal,
    IonInput,
    IonTextarea,
    IonNote
  ],
  styles: [`
    .title-accent { color: var(--ft-accent); }

    .section-header {
      padding: 20px 16px 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .section-header h2 {
      margin: 0;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--ft-text-faint);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .add-btn {
      --background: var(--ft-accent);
      --background-hover: var(--ft-accent);
      --border-radius: 20px;
      --padding-start: 14px;
      --padding-end: 14px;
      --padding-top: 6px;
      --padding-bottom: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      height: 32px;
    }

    ion-card {
      --background: var(--ft-surface);
      border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius-lg);
      margin: 8px 16px;
      box-shadow: var(--ft-shadow);
      overflow: hidden;
      position: relative;
    }
    ion-card::before {
      content: '';
      position: absolute;
      inset: 0 auto 0 0;
      width: 3px;
      background: var(--ft-gradient);
    }

    ion-card-header {
      padding: 16px 16px 8px;
      cursor: pointer;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }
    ion-card-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--ft-text);
    }
    ion-card-subtitle {
      font-size: 0.8rem;
      color: var(--ft-text-muted);
      text-transform: none;
      letter-spacing: 0;
      margin-top: 2px;
    }

    .diet-header-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      margin-left: 8px;
    }

    .kcal-badge {
      background: var(--ft-accent-soft);
      color: var(--ft-accent);
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 20px;
      white-space: nowrap;
    }

    ion-card-content { padding: 0 16px 16px; }

    .meals-label {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--ft-text-faint);
      margin: 12px 0 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .meal-block {
      background: var(--ft-bg-elevated);
      border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius);
      margin-bottom: 8px;
      overflow: hidden;
    }

    .meal-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
    }
    .meal-name { font-size: 0.9rem; font-weight: 600; color: var(--ft-text); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .meal-time-badge { font-size: 0.72rem; font-weight: 500; color: var(--ft-accent); background: var(--ft-accent-soft); padding: 1px 7px; border-radius: 10px; }
    .meal-macros { font-size: 0.72rem; color: var(--ft-text-muted); margin-top: 3px; display: flex; gap: 6px; flex-wrap: wrap; }
    .m-cal { color: #f59e0b; font-weight: 600; }
    .m-prot { color: #60a5fa; font-weight: 600; }
    .m-carb { color: #34d399; font-weight: 600; }
    .m-fat { color: #f87171; font-weight: 600; }

    .meal-actions { display: flex; gap: 6px; flex-shrink: 0; }
    .action-btn {
      --padding-start: 8px;
      --padding-end: 8px;
      --padding-top: 4px;
      --padding-bottom: 4px;
      height: 28px;
      font-size: 0.75rem;
      --border-radius: 6px;
    }

    .food-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 7px 12px;
      border-top: 1px solid var(--ft-border);
    }
    .food-name { font-size: 0.82rem; font-weight: 500; color: var(--ft-text); }
    .food-meta { font-size: 0.7rem; color: var(--ft-text-faint); margin-top: 1px; }
    .food-cal { font-size: 0.78rem; font-weight: 700; color: #f59e0b; }

    .totals-strip {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 10px;
      padding: 10px 12px;
      background: var(--ft-bg-elevated);
      border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius);
    }
    .t-item { font-size: 0.78rem; }
    .t-label { color: var(--ft-text-muted); margin-right: 3px; }
    .t-val { font-weight: 700; }
    .t-cal { color: #f59e0b; }
    .t-prot { color: #60a5fa; }
    .t-carb { color: #34d399; }
    .t-fat { color: #f87171; }

    .empty-diet { color: var(--ft-text-faint); font-size: 0.85rem; padding: 8px 0 4px; }

    .skeleton-card {
      background: var(--ft-surface);
      border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius-lg);
      margin: 8px 16px;
      padding: 18px;
    }

    /* Modal styles */
    .modal-content { padding: 20px; }
    .modal-title { font-size: 1.1rem; font-weight: 700; color: var(--ft-text); margin: 0 0 16px; }
    .field { margin-bottom: 14px; }
    .field label { display: block; font-size: 0.8rem; font-weight: 600; color: var(--ft-text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
    .field ion-input, .field ion-textarea {
      --background: var(--ft-bg-elevated);
      --border-radius: var(--ft-radius);
      --padding-start: 12px;
      --padding-end: 12px;
      --padding-top: 10px;
      --padding-bottom: 10px;
      --color: var(--ft-text);
      border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius);
    }
    .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; }
    .modal-actions ion-button { --border-radius: 8px; }

    .search-row { display: flex; gap: 8px; align-items: center; margin-bottom: 10px; }
    .search-row ion-input { flex: 1; }

    .search-results {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid var(--ft-border);
      border-radius: var(--ft-radius);
      margin-bottom: 12px;
    }
    .s-result {
      padding: 9px 12px;
      border-bottom: 1px solid var(--ft-border);
      cursor: pointer;
    }
    .s-result:last-child { border-bottom: none; }
    .s-result.selected { background: rgba(var(--ft-accent-rgb, 99,102,241), 0.15); border-left: 3px solid var(--ft-accent); }
    .s-name { font-size: 0.85rem; font-weight: 600; color: var(--ft-text); }
    .s-macros { font-size: 0.72rem; color: var(--ft-text-muted); margin-top: 2px; }
    .s-msg { padding: 16px; text-align: center; color: var(--ft-text-faint); font-size: 0.82rem; }

    .macros-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

    ion-modal { --height: auto; --max-height: 90vh; --border-radius: 16px 16px 0 0; }
  `],
  template: `
    <ion-header [translucent]="false">
      <ion-toolbar>
        <ion-title>Fit<span class="title-accent">Mob</span> · Dieta</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (loading()) {
        @for (i of [1,2]; track i) {
          <div class="skeleton-card">
            <ion-skeleton-text [animated]="true" style="width: 55%; height: 16px; margin-bottom: 8px;"></ion-skeleton-text>
            <ion-skeleton-text [animated]="true" style="width: 75%; height: 12px; margin-bottom: 14px;"></ion-skeleton-text>
            <ion-skeleton-text [animated]="true" style="width: 100%; height: 40px;"></ion-skeleton-text>
          </div>
        }
      } @else {
        <div class="section-header">
          <h2>Minhas Dietas ({{ diets().length }})</h2>
          <ion-button class="add-btn" size="small" (click)="openCreateDiet()">
            <ion-icon name="add" slot="start"></ion-icon>
            Minha Dieta
          </ion-button>
        </div>

        @if (diets().length === 0) {
          <ion-card>
            <ion-card-content>
              <div style="text-align:center; padding: 20px 0; color: var(--ft-text-faint); font-size: 0.88rem;">
                <ion-icon name="nutrition" style="font-size: 2rem; display:block; margin: 0 auto 10px; color: var(--ft-accent);"></ion-icon>
                Nenhuma dieta atribuída ou criada ainda.
              </div>
            </ion-card-content>
          </ion-card>
        }

        @for (diet of diets(); track diet.id) {
          <ion-card>
            <ion-card-header (click)="toggleDiet(diet.id)">
              <div style="flex:1;">
                <ion-card-title>{{ diet.name }}</ion-card-title>
                @if (diet.description) {
                  <ion-card-subtitle>{{ diet.description }}</ion-card-subtitle>
                }
              </div>
              <div class="diet-header-right">
                <span class="kcal-badge">{{ getDietTotals(diet).calories | number:'1.0-0' }} kcal</span>
                <ion-icon [name]="expandedDiet() === diet.id ? 'chevron-up' : 'chevron-down'" style="color: var(--ft-text-faint); font-size: 1rem;"></ion-icon>
              </div>
            </ion-card-header>

            @if (expandedDiet() === diet.id) {
              <ion-card-content>
                <div class="meals-label">
                  <span>Refeições ({{ diet.meals.length }})</span>
                  <ion-button fill="outline" size="small" class="action-btn" (click)="openAddMeal(diet)">
                    <ion-icon name="add" slot="start"></ion-icon>
                    Refeição
                  </ion-button>
                </div>

                @if (!diet.meals || diet.meals.length === 0) {
                  <p class="empty-diet">Nenhuma refeição cadastrada.</p>
                }

                @for (meal of diet.meals; track meal.id) {
                  <div class="meal-block">
                    <div class="meal-row">
                      <div>
                        <div class="meal-name">
                          {{ meal.name }}
                          @if (meal.mealTime) {
                            <span class="meal-time-badge">🕐 {{ meal.mealTime }}</span>
                          }
                        </div>
                        <div class="meal-macros">
                          <span class="m-cal">{{ getMealTotals(meal).calories | number:'1.0-0' }} kcal</span>
                          <span class="m-prot">P: {{ getMealTotals(meal).protein | number:'1.0-1' }}g</span>
                          <span class="m-carb">C: {{ getMealTotals(meal).carbs | number:'1.0-1' }}g</span>
                          <span class="m-fat">G: {{ getMealTotals(meal).fat | number:'1.0-1' }}g</span>
                        </div>
                      </div>
                      <div class="meal-actions">
                        <ion-button fill="outline" size="small" class="action-btn" (click)="openAddFood(diet, meal)">
                          <ion-icon name="add" slot="start"></ion-icon>
                          Alimento
                        </ion-button>
                      </div>
                    </div>

                    @for (food of meal.foods; track food.id) {
                      <div class="food-item">
                        <div style="flex:1;">
                          <div class="food-name">{{ food.foodName }}</div>
                          <div class="food-meta">{{ getFoodQtyDisplay(food) }} · P: {{ food.protein | number:'1.0-1' }}g C: {{ food.carbs | number:'1.0-1' }}g G: {{ food.fat | number:'1.0-1' }}g</div>
                        </div>
                        <div style="display:flex; align-items:center; gap:6px;">
                          <span class="food-cal">{{ food.calories | number:'1.0-0' }} kcal</span>
                          <ion-button fill="clear" size="small" style="--padding-start:4px;--padding-end:4px;" (click)="openEditFood(food, meal)">✎</ion-button>
                        </div>
                      </div>
                    }
                  </div>
                }

                @if (diet.meals && diet.meals.length > 0) {
                  <div class="totals-strip">
                    <div class="t-item"><span class="t-label">Total:</span><span class="t-val t-cal">{{ getDietTotals(diet).calories | number:'1.0-0' }} kcal</span></div>
                    <div class="t-item"><span class="t-label">Prot:</span><span class="t-val t-prot">{{ getDietTotals(diet).protein | number:'1.0-1' }}g</span></div>
                    <div class="t-item"><span class="t-label">Carb:</span><span class="t-val t-carb">{{ getDietTotals(diet).carbs | number:'1.0-1' }}g</span></div>
                    <div class="t-item"><span class="t-label">Gord:</span><span class="t-val t-fat">{{ getDietTotals(diet).fat | number:'1.0-1' }}g</span></div>
                  </div>
                }
              </ion-card-content>
            }
          </ion-card>
        }
      }
    </ion-content>

    <!-- Modal: Nova Dieta -->
    <ion-modal [isOpen]="showDietModal()" (willDismiss)="showDietModal.set(false)">
      <ng-template>
        <div class="modal-content">
          <p class="modal-title">Nova Dieta</p>
          <div class="field">
            <label>Nome</label>
            <ion-input [(ngModel)]="dietForm.name" placeholder="Ex: Dieta de Ganho" fill="outline"></ion-input>
          </div>
          <div class="field">
            <label>Descrição</label>
            <ion-textarea [(ngModel)]="dietForm.description" placeholder="Opcional..." rows="2" fill="outline"></ion-textarea>
          </div>
          <div class="modal-actions">
            <ion-button fill="outline" (click)="showDietModal.set(false)">Cancelar</ion-button>
            <ion-button (click)="saveDiet()">Salvar</ion-button>
          </div>
        </div>
      </ng-template>
    </ion-modal>

    <!-- Modal: Nova Refeição -->
    <ion-modal [isOpen]="showMealModal()" (willDismiss)="showMealModal.set(false)">
      <ng-template>
        <div class="modal-content">
          <p class="modal-title">Nova Refeição</p>
          <div class="field">
            <label>Nome da Refeição</label>
            <ion-input [(ngModel)]="mealForm.name" placeholder="Ex: Café da Manhã" fill="outline"></ion-input>
          </div>
          <div class="field">
            <label>Horário</label>
            <ion-input type="time" [(ngModel)]="mealForm.mealTime" fill="outline" required></ion-input>
          </div>
          <div class="field">
            <label>Ordem</label>
            <ion-input type="number" [(ngModel)]="mealForm.mealOrder" fill="outline"></ion-input>
          </div>
          <div class="modal-actions">
            <ion-button fill="outline" (click)="showMealModal.set(false)">Cancelar</ion-button>
            <ion-button (click)="saveMeal()">Salvar</ion-button>
          </div>
        </div>
      </ng-template>
    </ion-modal>

    <!-- Modal: Editar Alimento -->
    <ion-modal [isOpen]="showEditFoodModal()" (willDismiss)="showEditFoodModal.set(false); editingFood.set(null)">
      <ng-template>
        <div class="modal-content">
          <p class="modal-title">Editar Alimento</p>
          <div class="field">
            <label>Nome do Alimento</label>
            <ion-input [(ngModel)]="foodForm.foodName" placeholder="Nome" fill="outline"></ion-input>
          </div>
          <div class="field">
            <label>Tipo de medida</label>
            <div style="display:flex; gap:8px;">
              <ion-button [fill]="foodForm.measureType === 'grams' ? 'solid' : 'outline'" size="small" (click)="foodForm.measureType='grams'; onMeasureTypeChange()">Gramas</ion-button>
              <ion-button [fill]="foodForm.measureType === 'unit' ? 'solid' : 'outline'" size="small" (click)="foodForm.measureType='unit'; onMeasureTypeChange()">Unidades</ion-button>
            </div>
          </div>
          @if (foodForm.measureType === 'grams') {
            <div class="field">
              <label>Quantidade (g)</label>
              <ion-input type="number" [(ngModel)]="foodForm.quantityGrams" fill="outline"></ion-input>
            </div>
          } @else {
            <div class="macros-grid">
              <div class="field">
                <label>Quantidade</label>
                <ion-input type="number" [(ngModel)]="foodForm.servingQuantity" fill="outline" (ionInput)="onServingChange()"></ion-input>
              </div>
              <div class="field">
                <label>Nome da unidade</label>
                <ion-input [(ngModel)]="foodForm.servingUnit" placeholder="unidade, fatia..." fill="outline"></ion-input>
              </div>
            </div>
            <div class="field">
              <label>Gramas por unidade</label>
              <ion-input type="number" [(ngModel)]="foodForm.servingGrams" fill="outline" (ionInput)="onServingChange()"></ion-input>
            </div>
            <div style="font-size:0.78rem; color: var(--ft-text-muted); margin-bottom:10px;">
              Total: {{ foodForm.servingQuantity }} {{ foodForm.servingUnit }} = {{ foodForm.quantityGrams }}g
            </div>
          }
          <div class="macros-grid">
            <div class="field">
              <label>Calorias (kcal)</label>
              <ion-input type="number" [(ngModel)]="foodForm.calories" fill="outline"></ion-input>
            </div>
            <div class="field">
              <label>Proteína (g)</label>
              <ion-input type="number" [(ngModel)]="foodForm.protein" fill="outline"></ion-input>
            </div>
            <div class="field">
              <label>Carboidrato (g)</label>
              <ion-input type="number" [(ngModel)]="foodForm.carbs" fill="outline"></ion-input>
            </div>
            <div class="field">
              <label>Gordura (g)</label>
              <ion-input type="number" [(ngModel)]="foodForm.fat" fill="outline"></ion-input>
            </div>
          </div>
          <div class="modal-actions">
            <ion-button fill="outline" (click)="showEditFoodModal.set(false); editingFood.set(null)">Cancelar</ion-button>
            <ion-button (click)="saveEditFood()">Salvar</ion-button>
          </div>
        </div>
      </ng-template>
    </ion-modal>

    <!-- Modal: Adicionar Alimento -->
    <ion-modal [isOpen]="showFoodModal()" (willDismiss)="showFoodModal.set(false)">
      <ng-template>
        <div class="modal-content">
          <p class="modal-title">Adicionar Alimento</p>

          <div class="field">
            <label>Buscar alimento</label>
            <div class="search-row">
              <ion-input [(ngModel)]="foodSearchQuery" placeholder="Ex: arroz, frango..." fill="outline" (keydown.enter)="searchFood()"></ion-input>
              <ion-button size="small" (click)="searchFood()">
                <ion-icon name="search" slot="icon-only"></ion-icon>
              </ion-button>
            </div>
          </div>

          @if (searching()) {
            <div class="s-msg">Buscando...</div>
          } @else if (searchResults().length > 0) {
            <div class="search-results">
              @for (r of searchResults(); track r.code) {
                <div class="s-result" [class.selected]="selectedFood()?.code === r.code" (click)="selectFood(r)">
                  <div class="s-name">{{ r.name }}</div>
                  <div class="s-macros">{{ r.calories | number:'1.0-0' }} kcal · P:{{ r.protein | number:'1.0-1' }}g C:{{ r.carbs | number:'1.0-1' }}g G:{{ r.fat | number:'1.0-1' }}g</div>
                </div>
              }
            </div>
          } @else if (searchPerformed()) {
            <div class="s-msg">Nenhum resultado encontrado.</div>
          }

          <div class="field">
            <label>Nome do Alimento</label>
            <ion-input [(ngModel)]="foodForm.foodName" placeholder="Nome" fill="outline"></ion-input>
          </div>

          <div class="field">
            <label>Tipo de medida</label>
            <div style="display:flex; gap:8px;">
              <ion-button [fill]="foodForm.measureType === 'grams' ? 'solid' : 'outline'" size="small" (click)="foodForm.measureType='grams'; onMeasureTypeChange()">Gramas</ion-button>
              <ion-button [fill]="foodForm.measureType === 'unit' ? 'solid' : 'outline'" size="small" (click)="foodForm.measureType='unit'; onMeasureTypeChange()">Unidades</ion-button>
            </div>
          </div>

          @if (foodForm.measureType === 'grams') {
            <div class="field">
              <label>Quantidade (g)</label>
              <ion-input type="number" [(ngModel)]="foodForm.quantityGrams" fill="outline" (ionInput)="recalcMacros()"></ion-input>
            </div>
          } @else {
            <div class="macros-grid">
              <div class="field">
                <label>Quantidade</label>
                <ion-input type="number" [(ngModel)]="foodForm.servingQuantity" fill="outline" (ionInput)="onServingChange()"></ion-input>
              </div>
              <div class="field">
                <label>Nome da unidade</label>
                <ion-input [(ngModel)]="foodForm.servingUnit" placeholder="unidade, fatia..." fill="outline"></ion-input>
              </div>
            </div>
            <div class="field">
              <label>Gramas por unidade</label>
              <ion-input type="number" [(ngModel)]="foodForm.servingGrams" fill="outline" (ionInput)="onServingChange()"></ion-input>
            </div>
            <div style="font-size:0.78rem; color: var(--ft-text-muted); margin-bottom:10px;">
              Total: {{ foodForm.servingQuantity }} {{ foodForm.servingUnit }} = {{ foodForm.quantityGrams }}g
            </div>
          }

          <div class="macros-grid">
            <div class="field">
              <label>Calorias (kcal)</label>
              <ion-input type="number" [(ngModel)]="foodForm.calories" fill="outline"></ion-input>
            </div>
            <div class="field">
              <label>Proteína (g)</label>
              <ion-input type="number" [(ngModel)]="foodForm.protein" fill="outline"></ion-input>
            </div>
            <div class="field">
              <label>Carboidrato (g)</label>
              <ion-input type="number" [(ngModel)]="foodForm.carbs" fill="outline"></ion-input>
            </div>
            <div class="field">
              <label>Gordura (g)</label>
              <ion-input type="number" [(ngModel)]="foodForm.fat" fill="outline"></ion-input>
            </div>
          </div>
          <div class="modal-actions">
            <ion-button fill="outline" (click)="showFoodModal.set(false)">Cancelar</ion-button>
            <ion-button (click)="saveFood()">Adicionar</ion-button>
          </div>
        </div>
      </ng-template>
    </ion-modal>
  `
})
export class DietaPage implements OnInit {
  private readonly dietService = inject(DietService);
  private readonly alertCtrl = inject(AlertController);
  private readonly toastCtrl = inject(ToastController);

  diets = signal<Diet[]>([]);
  loading = signal(true);
  expandedDiet = signal<string | null>(null);

  showDietModal = signal(false);
  showMealModal = signal(false);
  showFoodModal = signal(false);
  showEditFoodModal = signal(false);
  editingFood = signal<MealFood | null>(null);

  dietForm = { name: '', description: '' };
  mealForm = { name: '', mealOrder: 0, mealTime: '' };
  foodForm = { foodName: '', quantityGrams: 100, calories: 0, protein: 0, carbs: 0, fat: 0, measureType: 'grams' as 'grams' | 'unit', servingUnit: 'unidade', servingGrams: 50, servingQuantity: 1 };

  foodSearchQuery = '';
  searchResults = signal<FoodSearchResult[]>([]);
  selectedFood = signal<FoodSearchResult | null>(null);
  searching = signal(false);
  searchPerformed = signal(false);

  activeDiet = signal<Diet | null>(null);
  activeMeal = signal<Meal | null>(null);

  constructor() {
    addIcons({ add, trash, chevronDown, chevronUp, search, nutrition, informationCircle });
  }

  ngOnInit() {
    this.loadDiets();
  }

  loadDiets() {
    this.loading.set(true);
    this.dietService.getMyDiets().subscribe({
      next: (diets) => {
        const loadPromises = diets.map(d =>
          new Promise<Diet>(resolve => {
            this.dietService.getDiet(d.id).subscribe({
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
      error: () => {
        this.diets.set([]);
        this.loading.set(false);
      }
    });
  }

  handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    this.loadDiets();
    setTimeout(() => event.detail.complete(), 1200);
  }

  toggleDiet(id: string) {
    this.expandedDiet.set(this.expandedDiet() === id ? null : id);
  }

  // --- Diet ---
  openCreateDiet() {
    this.dietForm = { name: '', description: '' };
    this.showDietModal.set(true);
  }

  saveDiet() {
    if (!this.dietForm.name.trim()) return;
    this.dietService.createDiet({ name: this.dietForm.name, description: this.dietForm.description || undefined }).subscribe({
      next: async () => {
        this.showDietModal.set(false);
        this.loadDiets();
        const toast = await this.toastCtrl.create({ message: 'Dieta criada!', duration: 1800, color: 'success', position: 'bottom' });
        toast.present();
      },
      error: async () => {
        const toast = await this.toastCtrl.create({ message: 'Erro ao criar dieta.', duration: 2000, color: 'danger', position: 'bottom' });
        toast.present();
      }
    });
  }

  // --- Meal ---
  openAddMeal(diet: Diet) {
    this.activeDiet.set(diet);
    this.mealForm = { name: '', mealOrder: diet.meals?.length ?? 0, mealTime: '' };
    this.showMealModal.set(true);
  }

  saveMeal() {
    const diet = this.activeDiet();
    if (!diet || !this.mealForm.name.trim() || !this.mealForm.mealTime) return;
    this.dietService.addMeal(diet.id, { name: this.mealForm.name, mealOrder: this.mealForm.mealOrder, mealTime: this.mealForm.mealTime }).subscribe({
      next: () => { this.showMealModal.set(false); this.loadDiets(); },
      error: async () => {
        const toast = await this.toastCtrl.create({ message: 'Erro ao adicionar refeição.', duration: 2000, color: 'danger', position: 'bottom' });
        toast.present();
      }
    });
  }

  // --- Food ---
  openAddFood(diet: Diet, meal: Meal) {
    this.activeDiet.set(diet);
    this.activeMeal.set(meal);
    this.foodForm = { foodName: '', quantityGrams: 100, calories: 0, protein: 0, carbs: 0, fat: 0, measureType: 'grams', servingUnit: 'unidade', servingGrams: 50, servingQuantity: 1 };
    this.foodSearchQuery = '';
    this.searchResults.set([]);
    this.selectedFood.set(null);
    this.searching.set(false);
    this.searchPerformed.set(false);
    this.showFoodModal.set(true);
  }

  searchFood() {
    if (!this.foodSearchQuery.trim()) return;
    this.searching.set(true);
    this.searchResults.set([]);
    this.searchPerformed.set(false);
    this.dietService.searchFood(this.foodSearchQuery).subscribe({
      next: (results) => { this.searchResults.set(results); this.searching.set(false); this.searchPerformed.set(true); },
      error: () => { this.searching.set(false); this.searchPerformed.set(true); }
    });
  }

  selectFood(food: FoodSearchResult) {
    this.selectedFood.set(food);
    this.foodForm.foodName = food.name;
    this.recalcMacros();
  }

  recalcMacros() {
    const food = this.selectedFood();
    if (!food) return;
    const grams = this.foodForm.measureType === 'unit'
      ? this.foodForm.servingQuantity * this.foodForm.servingGrams
      : this.foodForm.quantityGrams;
    this.foodForm.calories = parseFloat((food.calories * grams / 100).toFixed(2));
    this.foodForm.protein = parseFloat((food.protein * grams / 100).toFixed(2));
    this.foodForm.carbs = parseFloat((food.carbs * grams / 100).toFixed(2));
    this.foodForm.fat = parseFloat((food.fat * grams / 100).toFixed(2));
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
    if (!meal || !this.foodForm.foodName.trim()) return;
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
      next: () => { this.showFoodModal.set(false); this.loadDiets(); },
      error: async () => {
        const toast = await this.toastCtrl.create({ message: 'Erro ao adicionar alimento.', duration: 2000, color: 'danger', position: 'bottom' });
        toast.present();
      }
    });
  }

  // --- Edit Food ---
  openEditFood(food: MealFood, meal: Meal) {
    this.editingFood.set(food);
    this.activeMeal.set(meal);
    const hasUnit = !!food.servingUnit && !!food.servingGrams;
    const servingGrams = food.servingGrams ?? 50;
    const servingQty = hasUnit ? Math.round((food.quantityGrams / servingGrams) * 10) / 10 : 1;
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
      servingQuantity: servingQty
    };
    this.showEditFoodModal.set(true);
  }

  saveEditFood() {
    const food = this.editingFood();
    const meal = this.activeMeal();
    if (!food || !meal || !this.foodForm.foodName.trim()) return;
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
      next: () => { this.showEditFoodModal.set(false); this.editingFood.set(null); this.loadDiets(); },
      error: async () => {
        const toast = await this.toastCtrl.create({ message: 'Erro ao editar alimento.', duration: 2000, color: 'danger', position: 'bottom' });
        toast.present();
      }
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
