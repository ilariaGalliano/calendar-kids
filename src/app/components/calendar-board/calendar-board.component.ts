import { Component, Input, Output, EventEmitter, OnInit, OnChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import {
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonContent, 
  IonButton, IonSegment, IonSegmentButton, IonLabel, IonIcon, IonHeader, IonToolbar, IonTitle, IonSpinner
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
    IonButton, IonSegment, IonSegmentButton, IonLabel, IonIcon, IonSpinner,
    CdkDropList, CdkDrag, CdkDragPlaceholder, KidTaskCardComponent
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
  @Input() timeWindowInput: CurrentTimeWindowData | null = null;
  @Input() activeKidProfile: any | null = null; // KidProfile dal parent

  // Output per comunicare con il parent
  @Output() taskDone = new EventEmitter<{ instanceId: string; done: boolean }>();
  @Output() viewChanged = new EventEmitter<{ view: 'day' | 'week' | 'now', date?: string }>();
  @Output() dateChanged = new EventEmitter<{ direction: 'prev' | 'next' }>();

  // Signal per la gestione della vista
  currentView = signal<'day' | 'week' | 'now'>('week');
  currentDate = signal<string>('');
  
  // Signal interno solo per il drag & drop
  lists = signal<Record<string, KidTask[]>>({});
  
  // Signal per la vista "Ora Corrente"
  timeWindowData = signal<CurrentTimeWindowData | null>(null);

  ngOnInit() {
    // Registra le icone
    addIcons({ calendar, today, chevronBack, chevronForward, moveOutline, calendarOutline, reorderTwoOutline, playCircle, time, checkmarkCircle, timeOutline });
    
    // Imposta la data corrente (oggi)
    const todayDate = new Date().toISOString().slice(0, 10);
    this.currentDate.set(todayDate);
  }

  ngOnChanges() {
    // Quando i dati dal parent cambiano, aggiorna il signal interno
    if (this.tasksByDay && Object.keys(this.tasksByDay).length > 0) {
      this.lists.set({ ...this.tasksByDay });
    }
    
    // Sincronizza la vista con quella del parent
    if (this.initialView !== this.currentView()) {
      this.currentView.set(this.initialView);
    }
    
    // Aggiorna i dati della vista "Ora Corrente" quando cambiano
    if (this.timeWindowInput) {
      this.timeWindowData.set(this.timeWindowInput);
      console.log('📥 Dati vista oraria ricevuti via Input:', this.timeWindowInput);
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
      console.log('Riordino interno in corso...');
      console.log('Tasks prima:', curr.map(t => t.title));
      
      moveItemInArray(curr, event.previousIndex, event.currentIndex);
      
      console.log('Tasks dopo:', curr.map(t => t.title));
    } else {
      // Trasferimento tra giorni diversi
      console.log('Trasferimento tra giorni...');
      transferArrayItem(prev, curr, event.previousIndex, event.currentIndex);
    }
    
    // Aggiorna il signal con una nuova referenza dell'oggetto
    this.lists.set({ ...lists });
    console.log('Lista aggiornata per', targetDay, ':', lists[targetDay]?.map(t => t.title));
  }

  // Gestione completamento task
  onDone(event: { instanceId: string; done: boolean }) {
    // Emette l'evento al componente parent (HomePage)
    this.taskDone.emit(event);
    
    // Aggiorna lo stato locale per l'UI immediata
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

  // Naviga al giorno precedente/successivo
  navigateDate(direction: 'prev' | 'next') {
    if (this.currentView() === 'day') {
      const current = new Date(this.currentDate());
      const newDate = new Date(current);
      
      if (direction === 'prev') {
        newDate.setDate(current.getDate() - 1);
      } else {
        newDate.setDate(current.getDate() + 1);
      }
      
      const newDateStr = newDate.toISOString().slice(0, 10);
      this.currentDate.set(newDateStr);
      
      // Emette evento al parent per caricare il nuovo giorno
      this.viewChanged.emit({ view: 'day', date: newDateStr });
    } else {
      // Per la vista settimanale, emette evento al parent
      this.dateChanged.emit({ direction });
    }
  }

  // Vai a oggi
  goToToday() {
    const todayDate = new Date().toISOString().slice(0, 10);
    this.currentDate.set(todayDate);
    
    if (this.currentView() === 'day') {
      this.viewChanged.emit({ view: 'day', date: todayDate });
    } else if (this.currentView() === 'now') {
      this.viewChanged.emit({ view: 'now' });
    } else {
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

  // Metodo per aggiornare i dati della vista "Ora Corrente"
  updateTimeWindowData(data: CurrentTimeWindowData | null) {
    this.timeWindowData.set(data);
  }

  // Restituisce l'array di drop lists connessi per permettere il drag tra giorni
  getConnectedDropLists(currentDay: string): string[] {
    return this.getDisplayDays()
      .map(day => `drop-list-${day}`);
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