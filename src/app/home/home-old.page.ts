import { Component, OnInit, signal, ViewChild, AfterViewInit } from '@angular/core';
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
import { KidProfileService } from '../services/kid-profile.service';
import { KidTask } from '../models/kid.models';
import { CurrentTimeWindowData } from '../models/calendar.models';
import { KidProfile } from '../models/avatar.models';
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
export class HomePage implements OnInit, AfterViewInit {
  @ViewChild(CalendarBoardComponent) calendarBoard!: CalendarBoardComponent;
  
  // Signals per gestire lo stato
  days = signal<string[]>([]);
  tasksByDay = signal<Record<string, KidTask[]>>({});
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  currentView = signal<'day' | 'week' | 'now'>('week'); // Aggiunto per sincronizzare la vista
  timeWindowData = signal<CurrentTimeWindowData | null>(null);
  householdId: string | null = null;
  sidebarExpanded = signal<boolean>(true);
  
  // Profile del bambino attivo
  activeKidProfile = signal<KidProfile | null>(null);

  constructor(
    private calendarService: CalendarService,
    private api: ApiService,
    private kidProfileService: KidProfileService
  ) {}

  async ngOnInit() {
    console.log('🏠 HomePage ngOnInit - Inizializzazione...');
    
    // Carica householdId dalle preferenze
    await this.loadHouseholdId();
    
    // Ricarica sempre il profilo bambino (per catturare i cambiamenti)
    this.refreshKidProfile();
    
    // Genera i giorni della settimana
    this.generateWeekDays();
    
    // Carica i dati iniziali
    this.loadInitialData();
    
    console.log('✅ HomePage inizializzata');
  }
  
  private initializeKidProfile() {
    // Carica il profilo attivo una volta sola
    const activeProfile = this.kidProfileService.getActiveKidProfile()();
    this.activeKidProfile.set(activeProfile);
    
    if (activeProfile) {
      console.log('👦 Profilo bambino attivo:', activeProfile.name, activeProfile.selectedAvatar.name);
    } else {
      console.log('� Nessun profilo bambino attivo - modalità genitore');
    }
  }

  ngAfterViewInit() {
    // ViewChild ora è disponibile
    console.log('📱 CalendarBoard component inizializzato:', !!this.calendarBoard);
  }

  private async loadHouseholdId() {
    try {
      const { value } = await Preferences.get({ key: 'householdId' });
      this.householdId = value;
      
      // Fallback per sviluppo (usa l'householdId generato dal backend)
      if (!this.householdId) {
        this.householdId = '6fcd9bea3-d818-46b4-b04b-915b9b231049';
        
      }
    } catch (error) {
      this.householdId = '6fcd9bea3-d818-46b4-b04b-915b9b231049';
    }
  }

  private generateWeekDays() {
    // Utilizza il metodo del CalendarService per generare la settimana
    const weekDays = this.calendarService.generateWeekDays();
    this.days.set(weekDays);
  }

  private async loadInitialData() {
    if (!this.householdId) {
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
      
      const tasksByDay = await this.calendarService.loadWeekCalendar(this.householdId, firstDay);
      
      if (tasksByDay) {
        // Filtra i task per il bambino attivo (se presente)
        const filteredTasks = this.filterTasksForActiveKid(tasksByDay);
        this.tasksByDay.set(filteredTasks);
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
  }

   toggleSidebar() {
    this.sidebarExpanded.update(expanded => !expanded);
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
          break;
        }
      }
    } else {
      console.error('❌ Errore nell\'aggiornamento della task');
    }
  }

  // Gestisce il cambio di vista dal calendario
  async onViewChanged(event: { view: 'day' | 'week' | 'now', date?: string }) {
    if (!this.householdId) {
      console.warn('⚠️ Nessun householdId per cambiare vista');
      return;
    }
    
    // ⭐ IMPORTANTE: Aggiorna subito lo stato della vista
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
      } else if (event.view === 'now') {
        // Carica la vista "Ora Corrente"
        await this.loadCurrentTimeWindow();
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

  // Carica i dati per la vista "Ora Corrente"
  private async loadCurrentTimeWindow() {
    if (!this.householdId) return;

    try {
      const timeWindowData = await this.calendarService.loadCurrentTimeWindow(this.householdId);
      
      if (timeWindowData) {
        console.log('🕘 Vista Ora Corrente caricata:', timeWindowData);
        this.timeWindowData.set(timeWindowData);
      }
      
      // Resettiamo le altre viste dato che questa è una vista speciale
      this.tasksByDay.set({});
      this.days.set([]);
      
    } catch (error) {
      console.error('❌ Errore nel caricamento vista oraria:', error);
      this.error.set('Errore nel caricamento della vista oraria');
    }
  }

  // Metodo per ricaricare i dati (chiamato dal calendario)
  async reload() {
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

  // Filtra i task per il bambino attivo
  private filterTasksForActiveKid(tasksByDay: Record<string, KidTask[]>): Record<string, KidTask[]> {
    const activeProfile = this.activeKidProfile();
    
    // Se non c'è un profilo attivo (modalità genitore), mostra tutti i task
    if (!activeProfile) {
      return tasksByDay;
    }
    
    console.log('🔍 Filtraggio task per bambino:', activeProfile.name);
    
    const filteredTasks: Record<string, KidTask[]> = {};
    
    for (const [day, tasks] of Object.entries(tasksByDay)) {
      // Filtra i task per l'ID del profilo attivo
      // Nota: bisogna mappare il nostro ID locale con quello del backend
      const kidTasks = tasks.filter(task => {
        // Per ora, dato che stiamo usando mock data, filtriamo in base al nome
        // In produzione, dovrebbe utilizzare assigneeProfileId
        const taskAssignee = task.assigneeProfileId;
        
        // Fallback: se non abbiamo assignee info, mostra il task
        if (!taskAssignee) {
          return true;
        }
        
        // Verifica se il task è assegnato al bambino attivo
        // Qui potremmo dover mappare il nome del profilo con l'ID del backend
        return taskAssignee === activeProfile.id;
      });
      
      filteredTasks[day] = kidTasks;
    }
    
    return filteredTasks;
  }
  
  // Getter per il profilo attivo (esposto ai componenti child)
  getActiveKidProfile() {
    return this.activeKidProfile();
  }

  // Metodo per ricaricare il profilo (chiamato dopo login)
  refreshKidProfile() {
    console.log('🔄 Ricaricando profilo bambino...');
    const activeProfile = this.kidProfileService.getActiveKidProfile()();
    this.activeKidProfile.set(activeProfile);
    
    if (activeProfile) {
      console.log('👦 Nuovo profilo attivo:', activeProfile.name, activeProfile.selectedAvatar.name);
      
      // Ricarica anche i task filtrati
      if (this.tasksByDay()) {
        const currentTasks = this.tasksByDay();
        const filteredTasks = this.filterTasksForActiveKid(currentTasks);
        this.tasksByDay.set(filteredTasks);
      }
    }
  }
}