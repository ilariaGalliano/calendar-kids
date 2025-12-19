import { Component } from '@angular/core';
import { IonApp, IonContent, IonMenu, IonRouterOutlet } from '@ionic/angular/standalone';
import { AccountSidebarComponent } from './features/account-sidebar/account-sidebar.component';
import { supabase } from './core/supabase.client';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `<ion-app><ion-router-outlet></ion-router-outlet></ion-app>`
})
export class AppComponent {

  constructor(private http: HttpClient, private router: Router) { }


  async ngOnInit() {
    const { data } = await supabase.auth.getSession();
    console.log('SESSION:', data.session);
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AUTH EVENT:', event);

      if (event === 'SIGNED_IN' && session) {
        await this.http
          .get(`${environment.apiBase}/AppUsers/me`)
          .toPromise();
      }

      if (event === 'SIGNED_OUT') {
        // cleanup / redirect login
        this.router.navigate(['/family-setup']);
      }
    });
  }
}
