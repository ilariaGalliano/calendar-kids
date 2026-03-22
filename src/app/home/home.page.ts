import { Component, OnInit, OnDestroy, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

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
import { PointsAnimationComponent } from '../components/points-animation/points-animation.component';
import { ChildRewardsComponent } from '../components/child-rewards/child-rewards.component';

import { CalendarService } from '../services/calendar.service';
import { FamilyService } from '../services/family.service';

import { Family, Child } from '../models/family.models';

// Interfaces — allineate alle colonne Supabase
interface TaskInstance {
  id: string;
  instanceId: string;
  title: string;       // activities.name_activity
  color: string;       // calcolato da childIndex (UI only)
  start: string;       // activities.date_start (ISO)
  end: string;         // activities.date_end (ISO)
  done: boolean;       // activities.done
  doneAt?: string | null;
  description?: string | null; // activities.description
  childId: string;     // activities.children_id
  childName: string;   // risolto da children.name
  icon?: string;  // tasks.icon (solo routine activities)
  timer?: number | null; // activities.timer (durata in minuti)
  value?: number | null; // activities.value (punti reward)
  source?: 'routine' | 'activity'; // campo sintetico dal BE
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
    CalendarBoardComponent,
    PointsAnimationComponent,
    ChildRewardsComponent
  ]
})
export class HomePage implements OnInit, OnDestroy {
  private calendarService = inject(CalendarService);
  private familyService = inject(FamilyService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private route = inject(ActivatedRoute)
  // Signals
  activeFamily = this.familyService.getActiveFamily(); // writable signal
  selectedChild = signal<Child | null>(null);
  parentName = signal<string>('');

  // Computed signals
  currentFamily = computed(() => this.activeFamily());
  currentSelectedChild = computed(() => this.selectedChild());

  // Per visualizzazione
  isParent = false;
  selectedChildId?: string;
  selectedChildName?: string | null;

  // State signals
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  tasksByDay = signal<DayTasks>({});
  currentCalendarView = signal<'day' | 'week' | 'now'>('week'); // Nuovo signal per la vista
  timeWindowData: any = null; // Dati per la vista "ora corrente"
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
    // Recupera parentName dal router state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || (window as any).history?.state;
    if (state?.parentName) {
      this.parentName.set(state.parentName);
    }

    this.route.queryParams.subscribe(params => {
      const childId = params['childId'];
      if (childId) {
        this.isParent = false;
        this.selectedChildId = childId;

        this.selectChild(childId);
      } else {
        this.isParent = true;
        this.selectedChildId = undefined;
        this.selectedChild.set(null);
      }

      this.selectedChildName = this.getSelectedChildName();
    });

    // Carica i children dell'utente loggato se non sono già in memory
    this.loadChildrenAndTasks();
  }

  private loadChildrenAndTasks() {
    const family = this.activeFamily();
    
    // Se la family non è caricata, carica i children dal DB
    if (!family || !family.children || family.children.length === 0) {
      this.familyService.fetchChildrenForCurrentUser().subscribe({
        next: (children) => {
          // Crea una family temporanea con i children reali dal DB
          const familyFromDB: Family = {
            id: 'db-family',
            parentName: this.parentName() || 'Famiglia',
            children: children || [],
            createdAt: new Date()
          };
          
          this.activeFamily.set(familyFromDB);
          this.loadTasks();
        },
        error: (err) => {
          console.error('❌ Error loading children from DB:', err);
          this.loading.set(false);
        }
      });
    } else {
      // Family già caricata, aggiorna parentName se ricevuto
      if (this.parentName() && family.parentName !== this.parentName()) {
        this.activeFamily.set({
          ...family,
          parentName: this.parentName()
        });
      }
      // Carica i tasks direttamente
      this.loadTasks();
    }
  }



  ngOnDestroy() {
    // Clean up subscriptions if any
  }


