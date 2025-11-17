import { Component, OnInit, OnDestroy, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon, IonSpinner,
  IonText, IonCheckbox, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonAlert, AlertController, IonFabButton, IonFab
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';

// Services
import { CalendarService } from '../services/calendar.service';
import { FamilyService } from '../services/family.service';

// Components  
import { CalendarBoardComponent } from '../components/calendar-board/calendar-board.component';
import { AccountSidebarComponent } from '../features/account-sidebar/account-sidebar.component';

// Types
import { Family, Child } from '../models/family.models';onent, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonButton,
  IonContent,
  IonSpinner,
  IonText,
  IonIcon
} from '@ionic/angular/standalone';
import { CalendarService } from '../services/calendar.service';
import { ApiService } from '../common/api.service';
import { FamilyService } from '../services/family.service';
import { Family, Child, DaySchedule, ChildTask } from '../models/family.models';
import { KidTask } from '../models/kid.models';
import { CurrentTimeWindowData } from '../models/calendar.models';
import { Preferences } from '@capacitor/preferences';
import { AccountSidebarComponent } from '../features/account-sidebar/account-sidebar.component';

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
    IonIcon,
    AccountSidebarComponent
  ],
})
export class HomePage implements OnInit {
  
  // Proprietà pubbliche per il template
  public days: string[] = [];
  public tasksByDay: Record<string, KidTask[]> = {};
  public loading = false;
  public error: string | null = null;
  public householdId: string | null = null;
  public sidebarExpanded = false;
  
  // Famiglia e bambini
  public activeFamily: Family | null = null;
  public selectedChild: Child | null = null;

  // Getter per il template
  get hasTasks(): boolean {
    return this.days.length > 0 && Object.keys(this.tasksByDay).length > 0;
  }

  constructor(
    private calendarService: CalendarService,
    private api: ApiService,
    private familyService: FamilyService,
    private router: Router
  ) {}

  async ngOnInit() {
    console.log('🏠 HomePage ngOnInit - Inizializzazione...');
    
    // Carica householdId dalle preferenze
    await this.loadHouseholdId();
    
    // Verifica se c'è una famiglia attiva
    this.initializeFamily();
    
    // Genera i giorni della settimana
    this.generateWeekDays();
    
    // Carica i dati iniziali
    this.loadInitialData();
    
    console.log('✅ HomePage inizializzata');
  }


  private initializeFamily() {
    // Carica la famiglia attiva
    this.activeFamily = this.familyService.getActiveFamily()();
    
    // Se non c'è famiglia, redirige al login
    if (!this.activeFamily) {
      console.log('❌ Nessuna famiglia attiva, redirect al login');
      this.router.navigate(['/login']);
      return;
    }
    
    console.log('👨‍👩‍👧‍👦 Famiglia attiva:', this.activeFamily.parentName, this.activeFamily.children.length, 'bambini');
    
    // Carica il bambino selezionato (se presente)
    this.selectedChild = this.familyService.getSelectedChild()();
  }

  private async loadHouseholdId() {
    try {
      const { value } = await Preferences.get({ key: 'householdId' });
      this.householdId = value;
      
      // Fallback per sviluppo
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
    this.days = weekDays;
  }

  private async loadInitialData() {
    if (!this.activeFamily) {
      this.error = 'Nessuna famiglia attiva';
      return;
    }

    this.loading = true;
    this.error = null;
    
    try {
      // Per ora usiamo i dati mock del FamilyService
      this.loadMockFamilyData();
    } catch (error) {
      console.error('❌ Errore nel caricamento calendario:', error);
      this.error = 'Errore nel caricamento del calendario';
    } finally {
      this.loading = false;
    }
  }

  private loadMockFamilyData() {
    if (!this.activeFamily) return;

    const mockTasks: Record<string, KidTask[]> = {};
    
    // Genera task per ogni giorno della settimana
    for (const day of this.days) {
      const daySchedule = this.familyService.generateMockTasksForDate(day);
      const kidTasks: KidTask[] = [];
      
      // Converte i ChildTask in KidTask per compatibilità con il calendario esistente
      this.activeFamily.children.forEach(child => {
        const childTasks = daySchedule.childrenTasks[child.id] || [];
        
        childTasks.forEach((task) => {
          kidTasks.push({
            id: task.id,
            instanceId: task.id + '_instance',
            title: `${child.name}: ${task.title}`,
            color: task.color,
            start: `${day}T${task.startTime}:00.000Z`,
            end: `${day}T${task.endTime || this.addMinutes(task.startTime, 30)}:00.000Z`,
            done: task.completed,
            doneAt: task.completedAt?.toISOString() || null,
            assigneeProfileId: child.id
          });
        });
      });

      // Ordina per orario
      kidTasks.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      
      // Filtra per bambino selezionato se presente
      const filteredTasks = this.filterTasksForSelectedChild(kidTasks);
      mockTasks[day] = filteredTasks;
    }

    this.tasksByDay = mockTasks;
  }

  private addMinutes(timeString: string, minutes: number): string {
    const [hours, mins] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes);
    return date.toTimeString().slice(0, 5);
  }

  private filterTasksForSelectedChild(tasks: KidTask[]): KidTask[] {
    // Se nessun bambino selezionato, mostra tutti
    if (!this.selectedChild) {
      return tasks;
    }
    
    // Filtra solo i task del bambino selezionato
    return tasks.filter(task => task.assigneeProfileId === this.selectedChild?.id);
  }

  // Metodi pubblici per il template
  
  // Metodo per selezionare un bambino
  selectChild(childId: string | null) {
    this.familyService.selectChild(childId);
    
    // Aggiorna lo stato locale
    this.selectedChild = this.familyService.getSelectedChild()();
    
    // Ricarica i task filtrati
    this.loadMockFamilyData();
  }

  toggleSidebar() {
    this.sidebarExpanded = !this.sidebarExpanded;
  }

  closeSidebar() {
    this.sidebarExpanded = false;
  }

  // Gestisce il completamento di una task
  onTaskDone(event: { instanceId: string; done: boolean }) {
    const success = this.familyService.toggleTaskCompletion(event.instanceId, new Date().toISOString().slice(0, 10));

    if (success) {
      // Aggiorna lo stato locale
      for (const day in this.tasksByDay) {
        const taskIndex = this.tasksByDay[day].findIndex((task: KidTask) => task.instanceId === event.instanceId);
        if (taskIndex !== -1) {
          this.tasksByDay[day][taskIndex].done = event.done;
          this.tasksByDay[day][taskIndex].doneAt = event.done ? new Date().toISOString() : null;
          break;
        }
      }
    }
  }

  // Metodo per ricaricare i dati
  reload() {
    this.loadInitialData();
  }

  // Metodo per andare al login
  goToLogin() {
    this.router.navigate(['/login']);
  }

  // Metodo per fare logout
  logout() {
    this.familyService.logout();
    this.router.navigate(['/login']);
  }
}