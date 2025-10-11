import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '../common/api.service';
import { CalendarResponse, CalendarWeek, CalendarDay, calendarTaskToKidTask } from '../models/calendar.models';
import { KidTask } from '../models/kid.models';
import { catchError, map, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CalendarService {
  private api = inject(ApiService);
  
  // Signals per lo state management
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  currentWeek = signal<CalendarWeek | null>(null);
  currentMonth = signal<CalendarResponse | null>(null);

  constructor() {}

  /**
   * Carica il calendario settimanale dal backend
   */
  async loadWeekCalendar(householdId: string, date: string): Promise<Record<string, KidTask[]> | null> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const weekData = await this.api.getWeekCalendar(householdId, date).toPromise();
      
      if (!weekData) {
        throw new Error('Nessun dato ricevuto dal server');
      }

      this.currentWeek.set(weekData);

      // Converte i dati del backend nel formato richiesto dal frontend
      const tasksByDay: Record<string, KidTask[]> = {};
      
      weekData.days.forEach(day => {
        tasksByDay[day.date] = day.tasks.map(task => 
          calendarTaskToKidTask(task, day.date)
        );
      });

      return tasksByDay;

    } catch (error) {
      console.error('❌ Errore nel caricamento calendario settimanale:', error);
      this.error.set(error instanceof Error ? error.message : 'Errore sconosciuto');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Carica il calendario mensile dal backend
   */
  async loadMonthCalendar(householdId: string, year: number, month: number): Promise<CalendarResponse | null> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const monthData = await this.api.getMonthCalendar(householdId, year, month).toPromise();
      
      if (!monthData) {
        throw new Error('Nessun dato ricevuto dal server');
      }

      this.currentMonth.set(monthData);
      return monthData;

    } catch (error) {
      console.error('❌ Errore nel caricamento calendario mensile:', error);
      this.error.set(error instanceof Error ? error.message : 'Errore sconosciuto');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Carica il calendario per un giorno specifico
   */
  async loadDayCalendar(householdId: string, date: string): Promise<KidTask[] | null> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const dayData = await this.api.getDayCalendar(householdId, date).toPromise();
      
      if (!dayData) {
        throw new Error('Nessun dato ricevuto dal server');
      }

      const tasks = dayData.tasks.map(task => calendarTaskToKidTask(task, dayData.date));
      return tasks;

    } catch (error) {
      console.error('❌ Errore nel caricamento calendario giornaliero:', error);
      this.error.set(error instanceof Error ? error.message : 'Errore sconosciuto');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Segna una task come completata
   */
  async markTaskDone(householdId: string, instanceId: string, done: boolean): Promise<boolean> {
    try {
      await this.api.setInstanceDone(householdId, instanceId, done).toPromise();
      return true;
    } catch (error) {
      console.error('❌ Errore nell\'aggiornamento task:', error);
      this.error.set(error instanceof Error ? error.message : 'Errore nell\'aggiornamento');
      return false;
    }
  }

  /**
   * Genera array di giorni per una settimana partendo da una data
   */
  generateWeekDays(startDate?: Date): string[] {
    const start = startDate || new Date();
    const days: string[] = [];
    
    // Trova il lunedì della settimana
    const monday = new Date(start);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    
    // Genera 7 giorni
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      days.push(date.toISOString().slice(0, 10));
    }
    
    return days;
  }

  /**
   * Reset dello stato
   */
  reset() {
    this.loading.set(false);
    this.error.set(null);
    this.currentWeek.set(null);
    this.currentMonth.set(null);
  }
}