import { Component, OnInit, OnDestroy, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonSegment,
  IonSegmentButton,
  IonLabel
} from '@ionic/angular/standalone';

import { AlertController } from '@ionic/angular';

import { AccountSidebarComponent } from '../features/account-sidebar/account-sidebar.component';
import { CalendarBoardComponent } from '../components/calendar-board/calendar-board.component';

import { CalendarService } from '../services/calendar.service';
import { FamilyService } from '../services/family.service';

import { Family, Child } from '../models/family.models';

// Interfaces
interface TaskInstance {
  id: string;
  instanceId: string;
  title: string;
  color: string;
  start: string; // ISO string for CalendarBoardComponent
  end: string;   // ISO string for CalendarBoardComponent
  done: boolean;
  doneAt?: string | null;
  description?: string;
  childId: string;
  childName: string;
}

interface DayTasks {
  [day: string]: TaskInstance[];
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonText,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    AccountSidebarComponent,
    CalendarBoardComponent
  ]
})
export class HomePage implements OnInit, OnDestroy {
  private calendarService = inject(CalendarService);
  private familyService = inject(FamilyService);
  private router = inject(Router);
  private alertController = inject(AlertController);

  // Signals
  activeFamily = this.familyService.currentFamily;
  selectedChild = signal<Child | null>(null);

  // Computed signals
  currentFamily = computed(() => this.activeFamily());
  currentSelectedChild = computed(() => this.selectedChild());

  // State signals
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  tasksByDay = signal<DayTasks>({});
  currentCalendarView = signal<'day' | 'week' | 'now'>('week'); // Nuovo signal per la vista
  hasTasks = computed(() => {
    const tasks = this.tasksByDay();
    return Object.values(tasks).some(dayTasks => dayTasks.length > 0);
  });

  // UI state
  sidebarExpanded = signal<boolean>(false);
  isSidebarOpen = computed(() => this.sidebarExpanded());

  // Data
  days = this.getWeekDates(); // Cambiamo per usare date reali

  // Colors for children
  private childColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726', '#66BB6A', '#AB47BC', '#F48FB1', '#81C784'];

  ngOnInit() {
    this.loadFamily();
    this.loadTasks();
  }

  ngOnDestroy() {
    // Clean up subscriptions if any
  }

  private async loadFamily() {
    try {
      const family = this.familyService.getCurrentFamily();
      if (!family) {
        console.log('❌ Nessuna famiglia trovata, ma questo non dovrebbe accadere perché abbiamo la famiglia di esempio');
        // Non reindirizzare più automaticamente al login
        // this.goToLogin();
        return;
      }
      console.log('✅ Famiglia caricata:', family);
    } catch (err) {
      console.error('Error loading family:', err);
      this.error.set('Errore nel caricamento della famiglia');
    }
  }

  private async loadTasks() {
    try {
      this.loading.set(true);
      this.error.set(null);

      const family = this.activeFamily();
      if (!family) {
        this.tasksByDay.set({});
        this.loading.set(false);
        return;
      }

      // Generate tasks for each day of the week using date strings
      const weekTasks: DayTasks = {};
      const weekDates = this.getWeekDates();

      weekDates.forEach((dateStr) => {
        const date = new Date(dateStr);
        weekTasks[dateStr] = this.generateMockTasksForDate(date, family);
      });

      this.tasksByDay.set(weekTasks);
      this.loading.set(false);
    } catch (err) {
      this.error.set('Errore nel caricamento delle attività');
      this.loading.set(false);
      console.error('Error loading tasks:', err);
    }
  }

  private generateMockTasksForDate(date: Date, family: Family): TaskInstance[] {
    const tasks: TaskInstance[] = [];

    const activities = [
      { name: '📚 Lettura', duration: 0.5, timeSlot: 'morning' },
      { name: '🎨 Disegno', duration: 1, timeSlot: 'afternoon' },
      { name: '🏃‍♂️ Esercizio', duration: 1, timeSlot: 'morning' },
      { name: '🧠 Matematica', duration: 1.5, timeSlot: 'morning' },
      { name: '🎵 Musica', duration: 1, timeSlot: 'afternoon' },
      { name: '🌱 Giardinaggio', duration: 0.5, timeSlot: 'afternoon' },
      { name: '🍳 Cucinare', duration: 1, timeSlot: 'afternoon' },
      { name: '🧹 Pulizie', duration: 0.5, timeSlot: 'morning' },
      { name: '📖 Compiti', duration: 2, timeSlot: 'afternoon' },
      { name: '🎮 Tempo libero', duration: 1, timeSlot: 'evening' },
      { name: '🚿 Igiene personale', duration: 0.5, timeSlot: 'morning' },
      { name: '🛏️ Sistemare camera', duration: 0.5, timeSlot: 'morning' },
      { name: '🎪 Gioco creativo', duration: 1, timeSlot: 'afternoon' },
      { name: '📱 Tempo schermo', duration: 1, timeSlot: 'evening' },
      { name: '🏀 Sport', duration: 1.5, timeSlot: 'afternoon' },
      { name: '🧩 Puzzle', duration: 0.5, timeSlot: 'afternoon' }
    ];

    // Generate tasks for each child (una sola forEach, quella giusta)
    (family.children as Child[]).forEach((child: Child, childIndex: number) => {
      // Number of tasks per child (2-4 per day)
      const numTasks = Math.floor(Math.random() * 3) + 2;

      const selectedActivities = this.shuffleArray([...activities]).slice(0, numTasks);

      selectedActivities.forEach((activity, taskIndex) => {
        // Calculate start time based on time slot
        const startHour = this.getTimeSlotStartHour(activity.timeSlot) + (taskIndex * 0.5);
        const start = new Date(date);
        start.setHours(Math.floor(startHour));
        start.setMinutes((startHour % 1) * 60);

        const end = new Date(start);
        end.setHours(start.getHours() + Math.floor(activity.duration));
        end.setMinutes(
          start.getMinutes() + ((activity.duration % 1) * 60)
        );

        const taskId = `${child.id}-${date.getTime()}-${taskIndex}`;

        tasks.push({
          id: taskId,
          instanceId: taskId,
          title: activity.name,
          color: this.childColors[childIndex % this.childColors.length],
          start: start.toISOString(),
          end: end.toISOString(),
          done: Math.random() > 0.7, // 30% chance of being completed
          doneAt: Math.random() > 0.7 ? new Date().toISOString() : null,
          description: `Attività per ${child.name}`,
          childId: child.id,
          childName: child.name
        });
      });
    });

    return tasks.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }

  private getTimeSlotStartHour(timeSlot: string): number {
    switch (timeSlot) {
      case 'morning': return 8;
      case 'afternoon': return 14;
      case 'evening': return 19;
      default: return 14;
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getDayDate(dayName: string): Date {
    // Non più necessario ma lo manteniamo per compatibilità
    return new Date(dayName);
  }

  getChildColor(childId: string): string {
    const family = this.currentFamily();
    if (!family) {
      return '#FF6B6B';
    }

    const childIndex = (family.children as Child[]).findIndex(child => child.id === childId);
    return childIndex >= 0 ? this.childColors[childIndex % this.childColors.length] : '#FF6B6B';
  }

  getTotalTasksForChild(childId: string): number {
    const tasks = this.tasksByDay();
    let total = 0;

    Object.values(tasks).forEach(dayTasks => {
      total += dayTasks.filter(task => task.childId === childId).length;
    });

    return total;
  }

  selectChild(childId: string | null) {
    if (childId === null) {
      this.selectedChild.set(null);
    } else {
      const family = this.activeFamily();
      if (family) {
        const child = (family.children as Child[]).find((c: Child) => c.id === childId);
        this.selectedChild.set(child || null);
      }
    }
  }

  getTasksForDay(day: string): TaskInstance[] {
    const tasks = this.tasksByDay();
    return tasks[day] || [];
  }

  toggleSidebar() {
    this.sidebarExpanded.update(expanded => !expanded);
  }

  closeSidebar() {
    this.sidebarExpanded.set(false);
  }

  onTaskDone(event: { instanceId: string; done: boolean }) {
    const currentTasks = this.tasksByDay();
    const updatedTasks: DayTasks = { ...currentTasks };

    // Find and update the task
    Object.keys(updatedTasks).forEach(day => {
      const dayTasks = updatedTasks[day];
      const taskIndex = dayTasks.findIndex(t => t.instanceId === event.instanceId);

      if (taskIndex >= 0) {
        dayTasks[taskIndex] = { ...dayTasks[taskIndex], done: event.done };
      }
    });

    this.tasksByDay.set(updatedTasks);
  }

  reload() {
    this.error.set(null);
    this.loadTasks();
  }

  regenerateActivities() {
    console.log('🔄 Rigenerazione attività...');
    this.familyService.regenerateExampleFamily();
    this.loadTasks();
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Conferma',
      message: 'Sei sicuro di voler uscire?',
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel'
        },
        {
          text: 'Esci',
          handler: () => {
            this.familyService.clearFamily();
            this.goToLogin();
          }
        }
      ]
    });

    await alert.present();
  }

  // Metodi per CalendarBoardComponent
  getWeekDates(): string[] {
    const dates = [];
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      dates.push(currentDate.toISOString().slice(0, 10)); // YYYY-MM-DD format
    }

    return dates;
  }

  getActiveKidProfile() {
    const selected = this.currentSelectedChild();
    if (!selected) return null;

    // Convertiamo il bambino nel formato richiesto da CalendarBoardComponent
    return {
      id: selected.id,
      name: selected.name,
      selectedAvatar: {
        emoji: selected.avatar,
        name: 'Avatar',
        palette: {
          name: 'Default',
          gradient: this.getChildColor(selected.id),
          accent: this.getChildColor(selected.id)
        }
      }
    };
  }

  onViewChanged(event: { view: string, date?: string }) {
    console.log('🔄 Vista cambiata:', event);
    
    // Aggiorna la vista corrente
    const newView = event.view as 'day' | 'week' | 'now';
    this.currentCalendarView.set(newView);
    
    // Se necessario, ricarica i dati per la nuova vista
    if (newView === 'now') {
      // Per la vista "now" potresti voler caricare dati specifici
      console.log('📅 Caricamento vista "Ora corrente"');
    } else if (newView === 'day' && event.date) {
      // Per la vista giorno con data specifica
      console.log('📅 Caricamento vista giorno per:', event.date);
    } else {
      // Per la vista settimana
      console.log('📅 Caricamento vista settimana');
    }
  }

  onViewSelectorChange(event: any) {
    const newView = event.detail.value as 'day' | 'week' | 'now';
    console.log('🎯 Vista selezionata dal selettore:', newView);
    this.currentCalendarView.set(newView);
  }

  onDateChanged(event: { direction: 'prev' | 'next' }) {
    console.log('Date changed:', event);
    // Aggiorna le date se necessario
    if (event.direction === 'prev') {
      // Sposta alla settimana precedente
    } else {
      // Sposta alla settimana successiva
    }
  }
}
