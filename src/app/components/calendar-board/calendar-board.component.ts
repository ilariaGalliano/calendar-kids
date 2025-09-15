import { Component, Input, OnInit, signal, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import {
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList
} from '@ionic/angular/standalone';
import {
  CdkDropList, CdkDragDrop, moveItemInArray, transferArrayItem
} from '@angular/cdk/drag-drop';
import { KidTask } from '../../models/task.models';
import { KidTaskCardComponent } from '../kid-task-card/kid-task-card.component';

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

  // Mock di default (se il parent non passa input)
  private readonly mockDays: string[] = [
    '2025-09-15',
    '2025-09-16',
    '2025-09-17'
  ];

  ngOnInit() {
    // Se non arrivano input validi, genero i mock
    if (!this.days?.length) {
      this.days = [...this.mockDays];
    }
    if (!this.tasksByDay || Object.keys(this.tasksByDay).length === 0) {
      this.tasksByDay = this.generateMockTasks(this.days);
    }

    // Copia immutabile nello signal
    const copy: Record<string, KidTask[]> = {};
    for (const d of this.days) copy[d] = [...(this.tasksByDay[d] || [])];
    this.lists.set(copy);
  }

  // Generatore di mock: 2–3 task per giorno, 30–60 minuti
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
          color: ['primary', 'success', 'warning', 'tertiary'][i % 4], // opzionale, a seconda del tuo KidTaskCard
          start: start.toISOString(),
          end: end.toISOString(),
          // aggiungi qui altri campi che il tuo KidTask richiede
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
}
