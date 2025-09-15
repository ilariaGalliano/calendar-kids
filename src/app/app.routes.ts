import { Routes } from '@angular/router';
import { CalendarBoardComponent } from './components/calendar-board/calendar-board.component';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  { path: 'calendario', component: CalendarBoardComponent },
];
