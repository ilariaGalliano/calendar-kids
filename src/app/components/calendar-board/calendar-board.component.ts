import { Component, Input, Output, EventEmitter, OnInit, OnChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import {
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonContent, 
  IonButton, IonSegment, IonSegmentButton, IonLabel, IonIcon, IonHeader, IonToolbar, IonTitle
} from '@ionic/angular/standalone';
import { CdkDropList, CdkDrag, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { KidTaskCardComponent } from '../kid-task-card/kid-task-card.component';
import { KidTask } from 'src/app/models/kid.models';
import { addIcons } from 'ionicons';
import { calendar, today, chevronBack, chevronForward } from 'ionicons/icons';

@Component({
  selector: 'app-calendar-board',
  standalone: true,
  imports: [
    CommonModule, DatePipe,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonBadge,
    IonButton, IonSegment, IonSegmentButton, IonLabel, IonIcon,
    CdkDropList, CdkDrag, KidTaskCardComponent
  ],
  templateUrl: './calendar-board.component.html',
  styleUrls: ['./calendar-board.component.scss']
})
export class CalendarBoardComponent implements OnInit, OnChanges {
  // Input dal componente parent (HomePage)
  @Input() days: string[] = [];
  @Input() tasksByDay: Record<string, KidTask[]> = {};
  @Input() householdId: string = '';
  @Input() initialView: 'day' | 'week' = 'week';

  // Output per comunicare con il parent
  @Output() taskDone = new EventEmitter<{ instanceId: string; done: boolean }>();
  @Output() viewChanged = new EventEmitter<{ view: 'day' | 'week', date?: string }>();
  @Output() dateChanged = new EventEmitter<{ direction: 'prev' | 'next' }>();

  // Signal per la gestione della vista
  currentView = signal<'day' | 'week'>('week');
  currentDate = signal<string>('');
  
  // Signal interno solo per il drag & drop
  lists = signal<Record<string, KidTask[]>>({});

  ngOnInit() {
    // Registra le icone
    addIcons({ calendar, today, chevronBack, chevronForward });
    
    console.log('CalendarBoard initialized with:', {
      days: this.days,
      householdId: this.householdId
    });

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
      console.log('🔄 Vista sincronizzata con parent:', this.initialView);
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
    console.log('✅ Task completato nel calendario:', event);
    
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
    const newView = event.detail.value as 'day' | 'week';
    this.currentView.set(newView);
    
    if (newView === 'day') {
      // Emette evento per caricare solo il giorno corrente
      this.viewChanged.emit({ view: 'day', date: this.currentDate() });
    } else {
      // Emette evento per caricare la settimana
      this.viewChanged.emit({ view: 'week' });
    }
    
    console.log('📱 Vista cambiata:', newView);
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
    
    console.log('📅 Navigazione:', direction, this.currentDate());
  }

  // Vai a oggi
  goToToday() {
    const todayDate = new Date().toISOString().slice(0, 10);
    this.currentDate.set(todayDate);
    
    if (this.currentView() === 'day') {
      this.viewChanged.emit({ view: 'day', date: todayDate });
    } else {
      this.viewChanged.emit({ view: 'week' });
    }
    
    console.log('🏠 Vai a oggi:', todayDate);
  }

  // Getter per i giorni da visualizzare in base alla vista
  getDisplayDays(): string[] {
    if (this.currentView() === 'day') {
      return [this.currentDate()];
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
    } else {
      const firstDay = new Date(this.days[0]);
      const lastDay = new Date(this.days[this.days.length - 1]);
      return `${firstDay.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} - ${lastDay.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}`;
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