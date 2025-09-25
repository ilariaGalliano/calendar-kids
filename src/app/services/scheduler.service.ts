import { Injectable, signal, computed } from '@angular/core';
import { addDays, formatISO, isSameDay } from './utils/date-lite';
import { ApiService } from '../common/api.service';
import { KidTask } from '../models/kid.models';
import { TaskInstance } from '../models/task.models';
// Utility: TaskInstance -> KidTask (per una specifica data)
export function toKidTask(i: { id: string; task?: { title: string; color?: string | null }; date: string; startTime?: string | null; endTime?: string | null; done: boolean }): KidTask {
  const startISO = combine(i.date, i.startTime ?? '00:00');
  const endISO = combine(i.date, i.endTime ?? '00:30');
  return {
    id: i.id,
    instanceId: i.id,
    title: i.task?.title ?? 'Attività',
    color: i.task?.color ?? '#9AD7FF',
    start: startISO,
    end: endISO,
    done: i.done,
  };
}

function combine(dateYYYYMMDD: string, hhmm: string): string {
  // date es: "2025-09-18", hhmm "08:00"
  const [y, m, d] = dateYYYYMMDD.split('-').map(Number);
  const [H, Mi] = hhmm.split(':').map(Number);
  const dt = new Date(y, m - 1, d, H, Mi, 0, 0);
  return dt.toISOString();
}


@Injectable({ providedIn: 'root' })
export class SchedulerService {
  private byDay = signal<Record<string, KidTask[]>>({});

  constructor(private api: ApiService) { }

  /**
   * Carica il range [from,to] inclusi per una household e popola la mappa interna.
   * from/to devono essere "YYYY-MM-DD".
   */
  loadRange(householdId: string, from: string, to: string) {
    return this.api.getCalendar(householdId, from, to).subscribe(instances => {
      // raggruppa per date
      const next: Record<string, KidTask[]> = {};
      for (const inst of instances as TaskInstance[]) {
        const day = inst.date; // già "YYYY-MM-DD"
        if (!next[day]) next[day] = [];
        next[day].push(toKidTask(inst));
      }
      // ordina ciascun giorno per orario di start
      for (const k of Object.keys(next)) {
        next[k].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      }
      this.byDay.set(next);
    });
  }

  /** Ritorna la lista di KidTask per un giorno (anche [] se vuoto) */
  tasksForDay(day: string): KidTask[] {
    return this.byDay()[day] ?? [];
  }

  /** Aggiorna lo stato done lato BE e localmente */
  setDone(householdId: string, instanceId: string, done: boolean) {
    return this.api.setInstanceDone(householdId, instanceId, done).subscribe(updated => {
      const day = (updated as any).date as string; // il BE ritorna la stessa istanza con 'date'
      const map = { ...this.byDay() };
      if (!map[day]) return;
      map[day] = map[day].map(t => t.instanceId === instanceId ? { ...t, done: updated.done } : t);
      this.byDay.set(map);
    });
  }
  // private _tasks = signal<KidTask[]>([
  //   // seed demo data
  //   { id: 't1', kidId: 'kid-greta', title: 'Asilo', color: '#5b8def', start: new Date().toISOString(), end: new Date(Date.now()+60*60*1000).toISOString(), repeat: 'daily', reminders: [10] },
  //   { id: 't2', kidId: 'kid-grace', title: 'Pediatra', color: '#ff8fab', start: new Date().toISOString(), end: new Date(Date.now()+2*60*60*1000).toISOString(), repeat: 'none', reminders: [30] }
  // ]);

  // tasks = computed(() => this._tasks());

  // upsert(task: KidTask) {
  //   const list = this._tasks();
  //   const i = list.findIndex(t => t.id === task.id);
  //   if (i >= 0) list[i] = task; else list.push(task);
  //   this._tasks.set([...list]);
  // }

  // remove(taskId: string) {
  //   this._tasks.set(this._tasks().filter(t => t.id !== taskId));
  // }

  // getTasksForRange(fromISO: string, toISO: string) {
  //   const from = new Date(fromISO);
  //   const to = new Date(toISO);
  //   const out: KidTask[] = [];

  //   for (const t of this._tasks()) {
  //     if (!t.repeat || t.repeat === 'none') { out.push(t); continue; }
  //     let cur = new Date(t.start);
  //     const limit = addDays(new Date(t.start), 90);
  //     while (cur <= limit && cur <= to) {
  //       if (cur >= from) {
  //         const spanMs = new Date(t.end).getTime() - new Date(t.start).getTime();
  //         const inst: KidTask = {
  //           ...t,
  //           id: `${t.id}@${formatISO(cur).slice(0,10)}`,
  //           start: formatISO(cur),
  //           end: formatISO(new Date(cur.getTime() + spanMs))
  //         };
  //         out.push(inst);
  //       }
  //       cur = addDays(cur, t.repeat === 'daily' ? 1 : 7);
  //     }
  //   }
  //   return out;
  // }

  // tasksForDay(day: string) {
  //   const d = new Date(day);
  //   return this.getTasksForRange(day + 'T00:00:00', day + 'T23:59:59')
  //     .filter(t => isSameDay(new Date(t.start), d));
  // }
}
