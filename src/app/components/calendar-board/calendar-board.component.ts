import { Component, Input, Output, EventEmitter, OnInit, OnChanges, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonContent,
  IonButton, IonSegment, IonSegmentButton, IonLabel, IonIcon, IonSpinner
} from '@ionic/angular/standalone';
import {
  CdkDropList, CdkDrag, CdkDragDrop, CdkDragPlaceholder,
  moveItemInArray, transferArrayItem
} from '@angular/cdk/drag-drop';
import { KidTaskCardComponent } from '../kid-task-card/kid-task-card.component';
import { KidTask } from 'src/app/models/kid.models';
import { addIcons } from 'ionicons';
import {
  calendar, today, chevronBack, chevronForward,
  moveOutline, calendarOutline, reorderTwoOutline,
  playCircle, time, checkmarkCircle, timeOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-calendar-board',
  standalone: true,
  imports: [
    CommonModule, DatePipe,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonBadge,
    IonSegment, IonSegmentButton, IonLabel, IonIcon,
    CdkDropList, CdkDrag, KidTaskCardComponent
  ],
  templateUrl: './calendar-board.component.html',
  styleUrls: ['./calendar-board.component.scss']
})
export class CalendarBoardComponent implements OnInit, OnChanges {
  // Input dal componente parent (HomePage)
  @Input() days: string[] = [];
  @Input() tasksByDay: Record<string, KidTask[]> = {};
  @Input() currentViewInput: 'day' | 'week' | 'now' = 'week';
  @Input() timeWindowInput: any | null = null; // per compat, ma NON usiamo il BE
  @Input() activeKidProfile: any | null = null; // profilo bimbo selezionato

  // Output per comunicare con il parent (se vuoi ascoltarlo)
  @Output() taskDone = new EventEmitter<{ instanceId: string; done: boolean }>();
  @Output() viewChanged = new EventEmitter<{ view: 'day' | 'week' | 'now', date?: string }>();

  // Signal per la gestione della vista
  currentView = signal<'day' | 'week' | 'now'>('week');
  currentDate = signal<string>(''); // YYYY-MM-DD

  // Stato interno: mappa giorno -> lista task
  lists = signal<Record<string, KidTask[]>>({});

  ngOnInit() {
    addIcons({
      calendar, today, chevronBack, chevronForward,
      moveOutline, calendarOutline, reorderTwoOutline,
      playCircle, time, checkmarkCircle, timeOutline
    });

    const todayDate = new Date().toISOString().slice(0, 10);
    this.currentDate.set(todayDate);
  }

  ngOnChanges() {
    // Aggiorna lista task quando cambia input
    if (this.tasksByDay && Object.keys(this.tasksByDay).length > 0) {
      this.lists.set({ ...this.tasksByDay });
    }

    // Sincronizza view con il parent
    if (this.currentViewInput && this.currentViewInput !== this.currentView()) {
      this.currentView.set(this.currentViewInput);
    }

    // Se currentDate è vuoto, usiamo il primo giorno disponibile
    if (!this.currentDate() && this.days && this.days.length > 0) {
      this.currentDate.set(this.days[0]);
    }
  }

  // ---------- VIEW / DATE ----------

  onViewChange(event: any) {
    const newView = event.detail.value as 'day' | 'week' | 'now';
    this.currentView.set(newView);

    if (newView === 'day') {
      this.viewChanged.emit({ view: 'day', date: this.currentDate() });
    } else if (newView === 'now') {
      this.viewChanged.emit({ view: 'now' });
    } else {
      this.viewChanged.emit({ view: 'week' });
    }
  }

  getDisplayDays(): string[] {
    if (this.currentView() === 'day') {
      return [this.currentDate()];
    }
    if (this.currentView() === 'now') {
      // la vista NOW usa solo "oggi"
      const today = new Date().toISOString().slice(0, 10);
      return [today];
    }
    return this.days;
  }

  getDateTitle(): string {
    if (this.currentView() === 'day') {
      const date = new Date(this.currentDate());
      return date.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    } else if (this.currentView() === 'now') {
      const today = new Date();
      return `Ora • ${today.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })}`;
    } else {
      if (!this.days || this.days.length === 0) return '';
      const first = new Date(this.days[0]);
      const last = new Date(this.days[this.days.length - 1]);
      return `${first.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} - ${last.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}`;
    }
  }