  private async loadTasks() {
    try {
      this.loading.set(true);
      this.error.set(null);

      const family = this.activeFamily();
      if (!family || !family.children || family.children.length === 0) {
        this.tasksByDay.set({});
        this.loading.set(false);
        return;
      }

      const startDate = this.getWeekDates()[0];
      let activities: any[] = [];

      if (this.isParent) {
        activities = await this.calendarService.getActivitiesForMeWeek(startDate).toPromise() ?? [];
      } else if (this.selectedChildId) {
        activities = await this.calendarService.getActivitiesForWeek(this.selectedChildId, startDate).toPromise() ?? [];
      }
      this.tasksByDay.set(this.mapActivitiesToDayTasks(activities, family));

    } catch (err) {
      this.error.set('Errore nel caricamento delle attività');
      console.error('Error loading tasks:', err);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadDayTasks(date: string) {
    try {
      this.loading.set(true);
      this.error.set(null);

      const family = this.activeFamily();
      let activities: any[] = [];

      if (this.isParent) {
        activities = await this.calendarService.getActivitiesForMeDay(date).toPromise() ?? [];
      } else if (this.selectedChildId) {
        activities = await this.calendarService.getActivitiesForDay(this.selectedChildId, date).toPromise() ?? [];
      }

      this.tasksByDay.set(this.mapActivitiesToDayTasks(activities, family));
      this.days = [date];

    } catch (err) {
      this.error.set('Errore nel caricamento del giorno');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadNowTasks() {
    try {
      this.loading.set(true);
      this.error.set(null);

      const family = this.activeFamily();
      let activities: any[] = [];

      if (this.isParent) {
        activities = await this.calendarService.getActivitiesForMeNow().toPromise() ?? [];
      } else if (this.selectedChildId) {
        activities = await this.calendarService.getActivitiesForNow(this.selectedChildId).toPromise() ?? [];
      }

      const now = new Date();
      this.timeWindowData = {
        currentTime: now.toISOString(),
        currentDate: now.toISOString().slice(0, 10),
        tasks: activities.map(a => {
          const childId = a.children_id ?? this.selectedChildId ?? '';
          const child = (family?.children as Child[] ?? []).find(c => c.id === childId);
          return {
            id: String(a.id),
            instanceId: String(a.id),
            title: a.name_activity,
            color: this.getChildColor(childId),
            start: new Date(a.date_start).toISOString(),
            end: new Date(a.date_end ?? a.date_start).toISOString(),
            done: !!a.done,
            doneAt: null,
            description: a.description ?? null,
            childId,
            childName: child?.name ?? a.child_name ?? 'Bambino',
            icon: a.icon ?? undefined,
            timer: a.timer ?? null,
            value: a.value ?? null,
            source: a.source ?? 'activity',
          };
        }),
      };

    } catch (err) {
      this.error.set('Errore nel caricamento della vista corrente');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  private mapActivitiesToDayTasks(activities: any[], family: Family | null): DayTasks {
    const weekTasks: DayTasks = {};
    activities.forEach((activity: any) => {
      const dateStr = new Date(activity.date_start).toISOString().split('T')[0];
      if (!weekTasks[dateStr]) weekTasks[dateStr] = [];

      const childId = activity.children_id ?? this.selectedChildId ?? '';
      const child = (family?.children as Child[] ?? []).find((c: Child) => c.id === childId);

      weekTasks[dateStr].push({
        id: String(activity.id),
        instanceId: String(activity.id),
        title: activity.name_activity,
        color: this.getChildColor(childId),
        start: new Date(activity.date_start).toISOString(),
        end: new Date(activity.date_end ?? activity.date_start).toISOString(),
        done: !!activity.done,
        doneAt: null,
        description: activity.description ?? null,
        childId,
        childName: child?.name ?? activity.child_name ?? 'Bambino',
        icon: activity.icon ?? undefined,
        timer: activity.timer ?? null,
        value: activity.value ?? null,
        source: activity.source ?? 'activity',
      });
    });
    return weekTasks;
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
    if (!this.isParent && childId !== this.selectedChildId) {
      return;
    }
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

    Object.keys(updatedTasks).forEach(day => {
      const dayTasks = updatedTasks[day];
      const taskIndex = dayTasks.findIndex(t => t.instanceId === event.instanceId);

      if (taskIndex >= 0) {
        // Update task done status
        dayTasks[taskIndex] = { ...dayTasks[taskIndex], done: event.done };

        // Find the child and add points if task is marked done
        if (event.done) {
          const family = this.currentFamily();
          if (family) {
            const child = family.children.find(c => c.id === dayTasks[taskIndex].childId);
            if (child) {
              child.point = (child.point ?? 0) + 10;
            }
          }
        }
      }
    });

    this.tasksByDay.set(updatedTasks);
  }

  reload() {
    this.error.set(null);
    this.loadTasks();
  }

  regenerateActivities() {
    // this.familyService.regenerateExampleFamily();
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
    const newView = event.view as 'day' | 'week' | 'now';
    this.currentCalendarView.set(newView);

    if (newView === 'now') {
      this.loadNowTasks();
    } else if (newView === 'day' && event.date) {
      this.loadDayTasks(event.date);
    } else if (newView === 'week') {
      // Ripristina l'array dei giorni della settimana
      this.days = this.getWeekDates();
      this.loadTasks();
    } else {
      this.loadTasks();
    }
  }

  // Ritorna i task visibili in base al bambino selezionato (Tutti / uno solo)
  getVisibleTasksByDay(): DayTasks {
    const selected = this.currentSelectedChild();
    const all = this.tasksByDay();

    // Nessun bambino selezionato -> mostra tutto
    if (!selected) {
      return all;
    }

    const filtered: DayTasks = {};
    for (const [day, tasks] of Object.entries(all)) {
      const dayFiltered = tasks.filter(t => t.childId === selected.id);
      if (dayFiltered.length > 0) {
        filtered[day] = dayFiltered;
      }
    }

    return filtered;
  }

  // Filtro anche per la vista "now" (timeWindowData)
  getVisibleTimeWindowData(): any {
    const data = this.timeWindowData;
    const selected = this.currentSelectedChild();

    if (!data || !Array.isArray(data.tasks)) return data;

    // 1️⃣ Filtriamo se è selezionato un solo bambino
    const rawTasks = selected
      ? data.tasks.filter((t: any) => t.childId === selected.id)
      : data.tasks;

    // 2️⃣ Raggruppiamo per bambino
    const groupMap: Record<string, { childId: string; childName: string; tasks: any[] }> = {};

    rawTasks.forEach((task: TaskInstance) => {
      const childId = task.childId;
      const childName = task.childName ?? 'Bambino';

      if (!groupMap[childId]) {
        groupMap[childId] = { childId, childName, tasks: [] };
      }

      groupMap[childId].tasks.push(task);
    });

    const groupedTasks = Object.values(groupMap);

    return {
      ...data,
      groupedTasks   // ⬅️ questa è l’array che AppUserà il template NOW
    };
  }



  onDateChanged(event: { direction: 'prev' | 'next' }) {
    // Aggiorna le date se necessario
    if (event.direction === 'prev') {
      // Sposta alla settimana precedente
    } else {
      // Sposta alla settimana successiva
    }
  }

  // logout() {
  //   // this.auth.logout();
  //   this.router.navigate(['/login']);
  // }

  isVisible() {
    return this.isParent;
  }

  goToSettings() {
    this.router.navigate(['/settings']);
  }

  getSelectedChildName(): string | null {
    const family = this.currentFamily();
    if (!family || !this.selectedChildId) return null;
    const child = family.children.find((c: Child) => c.id === this.selectedChildId);
    return child ? child.name : null;

  }
}
