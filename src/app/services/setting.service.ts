import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SettingService {
  private base = environment.apiBase;
  constructor(private http: HttpClient) {}

  // --- Children ---
  getChildren() {
    return this.http.get<any[]>(`${this.base}/settings/children`);
  }
  addChild(child: any) {
    return this.http.post<any>(`${this.base}/settings/children`, child);
  }
  updateChild(id: string, child: any) {
    return this.http.put<any>(`${this.base}/settings/children/${id}`, child);
  }
  deleteChild(id: string) {
    return this.http.delete<any>(`${this.base}/settings/children/${id}`);
  }

  // --- Tasks ---
  getTasks(timeOfDay?: string) {
    const url = timeOfDay ? `${this.base}/settings/tasks?timeOfDay=${timeOfDay}` : `${this.base}/settings/tasks`;
    return this.http.get<any[]>(url);
  }
  createTask(task: any) {
    return this.http.post<any>(`${this.base}/settings/tasks`, task);
  }
  updateTask(id: string, task: any) {
    return this.http.put<any>(`${this.base}/settings/tasks/${id}`, task);
  }
  deleteTask(id: string) {
    return this.http.delete<any>(`${this.base}/settings/tasks/${id}`);
  }

  // --- Routines ---
  getRoutines(childId: string) {
    return this.http.get<any[]>(`${this.base}/settings/routine?childId=${childId}`);
  }
  createRoutine(routine: any) {
    return this.http.post<any>(`${this.base}/settings/routine`, routine);
  }
  updateRoutine(id: string, routine: any) {
    return this.http.put<any>(`${this.base}/settings/routine/${id}`, routine);
  }
  deleteRoutine(id: string) {
    return this.http.delete<any>(`${this.base}/settings/routine/${id}`);
  }
}
