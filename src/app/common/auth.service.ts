import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { environment } from '../../environments/environment';
import { MockApiService } from './mock-api.service';
import { supabase } from '../core/supabase.client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private mockApi = inject(MockApiService);
  private key = 'accessToken';

  async setToken(token: string) {
    await Preferences.set({ key: this.key, value: token });
  }

  async clearToken() {
    await Preferences.remove({ key: this.key });
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  async logout() {
    await this.clearToken();
  }

  register(email: string, password: string, householdName: string) {
    if (environment.useMockApi) {
      return this.mockApi.register(email, password, householdName);
    }
    return this.http.post<{ accessToken: string; householdId: string }>(
      `${environment.apiBase}/auth/register`,
      { email, password, householdName }
    );
  }

  login(email: string, password: string) {
    if (environment.useMockApi) {
      return this.mockApi.login(email, password);
    }
    return this.http.post<{ accessToken: string }>(
      `${environment.apiBase}/auth/login`,
      { email, password }
    );
  }

  async loginWithGoogle(): Promise<string | null> {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) {
      console.error('Google login error:', error);
      return null;
    }
    // L'utente viene reindirizzato, quindi il token sarà disponibile dopo il redirect
    return null;
  }

  async getToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }
}
