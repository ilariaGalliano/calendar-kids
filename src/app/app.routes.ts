import { Routes } from '@angular/router';
import { CalendarBoardComponent } from './components/calendar-board/calendar-board.component';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'family-setup',
    loadComponent: () => import('./components/family-setup/family-setup.component').then((m) => m.FamilySetupComponent),
  },
  {
    path: 'settings',
    loadComponent: () => import('./components/settings/settings.component').then((m) => m.SettingsComponent),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  { path: 'calendario', component: CalendarBoardComponent },
];
