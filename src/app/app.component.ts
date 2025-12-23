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
  console.log('SESSION:', data.session);
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('AUTH EVENT:', event);

    if (event === 'SIGNED_IN' && session && session.access_token) {
      this.router.navigate(['/family-setup']);
    }

    if (event === 'SIGNED_OUT') {
      this.router.navigate(['/family-setup']);
    }
  });
  await this.auth.bootstrapBackend();
}
}
