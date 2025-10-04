import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import {
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonContent
} from '@ionic/angular/standalone';
import { CdkDropList, CdkDrag, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { KidTaskCardComponent } from '../kid-task-card/kid-task-card.component';
import { KidTask } from 'src/app/models/kid.models';

@Component({
  selector: 'app-calendar-board',
  standalone: true,
  imports: [
    CommonModule, DatePipe,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonBadge,
    CdkDropList, CdkDrag, KidTaskCardComponent
  ],
  templateUrl: './calendar-board.component.html',
  styleUrls: ['./calendar-board.component.scss']
})
export class CalendarBoardComponent implements OnInit {
  // Input dal componente parent (HomePage)
  @Input() days: string[] = [];
  @Input() tasksByDay: Record<string, KidTask[]> = {};
  @Input() householdId: string = '';

  // Signal interno solo per il drag & drop
  lists = signal<Record<string, KidTask[]>>({});

  ngOnInit() {
    console.log('CalendarBoard initialized with:', {
      days: this.days,
      householdId: this.householdId
    });
  }

  ngOnChanges() {
    // Quando i dati dal parent cambiano, aggiorna il signal interno
    if (this.tasksByDay && Object.keys(this.tasksByDay).length > 0) {
      this.lists.set({ ...this.tasksByDay });
    }
  }

  // Utility methods (manteniamo solo queste)
  getDayEmoji(day: string): string {
    const date = new Date(day);
    const dayOfWeek = date.getDay();
    const emojis = ['😴', '💪', '🎯', '🌟', '🎉', '🎈', '🌈'];
    return emojis[dayOfWeek];
  }

  getTaskCountColor(day: string): string {
    const count = (this.lists()[day] || []).length;
    if (count === 0) return 'medium';
    if (count <= 2) return 'success';
    if (count <= 4) return 'warning';
    return 'danger';
  }

  // Drag & Drop (rimane uguale)
  drop(event: CdkDragDrop<KidTask[]>, targetDay: string) {
    const lists = this.lists();
    const prev = event.previousContainer.data;
    const curr = event.container.data;

    if (event.previousContainer === event.container) {
      moveItemInArray(curr, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(prev, curr, event.previousIndex, event.currentIndex);
    }
    
    this.lists.set({ ...lists });
    console.log('Task spostato:', { targetDay, lists: this.lists() });
  }

  // Gestione completamento task
  onDone(event: { instanceId: string; done: boolean }) {
    console.log('✅ Task completato:', event);
    
    // Trova e aggiorna il task
    const lists = this.lists();
    for (const day in lists) {
      const taskIndex = lists[day].findIndex(task => task.instanceId === event.instanceId);
      if (taskIndex !== -1) {
        lists[day][taskIndex].done = event.done;
        lists[day][taskIndex].doneAt = event.done ? new Date().toISOString() : null;
        this.lists.set({ ...lists });
        break;
      }
    }
  }

  // Rimosse tutte le funzioni di caricamento dati (ora gestite da HomePage):
  // - loadFromBackend()
  // - initializeMockData() 
  // - generateWeekDays()
  // - setListsForCurrentDays()
  // - convertBackendDataToTasksByDay()
  // - useMockData()
  // - generateMockTasks()
}