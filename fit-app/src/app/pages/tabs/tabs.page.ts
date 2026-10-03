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
    ion-tab-button {
      --background: transparent;
      --background-focused: transparent;
      --ripple-color: transparent;
      position: relative;
      transition: color 0.15s;
    }

    ion-tab-button.tab-selected::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      width: 28px;
      height: 3px;
      transform: translateX(-50%);
      border-radius: 0 0 3px 3px;
      background: var(--ft-accent);
    }

    ion-tab-button ion-icon {
      font-size: 1.4rem;
    }

    ion-tab-button ion-label {
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.02em;
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
