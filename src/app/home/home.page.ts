import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonButton,
  IonContent 
} from '@ionic/angular/standalone';
import { CalendarBoardComponent } from '../components/calendar-board/calendar-board.component';
import { AccountSidebarComponent } from '../features/account-sidebar/account-sidebar.component';
import { SchedulerService } from '../services/scheduler.service';
import { ApiService } from '../common/api.service';
import { KidTask } from '../models/kid.models';
import { Preferences } from '@capacitor/preferences';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    CalendarBoardComponent,
    AccountSidebarComponent
  ],
})
export class HomePage implements OnInit {
  // Signals per gestire lo stato
  days = signal<string[]>([]);
  tasksByDay = signal<Record<string, KidTask[]>>({});
  loading = signal<boolean>(false);
  householdId: string | null = null;
  sidebarExpanded = signal<boolean>(true);

  constructor(
    private scheduler: SchedulerService,
    private api: ApiService
  ) {}

  async ngOnInit() {
    console.log('HomePage inizializzata');
    
    // Carica householdId dalle preferenze
    await this.loadHouseholdId();
    
    // Genera i giorni della settimana
    this.generateWeekDays();
    
    // Carica i dati iniziali
    this.loadInitialData();
  }

  private async loadHouseholdId() {
    try {
      const { value } = await Preferences.get({ key: 'householdId' });
      this.householdId = value;
      
      // Fallback per sviluppo
      if (!this.householdId) {
        this.householdId = '67d0ac6a-ee3e-4c3b-b570-3d53d7f0e1f5';
        console.log('Usando householdId di fallback:', this.householdId);
      }
    } catch (error) {
      console.error('Errore nel caricamento householdId:', error);
      this.householdId = '67d0ac6a-ee3e-4c3b-b570-3d53d7f0e1f5';
    }
  }

  private generateWeekDays() {
    const today = new Date();
    const weekDays: string[] = [];
    
    // Genera 7 giorni partendo da oggi
    for (let i = 0; i < 7; i++) {
      const date = new Date(today.getTime() + i * 86400000);
      weekDays.push(date.toISOString().slice(0, 10));
    }
    
    this.days.set(weekDays);
    console.log('Giorni generati:', weekDays);
  }

  private loadInitialData() {
    if (!this.householdId) {
      console.warn('Nessun householdId disponibile, caricamento dati saltato');
      return;
    }

    this.loading.set(true);
    
    const days = this.days();
    const fromDate = days[0];
    const toDate = days[days.length - 1];
    
    console.log('Caricamento dati dal', fromDate, 'al', toDate);

    // Carica i dati tramite il servizio scheduler
    this.scheduler.loadRange(this.householdId, fromDate, toDate);
    
    // Simula il caricamento per ora
    setTimeout(() => {
      this.loadMockData();
      this.loading.set(false);
    }, 1000);
  }

  private loadMockData() {
    const mockTasks: Record<string, KidTask[]> = {};
    const taskTemplates = [
      { title: '🍎 Colazione', color: '#FFB84D' },
      { title: '📚 Compiti', color: '#7ED8A4' },
      { title: '🎮 Gioco libero', color: '#FF6B6B' },
      { title: '🛁 Bagno', color: '#4ECDC4' },
      { title: '🦷 Lavare i denti', color: '#45B7D1' },
      { title: '🛏️ Andare a letto', color: '#96CEB4' }
    ];

    for (const day of this.days()) {
      const dailyTasks: KidTask[] = [];
      const taskCount = Math.floor(Math.random() * 4) + 2; // 2-5 task per giorno

      for (let i = 0; i < taskCount; i++) {
        const template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
        const startHour = 8 + (i * 2);
        const endHour = startHour + 1;

        dailyTasks.push({
          id: `${day}-task-${i}`,
          instanceId: `${day}-instance-${i}`,
          title: template.title,
          color: template.color,
          start: `${day}T${startHour.toString().padStart(2, '0')}:00:00.000Z`,
          end: `${day}T${endHour.toString().padStart(2, '0')}:00:00.000Z`,
          done: Math.random() > 0.7, // 30% di possibilità che sia già completato
          doneAt: null
        });
      }

      // Ordina i task per orario di inizio
      dailyTasks.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      mockTasks[day] = dailyTasks;
    }

    this.tasksByDay.set(mockTasks);
    console.log('Dati mock caricati:', mockTasks);
  }

   toggleSidebar() {
    this.sidebarExpanded.update(expanded => !expanded);
    console.log('Sidebar toggled:', this.sidebarExpanded());
  }

  closeSidebar() {
    this.sidebarExpanded.set(false);
  }

  // Metodo per ricaricare i dati (chiamato dal calendario)
  reload() {
    console.log('Ricaricamento dati richiesto');
    this.loadInitialData();
  }

  // Getter per esporre i signals ai componenti child
  getDays() {
    return this.days();
  }

  getTasksByDay() {
    return this.tasksByDay();
  }

  isLoading() {
    return this.loading();
  }
}