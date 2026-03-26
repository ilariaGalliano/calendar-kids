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

      const currentUrl = this.router.url;
      const isOnAuthPage =
        currentUrl === '/' ||
        currentUrl === '/login' ||
        currentUrl.startsWith('/login') ||
        currentUrl.startsWith('/auth/callback');

      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user?.id) {
        await this.auth.setUserId(session.user.id);
        // Naviga a family-setup solo se siamo su una pagina di auth/root.
        // Questo copre sia il caso "PKCE veloce" (INITIAL_SESSION) che quello normale (SIGNED_IN).
        if (isOnAuthPage) {
          this.router.navigate(['/family-setup'], { replaceUrl: true });
        }
      }

      if (event === 'SIGNED_OUT') {
        await this.auth.clearToken();
        this.router.navigate(['/login'], { replaceUrl: true });
      }
    });

    await this.auth.bootstrapBackend();
  }
}
