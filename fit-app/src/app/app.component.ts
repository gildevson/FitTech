import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { LoadingComponent } from './shared/loading/loading.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, LoadingComponent],
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
    <app-loading></app-loading>
  `
})
export class AppComponent {}
