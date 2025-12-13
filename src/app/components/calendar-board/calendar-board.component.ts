import { Component, Input, Output, EventEmitter, OnInit, OnChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import {
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonContent,
  IonButton, IonSegment, IonSegmentButton, IonLabel, IonIcon,
  IonText
} from '@ionic/angular/standalone';
import { CdkDropList, CdkDrag, CdkDragDrop, CdkDragPlaceholder, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { KidTaskCardComponent } from '../kid-task-card/kid-task-card.component';
import { KidTask } from 'src/app/models/kid.models';
import { CurrentTimeWindowData } from 'src/app/models/calendar.models';
import { addIcons } from 'ionicons';
import { calendar, today, chevronBack, chevronForward, moveOutline, calendarOutline, reorderTwoOutline, playCircle, time, checkmarkCircle, timeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-calendar-board',
  standalone: true,
  imports: [
    CommonModule, DatePipe,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonBadge,
    IonSegment, IonSegmentButton, IonLabel, IonIcon,
    CdkDropList, CdkDrag, CdkDragPlaceholder, KidTaskCardComponent, IonText
  ],
  templateUrl: './calendar-board.component.html',
  styleUrls: ['./calendar-board.component.scss']
})
export class CalendarBoardComponent implements OnInit, OnChanges {
  // Input dal componente parent (HomePage)
  @Input() days: string[] = [];
  @Input() tasksByDay: Record<string, KidTask[]> = {};
  @Input() householdId: string = '';
  @Input() initialView: 'day' | 'week' | 'now' = 'week';
  @Input() currentViewInput: 'day' | 'week' | 'now' = 'week'; // Nuovo input per la vista corrente
  @Input() timeWindowInput: any = null;
  @Input() activeKidProfile: any | null = null; // KidProfile dal parent

  // Output per comunicare con il parent
  @Output() taskDone = new EventEmitter<{ instanceId: string; done: boolean }>();
  @Output() viewChanged = new EventEmitter<{ view: 'day' | 'week' | 'now', date?: string }>();

  // Signal per la gestione della vista
  currentView = signal<'day' | 'week' | 'now'>('week');
  currentDate = signal<string>('');

  // Signal interno solo per il drag & drop
  lists = signal<Record<string, KidTask[]>>({});

  // Signal per la vista "Ora Corrente"
  timeWindowData = signal<any>(null);


  ngOnInit() {
    // Registra le icone
    addIcons({ calendar, today, chevronBack, chevronForward, moveOutline, calendarOutline, reorderTwoOutline, playCircle, time, checkmarkCircle, timeOutline });

    // Imposta la data corrente (oggi)
    const todayDate = new Date().toISOString().slice(0, 10);
    this.currentDate.set(todayDate);
  }

  ngOnChanges() {
    if (this.tasksByDay && Object.keys(this.tasksByDay).length > 0) {
      this.lists.set({ ...this.tasksByDay });
    }
    if (this.currentViewInput && this.currentViewInput !== this.currentView()) {
      this.currentView.set(this.currentViewInput);
    }
    if (this.timeWindowInput) {
      // If tasks are flat, group them by child for now view
      if (this.currentView() === 'now' && Array.isArray(this.timeWindowInput.tasks) && this.timeWindowInput.tasks.length > 0 && !this.timeWindowInput.tasks[0].tasks) {
        // Group tasks by childId
        const groupMap: Record<string, { childId: string, childName: string, tasks: any[] }> = {};
        this.timeWindowInput.tasks.forEach((task: any) => {
          const childId = task.childId ?? 'kid1';
          const childName = task.childName ?? 'Bambino';
          if (!groupMap[childId]) {
            groupMap[childId] = { childId, childName, tasks: [] };
          }
          groupMap[childId].tasks.push(task);
        });
        let grouped = Object.values(groupMap);
        // If a kid is selected, filter to only that kid
        if (this.activeKidProfile && this.activeKidProfile.id) {
          grouped = grouped.filter(k => k.childId === this.activeKidProfile.id);
        }
        this.timeWindowData.set({ ...this.timeWindowInput, tasks: grouped });
      } else {
        this.timeWindowData.set(this.timeWindowInput);
      }
    }
  }

  isParent(): boolean {
    return !!this.activeKidProfile?.isParent;
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

  getNowTaskCountColor(): string {
    const data = this.timeWindowData();
    if (!data) return 'medium';

    const total = data.summary.total;
    const current = data.summary.current;

    if (total === 0) return 'medium';
    if (current > 0) return 'success'; // Verde se ci sono task in corso
    if (total <= 3) return 'primary';   // Blu per poche task 
    return 'warning'; // Arancione per molte task
  }

  // Drag & Drop migliorato per riordino interno
  drop(event: CdkDragDrop<KidTask[]>, targetDay: string) {
    console.log('Drop event:', {
      previousContainer: event.previousContainer.id,
      container: event.container.id,
      sameContainer: event.previousContainer === event.container,
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex,
      targetDay
    });

    const lists = this.lists();
    const prev = event.previousContainer.data;
    const curr = event.container.data;

    if (event.previousContainer === event.container) {
      // Riordino interno nello stesso giorno
      moveItemInArray(curr, event.previousIndex, event.currentIndex);

    } else {
      // Trasferimento tra giorni diversi
      transferArrayItem(prev, curr, event.previousIndex, event.currentIndex);
    }

    // Aggiorna il signal con una nuova referenza dell'oggetto
    this.lists.set({ ...lists });
  }

  // Gestione completamento task
  onDone(event: { instanceId: string; done: boolean }) {
    // Trova il task
    let taskFound: any | null = null;

    const lists = this.lists();
    for (const day in lists) {
      const t = lists[day].find(task => task.instanceId === event.instanceId);
      if (t) {
        taskFound = t;
        break;
      }
    }

    // genitore o task del bambino
    this.taskDone.emit(event);

    // Aggiorna UI locale
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


  // Metodi per la gestione della vista
  onViewChange(event: any) {
    const newView = event.detail.value as 'day' | 'week' | 'now';
    this.currentView.set(newView);

    if (newView === 'day') {
      // Emette evento per caricare solo il giorno corrente
      this.viewChanged.emit({ view: 'day', date: this.currentDate() });
    } else if (newView === 'now') {
      // Emette evento per caricare la vista "Ora Corrente"
      this.viewChanged.emit({ view: 'now' });
    } else {
      // Emette evento per caricare la settimana
      this.viewChanged.emit({ view: 'week' });
    }
  }

  // Getter per i giorni da visualizzare in base alla vista
  getDisplayDays(): string[] {
    if (this.currentView() === 'day') {
      return [this.currentDate()];
    }
    if (this.currentView() === 'now') {
      return []; // La vista "now" non usa giorni
    }
    return this.days;
  }

  // Formatta la data per il titolo
  getDateTitle(): string {
    if (this.currentView() === 'day') {
      const date = new Date(this.currentDate());
      return date.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    } else if (this.currentView() === 'now') {
      return 'Vista Ora Corrente';
    } else {
      const firstDay = new Date(this.days[0]);
      const lastDay = new Date(this.days[this.days.length - 1]);
      return `${firstDay.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} - ${lastDay.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}`;
    }
  }

  // Metodi helper per la vista "Ora Corrente"
  formatCurrentDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
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

  // Nuovi metodi per organizzare le attività per bambino
  getChildrenWithTasksForDay(day: string): Array<{ id: string, name: string, avatar: string, tasks: any[] }> {
    const tasks = this.lists()[day] || [];
    const childrenMap = new Map();

    // Raggruppa le attività per bambino
    tasks.forEach(task => {
      // Estrai l'ID del bambino dall'attività (assumendo che sia in task.childId o task.assigneeProfileId)
      const childId = (task as any).childId || (task as any).assigneeProfileId;
      const childName = (task as any).childName || 'Bambino';
      const childAvatar = this.getChildAvatar(childId);

      if (!childrenMap.has(childId)) {
        childrenMap.set(childId, {
          id: childId,
          name: childName,
          avatar: childAvatar,
          tasks: []
        });
      }

      childrenMap.get(childId).tasks.push(task);
    });

    return Array.from(childrenMap.values());
  }

  /**
   * Returns the list of children with their tasks for the given day, used in week/month views.
   * If a kid is selected, only that kid's activities are shown. Otherwise, all kids with tasks for the day.
   */
  getWeekChildrenForDay(day: string): Array<{ id: string, name: string, avatar: string, tasks: any[] }> {
    const tasks = this.lists()[day] || [];
    const childrenMap = new Map();
    tasks.forEach(task => {
      const childId = (task as any).childId || (task as any).assigneeProfileId;
      const childName = (task as any).childName || 'Bambino';
      const childAvatar = this.getChildAvatar(childId);
      if (!childrenMap.has(childId)) {
        childrenMap.set(childId, {
          id: childId,
          name: childName,
          avatar: childAvatar,
          tasks: []
        });
      }
      childrenMap.get(childId).tasks.push(task);
    });
    let children = Array.from(childrenMap.values());
    // If a kid is selected, filter to only that kid
    if (this.activeKidProfile && this.activeKidProfile.id) {
      children = children.filter(child => child.id === this.activeKidProfile.id);
    }
    return children;
  }

  getChildAvatar(childId: string, gender?: 'male' | 'female'): string {
    // Se abbiamo il profilo attivo del bambino
    if (this.activeKidProfile && this.activeKidProfile.id === childId) {
      return this.activeKidProfile.selectedAvatar.emoji;
    }

    // Avatar separati per genere
    const avatarsMale = [
      '🧒', '👦', '🦸‍♂️', '🧙‍♂️', '🐻', '🐶', '🦊', '🐵', '🐼', '🤠', '🤴', '🧑‍🚀', '🧑‍🎨', '🧑‍🚒'
    ];
    const avatarsFemale = [
      '🧒', '👧', '🦸‍♀️', '🧚‍♀️', '🐱', '🐼', '🐻', '🦊', '🐵', '👸', '🧑‍🎨', '🧑‍🚀', '🧑‍🚒'
    ];

    // Scegli la lista in base al genere, default male
    const avatars = gender === 'female' ? avatarsFemale : avatarsMale;
    const index = childId ? childId.charCodeAt(childId.length - 1) % avatars.length : 0;
    return avatars[index];
  }

  getTasksForChild(day: string, childId: string): any[] {
    const tasks = this.lists()[day] || [];
    return tasks.filter(task =>
      ((task as any).childId === childId) ||
      ((task as any).assigneeProfileId === childId)
    );
  }

  getCompletedTasksForChild(day: string, childId: string): number {
    const tasks = this.getTasksForChild(day, childId);
    return tasks.filter(task => task.done).length;
  }

  // Metodo per aggiornare i dati della vista "Ora Corrente"
  updateTimeWindowData(data: CurrentTimeWindowData | null) {
    this.timeWindowData.set(data);
  }

  // Restituisce l'array di drop lists connessi per permettere il drag tra giorni
  getConnectedDropLists(currentDay: string): string[] {
    if (this.currentView() === 'day') {
      // Per la vista giornaliera con bambini, permetti il trasferimento tra tutti i bambini dello stesso giorno
      // e anche verso gli altri giorni
      const connectedLists: string[] = [];

      // Aggiungi tutte le drop list dei bambini per il giorno corrente
      const children = this.getChildrenWithTasksForDay(currentDay);
      children.forEach(child => {
        connectedLists.push(`drop-list-${currentDay}-${child.id}`);
      });

      // Aggiungi le drop list degli altri giorni (per vista settimana/mese)
      this.getDisplayDays().forEach(day => {
        if (day !== currentDay) {
          connectedLists.push(`drop-list-${day}`);
        }
      });

      return connectedLists;
    } else {
      // Vista normale settimana/mese
      return this.getDisplayDays()
        .map(day => `drop-list-${day}`);
    }
  }

  // Metodi per le statistiche del bambino attivo
  getTotalTasksCount(): number {
    if (this.currentView() === 'now') {
      return this.timeWindowData()?.summary.total || 0;
    }

    const allTasks: KidTask[] = [];
    Object.values(this.lists()).forEach(dayTasks => {
      allTasks.push(...dayTasks);
    });
    return allTasks.length;
  }

  getCompletedTasksCount(): number {
    if (this.currentView() === 'now') {
      return this.timeWindowData()?.summary.completed || 0;
    }

    const allTasks: KidTask[] = [];
    Object.values(this.lists()).forEach(dayTasks => {
      allTasks.push(...dayTasks);
    });
    return allTasks.filter((task: KidTask) => task.done).length;
  }
}