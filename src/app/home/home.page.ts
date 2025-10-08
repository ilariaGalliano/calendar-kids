import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonButton,
  IonContent,
  IonSpinner,
  IonText 
} from '@ionic/angular/standalone';
import { CalendarBoardComponent } from '../components/calendar-board/calendar-board.component';
import { AccountSidebarComponent } from '../features/account-sidebar/account-sidebar.component';
import { CalendarService } from '../services/calendar.service';
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
    IonSpinner,
    IonText,
    CalendarBoardComponent,
    AccountSidebarComponent
  ],
})
export class HomePage implements OnInit {
  // Signals per gestire lo stato
  days = signal<string[]>([]);
  tasksByDay = signal<Record<string, KidTask[]>>({});
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  currentView = signal<'day' | 'week'>('week'); // Aggiunto per sincronizzare la vista
  householdId: string | null = null;
  sidebarExpanded = signal<boolean>(true);

  constructor(
    private calendarService: CalendarService,
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
      
      // Fallback per sviluppo (usa l'householdId generato dal backend)
      if (!this.householdId) {
        this.householdId = 'a6d3faf1-8f56-4ab6-ab78-a87257eb085a';
        console.log('Usando householdId di fallback:', this.householdId);
      }
    } catch (error) {
      console.error('Errore nel caricamento householdId:', error);
      this.householdId = 'a6d3faf1-8f56-4ab6-ab78-a87257eb085a';
    }
  }

  private generateWeekDays() {
    // Utilizza il metodo del CalendarService per generare la settimana
    const weekDays = this.calendarService.generateWeekDays();
    this.days.set(weekDays);
    console.log('📅 Giorni della settimana generati:', weekDays);
  }

  private async loadInitialData() {
    if (!this.householdId) {
      console.warn('⚠️ Nessun householdId disponibile, caricamento dati saltato');
      this.error.set('Household ID non disponibile');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    
    try {
      const days = this.days();
      if (days.length === 0) {
        console.warn('⚠️ Nessun giorno disponibile per il caricamento');
        return;
      }

      // Carica il calendario settimanale dal backend usando il primo giorno
      const firstDay = days[0];
      console.log('🔄 Caricamento calendario settimanale per:', firstDay);
      
      const tasksByDay = await this.calendarService.loadWeekCalendar(this.householdId, firstDay);
      
      if (tasksByDay) {
        this.tasksByDay.set(tasksByDay);
        console.log('✅ Dati calendario caricati con successo');
      } else {
        console.warn('⚠️ Nessun dato ricevuto dal calendario, utilizzo dati mock');
        this.loadMockData();
      }
      
    } catch (error) {
      console.error('❌ Errore nel caricamento calendario:', error);
      this.error.set('Errore nel caricamento del calendario');
      // Fallback ai dati mock in caso di errore
      this.loadMockData();
    } finally {
      this.loading.set(false);
    }
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

  // Gestisce il completamento di una task
  async onTaskDone(event: { instanceId: string; done: boolean }) {
    if (!this.householdId) {
      console.warn('⚠️ Nessun householdId per aggiornare la task');
      return;
    }

    console.log('🔄 Aggiornamento task:', event);
    
    const success = await this.calendarService.markTaskDone(
      this.householdId, 
      event.instanceId, 
      event.done
    );

    if (success) {
      // Aggiorna lo stato locale
      const currentTasks = this.tasksByDay();
      for (const day in currentTasks) {
        const taskIndex = currentTasks[day].findIndex(task => task.instanceId === event.instanceId);
        if (taskIndex !== -1) {
          currentTasks[day][taskIndex].done = event.done;
          currentTasks[day][taskIndex].doneAt = event.done ? new Date().toISOString() : null;
          this.tasksByDay.set({ ...currentTasks });
          console.log('✅ Task aggiornata localmente');
          break;
        }
      }
    } else {
      console.error('❌ Errore nell\'aggiornamento della task');
    }
  }

  // Gestisce il cambio di vista dal calendario
  async onViewChanged(event: { view: 'day' | 'week', date?: string }) {
    if (!this.householdId) {
      console.warn('⚠️ Nessun householdId per cambiare vista');
      return;
    }

    console.log('🔄 Cambio vista:', event);
    
    // Aggiorna subito lo stato della vista
    this.currentView.set(event.view);
    
    this.loading.set(true);
    this.error.set(null);

    try {
      if (event.view === 'day' && event.date) {
        // Carica solo il giorno specifico
        const dayTasks = await this.calendarService.loadDayCalendar(this.householdId, event.date);
        
        if (dayTasks) {
          const tasksByDay: Record<string, KidTask[]> = {};
          tasksByDay[event.date] = dayTasks;
          this.tasksByDay.set(tasksByDay);
          
          // Aggiorna i giorni per mostrare solo quello selezionato
          this.days.set([event.date]);
        } else {
          this.error.set('Errore nel caricamento del giorno');
        }
      } else {
        // Carica la settimana - rigenera i giorni della settimana
        this.generateWeekDays();
        await this.loadWeekData();
      }
    } catch (error) {
      console.error('❌ Errore nel cambio vista:', error);
      this.error.set('Errore nel cambio vista');
    } finally {
      this.loading.set(false);
    }
  }

  // Gestisce la navigazione settimanale
  async onDateChanged(event: { direction: 'prev' | 'next' }) {
    if (!this.householdId) {
      console.warn('⚠️ Nessun householdId per navigare');
      return;
    }

    console.log('🔄 Navigazione settimanale:', event);
    
    // Calcola la nuova settimana
    const currentFirstDay = new Date(this.days()[0]);
    const newFirstDay = new Date(currentFirstDay);
    
    if (event.direction === 'prev') {
      newFirstDay.setDate(currentFirstDay.getDate() - 7);
    } else {
      newFirstDay.setDate(currentFirstDay.getDate() + 7);
    }

    // Genera i nuovi giorni della settimana
    const newWeekDays = this.calendarService.generateWeekDays(newFirstDay);
    this.days.set(newWeekDays);

    // Carica i dati per la nuova settimana
    await this.loadWeekData(newFirstDay.toISOString().slice(0, 10));
  }

  // Carica i dati per una settimana specifica
  private async loadWeekData(startDate?: string) {
    if (!this.householdId) return;

    this.loading.set(true);
    
    try {
      const firstDay = startDate || this.days()[0];
      const tasksByDay = await this.calendarService.loadWeekCalendar(this.householdId, firstDay);
      
      if (tasksByDay) {
        this.tasksByDay.set(tasksByDay);
      } else {
        this.error.set('Errore nel caricamento della settimana');
      }
    } catch (error) {
      console.error('❌ Errore nel caricamento settimana:', error);
      this.error.set('Errore nel caricamento della settimana');
    } finally {
      this.loading.set(false);
    }
  }

  // Metodo per ricaricare i dati (chiamato dal calendario)
  async reload() {
    console.log('🔄 Ricaricamento dati richiesto');
    await this.loadInitialData();
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

  getError() {
    return this.error();
  }
}