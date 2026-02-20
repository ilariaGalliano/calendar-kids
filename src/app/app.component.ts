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
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      console.log('Supabase Access Token:', data.session.access_token);
    }
    if (data.session?.user?.id) {
      await this.auth.setUserId(data.session.user.id);
    }
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session && session.user?.id) {
        await this.auth.setUserId(session.user.id);
        this.router.navigate(['/family-setup']);
      }
      if (event === 'SIGNED_OUT') {
        await this.auth.clearToken();
        this.router.navigate(['/login']);
      }
    });
    await this.auth.bootstrapBackend();
  }
}