  // ---------- EMOJI / COLOR ----------

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

  getNowTaskCountColor(): string {
    const total = this.getNowTasks().length;
    if (total === 0) return 'medium';
    if (total <= 3) return 'primary';
    if (total <= 6) return 'warning';
    return 'danger';
  }

  // ---------- DRAG & DROP (semplice) ----------

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
  }

  // ---------- DONE / COMPLETED ----------

  onDone(event: { instanceId: string; done: boolean }) {
    this.taskDone.emit(event);

    const lists = this.lists();
    for (const day in lists) {
      const idx = lists[day].findIndex(t => (t as any).instanceId === event.instanceId);
      if (idx >= 0) {
        (lists[day][idx] as any).done = event.done;
        (lists[day][idx] as any).doneAt = event.done ? new Date().toISOString() : null;
        this.lists.set({ ...lists });
        break;
      }
    }
  }

  // ---------- RAGGRUPPAMENTO PER BAMBINO (GIORNO/SETTIMANA) ----------

  getChildrenWithTasksForDay(day: string): Array<{ id: string; name: string; avatar: string; tasks: any[] }> {
    const tasks = this.lists()[day] || [];
    const childrenMap = new Map<string, { id: string; name: string; avatar: string; tasks: any[] }>();

    tasks.forEach(task => {
      const t: any = task;
      const childId = t.childId || t.assigneeProfileId || 'unknown';
      const childName = t.childName || 'Bambino';
      const childAvatar = this.getChildAvatar(childId);

      if (!childrenMap.has(childId)) {
        childrenMap.set(childId, {
          id: childId,
          name: childName,
          avatar: childAvatar,
          tasks: []
        });
      }

      childrenMap.get(childId)!.tasks.push(task);
    });

    return Array.from(childrenMap.values());
  }

  private getChildAvatar(childId: string): string {
    if (this.activeKidProfile && this.activeKidProfile.id === childId) {
      return this.activeKidProfile.selectedAvatar.emoji;
    }

    const avatars = ['👧', '👦', '👶', '🧒', '👨‍🦱', '👩‍🦱', '🧑‍🦲', '👨‍🦰'];
    const index = childId ? childId.charCodeAt(childId.length - 1) % avatars.length : 0;
    return avatars[index];
  }

  getCompletedTasksForChild(day: string, childId: string): number {
    const tasks = (this.lists()[day] || []).filter(t => {
      const x: any = t;
      return (x.childId === childId || x.assigneeProfileId === childId);
    });
    return tasks.filter((t: any) => t.done).length;
  }

  // ---------- VISTA ORA (solo FE, nessun BE) ----------

  getNowTasks(): any[] {
    const today = new Date().toISOString().slice(0, 10);
    const todayTasks = this.lists()[today] || [];

    const now = new Date();
    const nowMs = now.getTime();

    return todayTasks
      .map((raw: any) => {
        const start = new Date(raw.start);
        const end = new Date(raw.end);

        let timeStatus: 'current' | 'upcoming' | 'completed';
        let minutesFromNow = 0;

        if (raw.done) {
          timeStatus = 'completed';
        } else if (nowMs >= start.getTime() && nowMs <= end.getTime()) {
          timeStatus = 'current';
        } else if (start.getTime() > nowMs) {
          timeStatus = 'upcoming';
          minutesFromNow = Math.round((start.getTime() - nowMs) / 60000);
        } else {
          timeStatus = 'completed';
        }

        return {
          ...raw,
          timeStatus,
          minutesFromNow
        };
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }

  formatMinutes(minutes: number): string {
    if (minutes < 0) {
      return `${Math.abs(minutes)}m fa`;
    } else if (minutes === 0) {
      return 'Ora';
    } else if (minutes < 60) {
      return `tra ${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `tra ${hours}h ${mins}m` : `tra ${hours}h`;
    }
  }

  // ---------- STATS GLOBAL ----------

  getTotalTasksCount(): number {
    const all: KidTask[] = [];
    Object.values(this.lists()).forEach(dayTasks => all.push(...dayTasks));
    return all.length;
  }

  getCompletedTasksCount(): number {
    const all: any[] = [];
    Object.values(this.lists()).forEach(dayTasks => all.push(...dayTasks));
    return all.filter(t => t.done).length;
  }
}
