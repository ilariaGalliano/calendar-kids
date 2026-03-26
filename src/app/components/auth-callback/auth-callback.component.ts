import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { supabase } from '../../core/supabase.client';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [IonContent, IonSpinner],
  template: `
    <ion-content class="ion-padding ion-text-center">
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;">
        <ion-spinner name="crescent"></ion-spinner>
        <p style="margin-top:16px;color:#666;">Accesso in corso...</p>
      </div>
    </ion-content>
  `
})
export class AuthCallbackComponent implements OnInit {
  constructor(private router: Router) {}

  async ngOnInit() {
    // Supabase ha già scambiato il ?code=XXXX (PKCE) quando il client viene inizializzato.
    // Aspettiamo la sessione per massimo 5 secondi.
    const session = await this.waitForSession(5000);

    if (session) {
      this.router.navigate(['/family-setup'], { replaceUrl: true });
    } else {
      // Nessuna sessione dopo timeout → torna al login con errore
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  private async waitForSession(timeoutMs: number): Promise<any> {
    // Prima prova sincrona
    const { data } = await supabase.auth.getSession();
    if (data.session) return data.session;

    // Aspetta l'evento onAuthStateChange se la sessione non è ancora pronta
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        sub.data.subscription.unsubscribe();
        resolve(null);
      }, timeoutMs);

      const sub = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          clearTimeout(timer);
          sub.data.subscription.unsubscribe();
          resolve(session);
        }
      });
    });
  }
}
