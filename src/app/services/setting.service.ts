import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Child } from '../models/family.models';

@Injectable({ providedIn: 'root' })
export class SettingService {
  private base = environment.apiBase;
  constructor(private http: HttpClient) { }

  // --- Children ---

  getChildren(): Observable<Child[]> {
    // The backend will automatically filter by the logged user's ID from the JWT
    return this.http.get<Child[]>(`${this.base}/settings/children`);
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
  getRoutines(childId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/settings/routine`, {
      params: { childId }
    });
  }

  getRoutinesForChildren(childIds: string[]): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/settings/routine`, {
      params: { childIds: childIds.join(',') }
    });
  }

  createRoutine(routine: {
  childId: string;
  nametask: string;
  description?: string;
  day_of_week: number;
  taskIds?: string[];
  tasksByDay?: Record<number, string[]>;
}): Observable<any> {
  return this.http.post<any>(`${this.base}/settings/routine`, routine);
}

  // BE expects Partial of same shape
  updateRoutine(id: string, routine: Partial<{
    nametask: string;
    description: string;
    day_of_week: number;
    isActive: boolean;
    days: string[]; 
    tasks: any[];
    taskIds: string[];
    tasksByDay: Record<number, any[]>; // tasks per day (0=Sun, 1=Mon, ..., 6=Sat), can be IDs or objects with times
  }>): Observable<any> {
    return this.http.put<any>(`${this.base}/settings/routine/${id}`, routine);
  }

  deleteRoutine(id: string): Observable<any> {
    return this.http.delete<any>(`${this.base}/settings/routine/${id}`);
  }
}
