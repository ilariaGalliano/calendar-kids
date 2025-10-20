import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { TaskInstance } from '../models/task.models';
import { Profile } from './profile.models';
import { CalendarResponse, CalendarWeek, CalendarDay, CurrentTimeWindowResponse } from '../models/calendar.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  login(email: string, password: string) {
    return this.http.post<{ accessToken: string }>(`${this.base}/auth/login`, { email, password });
  }

  // NUOVI METODI CALENDARIO
  
  // Calendario mensile completo
  getMonthCalendar(householdId: string, year: number, month: number) {
    console.log('[API CALL]', 'calendar/month', { householdId, year, month });
    const params = new HttpParams()
      .set('householdId', householdId)
      .set('year', year.toString())
      .set('month', month.toString());

    return this.http.get<CalendarResponse>(`${this.base}/calendar/month`, { params });
  }

  // Calendario settimanale
  getWeekCalendar(householdId: string, date: string) {
    const params = new HttpParams()
      .set('householdId', householdId)
      .set('date', date);

    return this.http.get<CalendarWeek>(`${this.base}/calendar/week`, { params });
  }

  // Calendario giornaliero
  getDayCalendar(householdId: string, date: string) {
    const params = new HttpParams()
      .set('householdId', householdId)
      .set('date', date);

    return this.http.get<CalendarDay>(`${this.base}/calendar/day`, { params });
  }

  // Vista "Ora Corrente" - attività nelle prossime/precedenti 2 ore
  getCurrentTimeWindow(householdId: string, datetime?: string) {
    let params = new HttpParams().set('householdId', householdId);
    
    if (datetime) {
      params = params.set('datetime', datetime);
    }

    return this.http.get<CurrentTimeWindowResponse>(`${this.base}/calendar/now`, { params });
  }

  // METODI LEGACY (mantenuti per compatibilità)
  getCalendar(householdId: string, fromISO: string, toISO: string) {
    const params = new HttpParams()
      .set('householdId', householdId)
      .set('from', fromISO)
      .set('to', toISO);

    return this.http.get<TaskInstance[]>(`${this.base}/calendar`, { params });
  }

  // Segna task come completata
  setInstanceDone(householdId: string, instanceId: string, done: boolean) {
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