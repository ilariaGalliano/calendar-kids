import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '../common/api.service';
import { CalendarResponse, CalendarWeek, CalendarDay, calendarTaskToKidTask, CurrentTimeWindowData } from '../models/calendar.models';
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
      const weekResult = this.api.getWeekCalendar(householdId, date);
      const weekData = weekResult instanceof Promise ? await weekResult : await weekResult.toPromise();

      if (!weekData) {
        throw new Error('Nessun dato ricevuto dal server');
      }

      // If mock data, transform to CalendarWeek
      let week: CalendarWeek;
      if ('week' in weekData && 'tasks' in weekData) {
        // Transform mock structure to CalendarWeek
        week = {
          weekStart: weekData.week[0],
          weekEnd: weekData.week[weekData.week.length - 1],
          weekNumber: 1,
          days: weekData.week.map(date => {
            const d = new Date(date);
            return {
              date,
              dayOfWeek: d.getDay(),
              isToday: date === new Date().toISOString().slice(0, 10),
              tasks: weekData.tasks.filter(t => t.date === date).map((task: any) => ({
                ...task,
                taskId: String(task.id),
                done: !!task.completed,
                assigneeProfileId: task.childId ?? 'kid1',
                childId: task.childId ?? 'kid1',
                childName: task.childName ?? task.child ?? 'Bambino',
              }))
            };
          })
        };
      } else {
        week = weekData as CalendarWeek;
      }
      this.currentWeek.set(week);

      // Converte i dati nel formato richiesto dal frontend
      const tasksByDay: Record<string, KidTask[]> = {};
      week.days.forEach((day: any) => {
        tasksByDay[day.date] = day.tasks.map((task: any) => 
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
      const monthResult = this.api.getMonthCalendar(householdId, year, month);
      const monthData = monthResult instanceof Promise ? await monthResult : await monthResult.toPromise();

      if (!monthData) {
        throw new Error('Nessun dato ricevuto dal server');
      }

      // If mock data, transform to CalendarResponse
      let monthResponse: CalendarResponse;
      if ('week' in monthData && 'tasks' in monthData) {
        // Fake a CalendarResponse from mock week
        monthResponse = {
          month: parseInt(monthData.week[0].slice(5, 7)),
          year: parseInt(monthData.week[0].slice(0, 4)),
          totalDays: monthData.week.length,
          weeks: [
            {
              weekStart: monthData.week[0],
              weekEnd: monthData.week[monthData.week.length - 1],
              weekNumber: 1,
              days: monthData.week.map(date => {
                const d = new Date(date);
                return {
                  date,
                  dayOfWeek: d.getDay(),
                  isToday: date === new Date().toISOString().slice(0, 10),
                  tasks: monthData.tasks.filter(t => t.date === date).map((task: any) => ({
                    ...task,
                    taskId: String(task.id),
                    done: !!task.completed,
                    assigneeProfileId: task.childId ?? 'kid1',
                    childId: task.childId ?? 'kid1',
                    childName: task.childName ?? task.child ?? 'Bambino',
                  }))
                };
              })
            }
          ],
          dailyView: monthData.week.map(date => {
            const d = new Date(date);
            return {
              date,
              dayOfWeek: d.getDay(),
              isToday: date === new Date().toISOString().slice(0, 10),
              tasks: monthData.tasks.filter(t => t.date === date).map((task: any) => ({
                ...task,
                taskId: String(task.id),
                done: !!task.completed,
                assigneeProfileId: task.childId ?? 'kid1',
                childId: task.childId ?? 'kid1',
                childName: task.childName ?? task.child ?? 'Bambino',
              }))
            };
          })
        };
      } else {
        monthResponse = monthData as CalendarResponse;
      }
      this.currentMonth.set(monthResponse);
      return monthResponse;

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
      const dayResult = this.api.getDayCalendar(householdId, date);
      const dayData = dayResult instanceof Promise ? await dayResult : await dayResult.toPromise();

      if (!dayData) {
        throw new Error('Nessun dato ricevuto dal server');
      }

      // If mock data, transform to expected shape
      let tasks: KidTask[];
      if ('tasks' in dayData && 'date' in dayData) {
        tasks = dayData.tasks.map((task: any) => calendarTaskToKidTask({
          ...task,
          taskId: String(task.id),
          done: !!task.completed,
          assigneeProfileId: task.childId ?? 'kid1',
          childId: task.childId ?? 'kid1',
          childName: task.childName ?? task.child ?? 'Bambino',
        }, dayData.date));
      } else if ('tasks' in dayData) {
        tasks = (dayData as any).tasks.map((task: any) => calendarTaskToKidTask({
          ...task,
          taskId: String(task.id),
          done: !!task.completed,
          assigneeProfileId: task.childId ?? 'kid1',
          childId: task.childId ?? 'kid1',
          childName: task.childName ?? task.child ?? 'Bambino',
        }, date));
      } else {
        tasks = [];
      }
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
      const doneResult = this.api.setInstanceDone(householdId, instanceId, done);
      if (doneResult instanceof Promise) {
        await doneResult;
      } else {
        await doneResult.toPromise();
      }
      return true;
    } catch (error) {
      console.error('❌ Errore nell\'aggiornamento task:', error);
      this.error.set(error instanceof Error ? error.message : 'Errore nell\'aggiornamento');
      return false;
    }
  }

  /**
   * Carica le attività nella finestra temporale corrente (±2 ore)
   */
  async loadCurrentTimeWindow(householdId: string, datetime?: string): Promise<any> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const timeResult = this.api.getCurrentTimeWindow(householdId, datetime);
      const timeWindowData = timeResult instanceof Promise ? await timeResult : await timeResult.toPromise();

      if (!timeWindowData) {
        throw new Error('Nessun dato ricevuto dal server');
      }

      // Group tasks by kid (childId) and return as array for frontend rendering
      let allTasks: KidTask[] = [];
      let summary = { total: 0, current: 0, completed: 0, pending: 0, upcoming: 0 };
      let currentTime = '';
      let currentDate = '';
      let timeWindow = { start: '', end: '' };

      if ('date' in timeWindowData && 'tasks' in timeWindowData) {
        currentDate = timeWindowData.date;
        allTasks = timeWindowData.tasks.map((task: any) => ({
          ...calendarTaskToKidTask({
            ...task,
            taskId: String(task.id),
            done: !!task.completed,
            assigneeProfileId: task.childId ?? 'kid1',
          }, timeWindowData.date),
          timeStatus: 'current',
          minutesFromNow: 0
        }));
        timeWindow = { start: timeWindowData.date + 'T21:00:00', end: timeWindowData.date + 'T22:00:00' };
        summary = {
          total: allTasks.length,
          current: allTasks.length,
          completed: allTasks.filter((t: any) => t.done).length,
          pending: allTasks.filter((t: any) => !t.done).length,
          upcoming: 0
        };
      } else {
        currentTime = timeWindowData.currentTime;
        currentDate = timeWindowData.currentDate;
        timeWindow = timeWindowData.timeWindow;
        allTasks = timeWindowData.tasks.map((task: any) => ({
          ...calendarTaskToKidTask(task, timeWindowData.currentDate),
          timeStatus: task.timeStatus,
          minutesFromNow: task.minutesFromNow
        }));
        summary = timeWindowData.summary;
      }

      // Group by childId and return as array
      const groupedTasksArray: Array<{ childId: string, childName: string, tasks: KidTask[] }> = [];
      const groupMap: Record<string, { childId: string, childName: string, tasks: KidTask[] }> = {};
      allTasks.forEach(task => {
        const childId = task.childId ?? 'kid1';
        const childName = task.childName ?? 'Bambino';
        if (!groupMap[childId]) {
          groupMap[childId] = { childId, childName, tasks: [] };
        }
        groupMap[childId].tasks.push(task);
      });
      for (const key in groupMap) {
        groupedTasksArray.push(groupMap[key]);
      }

      return {
        currentTime,
        currentDate,
        timeWindow,
        tasks: groupedTasksArray,
        summary
      };

    } catch (error) {
      console.error('❌ Errore nel caricamento finestra temporale:', error);
      this.error.set(error instanceof Error ? error.message : 'Errore sconosciuto');
      return null;
    } finally {
      this.loading.set(false);
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