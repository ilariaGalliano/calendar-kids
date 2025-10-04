import { Component } from '@angular/core';
import { IonApp, IonContent, IonMenu, IonRouterOutlet } from '@ionic/angular/standalone';
import { AccountSidebarComponent } from './features/account-sidebar/account-sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `<ion-app><ion-router-outlet></ion-router-outlet></ion-app>`
})
export class AppComponent {}
