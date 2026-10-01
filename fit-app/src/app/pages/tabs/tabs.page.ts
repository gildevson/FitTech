import { Component } from '@angular/core';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonRouterOutlet
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { barbell, flame, person } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    IonRouterOutlet
  ],
  styles: [`
    ion-tab-bar {
      --background: #16213e;
      --border: 1px solid rgba(233, 69, 96, 0.2);
    }

    ion-tab-button {
      --color: #8892b0;
      --color-selected: #e94560;
      --background: transparent;
      --background-focused: transparent;
    }

    ion-tab-button ion-icon {
      font-size: 1.5rem;
    }

    ion-tab-button ion-label {
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
  `],
  template: `
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="treinos" href="/tabs/treinos">
          <ion-icon name="flame"></ion-icon>
          <ion-label>Treinos</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="exercicios" href="/tabs/exercicios">
          <ion-icon name="barbell"></ion-icon>
          <ion-label>Exercícios</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="perfil" href="/tabs/perfil">
          <ion-icon name="person"></ion-icon>
          <ion-label>Perfil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `
})
export class TabsPage {
  constructor() {
    addIcons({ barbell, flame, person });
  }
}
