import { Component } from '@angular/core';
import { IonApp, IonContent, IonMenu, IonRouterOutlet } from '@ionic/angular/standalone';
import { AccountSidebarComponent } from './features/account-sidebar/account-sidebar.component';
import { supabase } from './core/supabase.client';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from './common/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `<ion-app><ion-router-outlet></ion-router-outlet></ion-app>`
})
export class AppComponent {

  constructor(private http: HttpClient, private router: Router, private auth: AuthService) { }


  async ngOnInit() {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.id) {
        await this.auth.setUserId(session.user.id);
        // Navigate only when coming from login/root (new login or OAuth redirect).
        // Do NOT navigate on token refresh (SIGNED_IN fires every ~1h).
        const currentUrl = this.router.url;
        const isOnAuthPage = currentUrl === '/' || currentUrl === '/login' || currentUrl.startsWith('/login');
        if (isOnAuthPage) {
          this.router.navigate(['/family-setup']);
        }
      }

      if (event === 'INITIAL_SESSION' && session?.user?.id) {
        // App reloaded with existing session — restore userId but don't redirect
        await this.auth.setUserId(session.user.id);
      }

      if (event === 'SIGNED_OUT') {
        await this.auth.clearToken();
        this.router.navigate(['/login']);
      }
    });

    await this.auth.bootstrapBackend();
  }
}
