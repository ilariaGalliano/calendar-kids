import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { TaskInstance } from '../models/task.models';
import { Profile } from './profile.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  login(email: string, password: string) {
    return this.http.post<{ accessToken: string }>(`${this.base}/auth/login`, { email, password });
  }

  getCalendar(householdId: string, fromISO: string, toISO: string) {
    console.log('[API CALL]', 'calendar', { householdId, fromISO, toISO }); // 👈 log in FE
    const params = new HttpParams()
      .set('householdId', householdId)
      .set('from', fromISO)
      .set('to', toISO);

    return this.http.get<TaskInstance[]>(`${this.base}/calendar`, { params });
  }

  setInstanceDone(householdId: string, instanceId: string, done: boolean) {
    // se il tuo BE richiede householdId nel path/query, adegua questa firma
    return this.http.patch<TaskInstance>(`${this.base}/calendar/${instanceId}/done`, { done });
  }

  // Households / Profiles
  getProfiles(householdId: string) {
    return this.http.get<Profile[]>(`${this.base}/households/${householdId}/profiles`);
  }
  createProfile(householdId: string, dto: Partial<Profile>) {
    return this.http.post<Profile>(`${this.base}/households/${householdId}/profiles`, dto);
  }

  // Tasks
  getTasks(householdId: string) {
    return this.http.get<Task[]>(`${this.base}/households/${householdId}/tasks`);
  }
  createTask(householdId: string, dto: Partial<Task>) {
    return this.http.post<Task>(`${this.base}/households/${householdId}/tasks`, dto);
  }
}