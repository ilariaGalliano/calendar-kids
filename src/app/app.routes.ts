import { Routes } from '@angular/router';
import { CalendarBoardComponent } from './components/calendar-board/calendar-board.component';
import { AuthGuard } from './common/auth.guard';

export const routes: Routes = [
  {
    // Callback OAuth Google/Supabase - NESSUN guard, gestisce il code exchange PKCE
    path: 'auth/callback',
    loadComponent: () => import('./components/auth-callback/auth-callback.component').then((m) => m.AuthCallbackComponent),
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'family-setup',
    loadComponent: () => import('./components/family-setup/family-setup.component').then((m) => m.FamilySetupComponent),
    canActivate: [AuthGuard]
  },
   {
    path: 'family-profile-picker',
    loadComponent: () => import('./components/family-profile-picker/family-profile-picker.component').then((m) => m.FamilyProfilePickerComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('./components/settings/settings.component').then((m) => m.SettingsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  { 
    path: 'calendario', 
    component: CalendarBoardComponent,
    canActivate: [AuthGuard]
  },
];
