import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MockApiService {
  async login(email: string, password: string) {
    // Simula una risposta di login
    return Promise.resolve({
      accessToken: 'FAKE_TOKEN',
      AppUser: {
        email,
        name: 'Demo AppUser',
        id: 'demo-AppUser-id'
      }
    });
  }

  async register(email: string, password: string, householdName: string) {
    // Simula una risposta di registrazione
    return Promise.resolve({
      accessToken: 'FAKE_TOKEN',
      householdId: 'demo-family-id',
      AppUser: {
        email,
        name: householdName,
        id: 'demo-AppUser-id'
      }
    });
  }

  // Puoi aggiungere altri endpoint mock qui
}
