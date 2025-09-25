import { Component, Input, OnInit, signal, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import {
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList
} from '@ionic/angular/standalone';
import {
  CdkDropList, CdkDragDrop, moveItemInArray, transferArrayItem
} from '@angular/cdk/drag-drop';
import { KidTaskCardComponent } from '../kid-task-card/kid-task-card.component';
import { KidTask } from 'src/app/models/kid.models';
import { SchedulerService } from 'src/app/services/scheduler.service';
import { ApiService } from 'src/app/common/api.service';

@Component({
  selector: 'app-calendar-board',
  standalone: true,
  imports: [
    CommonModule, DatePipe,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList,
    CdkDropList, KidTaskCardComponent
  ],
  templateUrl: './calendar-board.component.html',
  styleUrls: ['./calendar-board.component.css']
})
export class CalendarBoardComponent implements OnInit {
  @Input() days: string[] = [];
  @Input() tasksByDay: Record<string, KidTask[]> = {};

  // Stato reattivo locale
  lists = signal<Record<string, KidTask[]>>({});

  Object = Object;

  // Mock di default (se il parent non passa input)
  private readonly mockDays: string[] = [
    '2025-09-15',
    '2025-09-16',
    '2025-09-17'
  ];

  @Input() householdId: string = ''; // valore di test

  constructor(
    private sched: SchedulerService,
    private api: ApiService
  ) { }

  ngOnInit() {
    // Se il parent non passa giorni, crea un range 7gg: oggi → +6
    if (!this.days?.length) {
      const today = new Date();
      const last = new Date(); last.setDate(today.getDate() + 6);
      this.days = this.rangeDays(today, last); // <-- 7 colonne fisse
    }
    this.loadFromBackend();
  }

  // helper invariato
  private rangeDays(from: Date, to: Date): string[] {
    const out: string[] = [];
    const d = new Date(from);
    while (d <= to) {
      out.push(d.toISOString().slice(0, 10));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }


  private setDaysAndListsFromMap(map: Record<string, KidTask[]>) {
    // ordina i giorni presenti nella mappa e aggiorna la vista
    this.days = Object.keys(map).sort();
    const copy: Record<string, KidTask[]> = {};
    for (const d of this.days) copy[d] = [...(map[d] || [])];
    this.lists.set(copy);
  }


  loadFromBackend() {
    // Chiedi esattamente il range che stai mostrando
    const from = this.days[0];
    const to = this.days[this.days.length - 1];

    console.log('loadFromBackend - API range:', { householdId: this.householdId, from, to });

    this.api.getCalendar(this.householdId, from, to).subscribe({
      next: res => {
        const mapFromApi = this.convertBackendDataToTasksByDay(res);
        // ⬇️ costruisci le liste SOLO per i giorni già presenti in this.days
        this.setListsForCurrentDays(mapFromApi);
      },
      error: _ => {
        console.warn('[API ERR] uso mock');
        this.useMockData(); // genera mock per this.days
      }
    });
  }

  private setListsForCurrentDays(source: Record<string, KidTask[]>) {
    const copy: Record<string, KidTask[]> = {};
    for (const d of this.days) {
      copy[d] = [...(source[d] ?? [])]; // se BE non ha dati per quel giorno → []
    }
    this.lists.set(copy);
  }



  private convertBackendDataToTasksByDay(backendData: any[]): Record<string, KidTask[]> {
    const result: Record<string, KidTask[]> = {};
    const instances = Array.isArray(backendData) ? backendData : Object.values(backendData);

    for (const instance of instances) {
      // calcola la chiave giorno in locale
      const d = new Date(instance.date);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${dd}`;

      const [sh, sm] = (instance.startTime ?? '00:00').split(':').map(Number);
      const [eh, em] = (instance.endTime ?? '00:30').split(':').map(Number);

      const start = new Date(y, d.getMonth(), d.getDate(), sh || 0, sm || 0, 0, 0);
      const end = new Date(y, d.getMonth(), d.getDate(), eh || 0, em || 0, 0, 0);

      const kidTask: KidTask = {
        id: instance.task?.id ?? instance.taskId ?? instance.id,
        instanceId: instance.id,
        title: instance.task?.title ?? 'Attività',
        color: instance.task?.color ?? '#7ED8A4',
        start: start.toISOString(),
        end: end.toISOString(),
        done: !!instance.done,
        doneAt: instance.doneAt ?? null,
        taskId: instance.taskId,
        assigneeProfileId: instance.assigneeProfileId,
        description: instance.task?.description,
        icon: instance.task?.icon,
      };

      (result[dateKey] ??= []).push(kidTask);
    }

    // ordina le attività per orario
    for (const k of Object.keys(result)) {
      result[k].sort((a, b) => +new Date(a.start) - +new Date(b.start));
    }
    return result;
  }

  private useMockData() {
    if (!this.days?.length) {
      const today = new Date(); const last = new Date(); last.setDate(today.getDate() + 6);
      this.days = this.rangeDays(today, last);
    }
    const mockMap = this.generateMockTasks(this.days);
    this.setListsForCurrentDays(mockMap); // <-- usa SEMPRE il range corrente
  }

  private generateMockTasks(days: string[]): Record<string, KidTask[]> {
    const out: Record<string, KidTask[]> = {};
    const titles = ['Colazione', 'Compiti', 'Gioco libero', 'Musica', 'Disegno', 'Letto', 'Doccia', 'Sport'];

    for (const day of days) {
      const base = new Date(day + 'T08:00:00');
      const count = 2 + Math.floor(Math.random() * 2); // 2 o 3 task
      const tasks: KidTask[] = [];

      for (let i = 0; i < count; i++) {
        const start = new Date(base.getTime() + i * 60 * 60 * 1000); // ogni ora
        const durMin = 30 + 30 * (i % 2); // 30 o 60 min
        const end = new Date(start.getTime() + durMin * 60 * 1000);

        tasks.push({
          id: `${day}-${i}`,
          title: titles[(i + Math.floor(Math.random() * titles.length)) % titles.length],
          color: ['primary', 'success', 'warning', 'tertiary'][i % 4],
          start: start.toISOString(),
          end: end.toISOString(),
        } as KidTask);
      }

      out[day] = tasks;
    }
    return out;
  }

  drop(event: CdkDragDrop<KidTask[]>, targetDay: string) {
    const lists = this.lists();
    const prev = event.previousContainer.data;
    const curr = event.container.data;

    if (event.previousContainer === event.container) {
      moveItemInArray(curr, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(prev, curr, event.previousIndex, event.currentIndex);
      const t = curr[event.currentIndex];

      // Allinea la data del task al giorno di destinazione, mantenendo la durata
      const oldStart = new Date(t.start);
      const duration = new Date(t.end).getTime() - oldStart.getTime();

      const [y, m, d] = targetDay.split('-').map(Number);
      const newStart = new Date(oldStart);
      newStart.setFullYear(y, m - 1, d);
      const newEnd = new Date(newStart.getTime() + duration);

      t.start = newStart.toISOString();
      t.end = newEnd.toISOString();
    }
    this.lists.set({ ...lists }); // trigger update
  }

  onDone(ev: { instanceId: string; done: boolean }) {
    if (!this.householdId) {
      console.warn('HouseholdId mancante, impossibile aggiornare');
      return;
    }
    this.sched.setDone(this.householdId, ev.instanceId, ev.done);
  }
}