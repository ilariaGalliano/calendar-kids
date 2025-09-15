import { Injectable, signal, computed } from '@angular/core';
import { addDays, formatISO, isSameDay } from './utils/date-lite';
import { KidTask } from '../../app/models/task.models';

@Injectable({ providedIn: 'root' })
export class SchedulerService {
  private _tasks = signal<KidTask[]>([
    // seed demo data
    { id: 't1', kidId: 'kid-greta', title: 'Asilo', color: '#5b8def', start: new Date().toISOString(), end: new Date(Date.now()+60*60*1000).toISOString(), repeat: 'daily', reminders: [10] },
    { id: 't2', kidId: 'kid-grace', title: 'Pediatra', color: '#ff8fab', start: new Date().toISOString(), end: new Date(Date.now()+2*60*60*1000).toISOString(), repeat: 'none', reminders: [30] }
  ]);

  tasks = computed(() => this._tasks());

  upsert(task: KidTask) {
    const list = this._tasks();
    const i = list.findIndex(t => t.id === task.id);
    if (i >= 0) list[i] = task; else list.push(task);
    this._tasks.set([...list]);
  }

  remove(taskId: string) {
    this._tasks.set(this._tasks().filter(t => t.id !== taskId));
  }

  getTasksForRange(fromISO: string, toISO: string) {
    const from = new Date(fromISO);
    const to = new Date(toISO);
    const out: KidTask[] = [];

    for (const t of this._tasks()) {
      if (!t.repeat || t.repeat === 'none') { out.push(t); continue; }
      let cur = new Date(t.start);
      const limit = addDays(new Date(t.start), 90);
      while (cur <= limit && cur <= to) {
        if (cur >= from) {
          const spanMs = new Date(t.end).getTime() - new Date(t.start).getTime();
          const inst: KidTask = {
            ...t,
            id: `${t.id}@${formatISO(cur).slice(0,10)}`,
            start: formatISO(cur),
            end: formatISO(new Date(cur.getTime() + spanMs))
          };
          out.push(inst);
        }
        cur = addDays(cur, t.repeat === 'daily' ? 1 : 7);
      }
    }
    return out;
  }

  tasksForDay(day: string) {
    const d = new Date(day);
    return this.getTasksForRange(day + 'T00:00:00', day + 'T23:59:59')
      .filter(t => isSameDay(new Date(t.start), d));
  }
}
