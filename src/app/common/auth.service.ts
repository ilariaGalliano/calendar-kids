import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private key = 'accessToken';

  async setToken(token: string) {
    await Preferences.set({ key: this.key, value: token });
  }
  async getToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: this.key });
    return value ?? null;
  }
  async clearToken() {
    await Preferences.remove({ key: this.key });
  }

  register(email: string, password: string, householdName: string) {
    return this.http.post<{ accessToken: string; householdId: string }>(
      `${environment.apiBase}/auth/register`,
      { email, password, householdName }
    );
  }

  login(email: string, password: string) {
    return this.http.post<{ accessToken: string }>(
      `${environment.apiBase}/auth/login`,
      { email, password }
    );
  }
}
