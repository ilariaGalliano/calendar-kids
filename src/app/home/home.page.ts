import { Component, OnInit, OnDestroy, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
import { PointsAnimationComponent } from '../components/points-animation/points-animation.component';
import { ChildRewardsComponent } from '../components/child-rewards/child-rewards.component';

import { CalendarService } from '../services/calendar.service';
import { FamilyService } from '../services/family.service';

import { Family, Child, ChildTask } from '../models/family.models';
import { environment } from '../../environments/environment';

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
  icon: string;
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

  private generateDemoDay(date: string, children: Child[]): ChildTask[] {
    const activities = [
      { icon: "📚", name: "Lettura" },
      { icon: "🎨", name: "Disegno" },
      { icon: "🏃‍♂️", name: "Esercizio" },
      { icon: "🧠", name: "Matematica" },
      { icon: "🎵", name: "Musica" },
      { icon: "🧩", name: "Puzzle" },
      { icon: "🍝", name: "Cena" },
      { icon: "🚿", name: "Igiene personale" },
      { icon: "🧹", name: "Riordina la cameretta" },
      { icon: "🍎", name: "Merenda" }
    ];

    const tasks: ChildTask[] = [];

    children.forEach((child, index) => {
      const count = 2 + Math.floor(Math.random() * 3); // 2–4 attività

      for (let i = 0; i < count; i++) {
        const startHour = 8 + i * 2;
        const start = new Date(date);
        start.setHours(startHour, 0, 0);

        const end = new Date(start.getTime() + 60 * 60 * 1000);

        tasks.push({
          id: `${child.id}-${date}-${i}`,
          childId: child.id,
          title: activities[(index + i) % activities.length].name,
          description: `Attività per ${child.name}`,
          color: this.getChildColor(child.id),
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          completed: Math.random() > 0.75,
          icon: activities[(index + i) % activities.length].icon,
        });
      }
    });

    return tasks;
  }

  private generateDemoWeek(children: Child[]) {
    const result: { [day: string]: ChildTask[] } = {};
    const days = this.getWeekDates();

    days.forEach(day => {
      result[day] = this.generateDemoDay(day, children);
    });

    return result;
  }



  // UI state
  sidebarExpanded = signal<boolean>(false);
  isSidebarOpen = computed(() => this.sidebarExpanded());

  // Data
  days = this.getWeekDates(); // Cambiamo per usare date reali

  // Colors for children
  private childColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726', '#66BB6A', '#AB47BC', '#F48FB1', '#81C784'];

  // ngOnInit() {
  //   if (environment.useMockApi) {
  //     console.log("🟩 FE Mock Mode active");

  //     // load or create demo family
  //     const saved = localStorage.getItem('calendarKids_family');
  //     if (saved) {
  //       this.activeFamily.set(JSON.parse(saved));
  //     }

  //     const family = this.activeFamily();
  //     if (!family) {
  //       console.error("❌ No family found");
  //       return;
  //     }

  //     // generate mock weekly tasks
  //     this.tasksByDay.set(this.generateMockWeek());

  //     // define visible week days
  //     this.days = this.getWeekDates();

  //     this.loading.set(false);
  //     return;
  //   }

  //   // normal BE mode (unused)
  //   this.loadTasks();
  // }

  ngOnInit() {
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
    if (environment.useMockApi) {
      console.log("(solo FE)");

      // Se esiste famiglia salvata, caricala
      const savedFamily = localStorage.getItem('calendarKids_family');
      if (savedFamily) {
        this.activeFamily.set(JSON.parse(savedFamily));
      }

      // Altrimenti crea una demo family
      if (!this.activeFamily()) {
        this.activeFamily.set({
          id: "demo-family",
          parentName: "Lorena",
          createdAt: new Date(),
          children: [
            { id: "kid1", name: "Sofia", avatar: "🧚‍♀️", point: 0, age: 8, sex: "female", createdAt: new Date(), tasks: [], view: 'teen' },
            { id: "kid2", name: "Marco", avatar: "🤴", point: 0, age: 6, sex: "male", createdAt: new Date(), tasks: [], view: 'child' },
            { id: "kid3", name: "Emma", avatar: "🦸‍♀️", point: 0, age: 3, sex: "female", createdAt: new Date(), tasks: [], view: 'child' }
          ]
        });
      }

      const family = this.activeFamily();

      // 1️Genera settimana mock
      const weekTasksRaw = family ? this.generateDemoWeek(family.children) : {};

      // 2️Converte ChildTask[] in TaskInstance[]
      const weekTasks: DayTasks = {};
      for (const [day, childTasks] of Object.entries(weekTasksRaw)) {
        weekTasks[day] = childTasks.map(childTask => ({
          id: childTask.id,
          instanceId: childTask.id, // or generate a unique instanceId if needed
          title: childTask.title,
          color: childTask.color,
          start: childTask.startTime,
          end: childTask.endTime,
          done: childTask.completed ?? false,
          doneAt: null,
          description: childTask.description,
          childId: childTask.childId,
          childName: family && family.children ? family.children.find(c => c.id === childTask.childId)?.name ?? '' : '',
          icon: childTask.icon ?? ''
        }));
      }

      // 3️Salva nel signal
      this.tasksByDay.set(weekTasks);

      // 3️Calcola i giorni da mostrare
      this.days = this.getWeekDates();

      this.loading.set(false);
      return;
    }

    // modalità API (non usata)
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

      try {
        // Carica i dati dalla vista corrente
        const currentView = this.currentCalendarView();

        if (currentView === 'now') {
          await this.loadCurrentTimeWindow(family.id);
        } else if (currentView === 'day') {
          const today = new Date().toISOString().slice(0, 10);
          await this.loadDayCalendar(family.id, today);
        } else {
          await this.loadWeekCalendar(family.id);
        }

        return;

      } catch (beError) {
        console.warn('⚠️ BE non disponibile, utilizzo mock:', beError);
        // Se il BE fallisce, usa i mock come fallback
      }

      const weekTasks: DayTasks = {};
      const weekDates = this.getWeekDates();

      weekDates.forEach((dateStr) => {
        const date = new Date(dateStr);
        weekTasks[dateStr] = this.generateMockTasksForDate(date, family);
      });

      this.tasksByDay.set(weekTasks);
      console.log('✅ Dati mock caricati');

    } catch (err) {
      this.error.set('Errore nel caricamento delle attività');
      console.error('Error loading tasks:', err);
    } finally {
      this.loading.set(false);
    }
  }

  private generateMockTasksForDate(date: Date, family: Family): TaskInstance[] {
    const tasks: TaskInstance[] = [];
    const activities = [
      { name: 'Lettura', icon: '📚', duration: 0.5, timeSlot: 'morning' },
      { name: 'Disegno', icon: '🎨', duration: 1, timeSlot: 'afternoon' },
      { name: 'Esercizio', icon: '🏃‍♂️', duration: 1, timeSlot: 'morning' },
      { name: 'Matematica', icon: '🧠', duration: 1.5, timeSlot: 'morning' },
      { name: 'Musica', icon: '🎵', duration: 1, timeSlot: 'afternoon' },
      { name: 'Giardinaggio', icon: '🌱', duration: 0.5, timeSlot: 'afternoon' },
      { name: 'Cucinare', icon: '🍳', duration: 1, timeSlot: 'afternoon' },
      { name: 'Pulizie', icon: '🧹', duration: 0.5, timeSlot: 'morning' },
      { name: 'Compiti', icon: '📖', duration: 2, timeSlot: 'afternoon' },
      { name: 'Tempo libero', icon: '🎮', duration: 1, timeSlot: 'evening' },
      { name: 'Igiene personale', icon: '🚿', duration: 0.5, timeSlot: 'morning' },
      { name: 'Sistemare camera', icon: '🛏️', duration: 0.5, timeSlot: 'morning' },
      { name: 'Gioco creativo', icon: '🎪', duration: 1, timeSlot: 'afternoon' },
      { name: 'Tempo schermo', icon: '📱', duration: 1, timeSlot: 'evening' },
      { name: 'Sport', icon: '🏀', duration: 1.5, timeSlot: 'afternoon' },
      { name: 'Puzzle', icon: '🧩', duration: 0.5, timeSlot: 'afternoon' }
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
          childName: child.name,
          icon: activity.icon
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

    const family = this.currentFamily();
    if (!family) {
      console.warn('❌ Nessuna famiglia attiva per caricare i dati');
      return;
    }

    // Carica i dati specifici per la nuova vista
    if (newView === 'now') {
      console.log('📅 Caricamento vista "Ora corrente"');
      this.loadCurrentTimeWindow(family.id);
    } else if (newView === 'day' && event.date) {
      console.log('📅 Caricamento vista giorno per:', event.date);
      this.loadDayCalendar(family.id, event.date);
    } else {
      console.log('📅 Caricamento vista settimana');
      this.loadWeekCalendar(family.id);
    }
  }

  onViewSelectorChange(event: any) {
    const newView = event.detail.value as 'day' | 'week' | 'now';
    console.log('🎯 Vista selezionata dal selettore:', newView);
    this.currentCalendarView.set(newView);
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
      groupedTasks   // ⬅️ questa è l’array che userà il template NOW
    };
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

  // logout() {
  //   // this.auth.logout();
  //   this.router.navigate(['/login']);
  // }

  // Metodi per caricare dati dal BE
  async loadWeekCalendar(householdId: string) {
    this.loading.set(true);
    this.error.set(null);

    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const tasksByDay = await this.calendarService.loadWeekCalendar(householdId, todayStr);

      if (tasksByDay) {
        // Converte KidTask[] in TaskInstance[]
        const convertedTasks: DayTasks = {};
        const family = this.currentFamily();

        for (const [day, kidTasks] of Object.entries(tasksByDay)) {
          convertedTasks[day] = kidTasks.map(kidTask => this.convertKidTaskToTaskInstance(kidTask, family));
        }

        this.tasksByDay.set(convertedTasks);
        // Genera i giorni della settimana
        this.days = this.calendarService.generateWeekDays();
        console.log('✅ Calendario settimanale caricato dal BE:', convertedTasks);
      }
    } catch (error) {
      console.error('❌ Errore caricamento calendario settimanale:', error);
      this.error.set('Errore nel caricamento del calendario');
    } finally {
      this.loading.set(false);
    }
  }

  async loadDayCalendar(householdId: string, date: string) {
    this.loading.set(true);
    this.error.set(null);

    try {
      if (environment.useMockApi) {
        const family = this.activeFamily();
        if (!family) {
          this.error.set('Nessuna famiglia mock trovata');
          this.loading.set(false);
          return;
        }
        const activities = [
          "📚 Lettura",
          "🎨 Disegno",
          "🏃‍♂️ Esercizio",
          "🧠 Matematica",
          "🎵 Musica",
          "🧩 Puzzle",
          "🍝 Cena",
          "🚿 Igiene personale",
          "🧹 Riordina la cameretta",
          "🍎 Merenda"
        ];
        const tasks: TaskInstance[] = [];
        family.children.forEach((child, childIndex) => {
          activities.forEach((title, i) => {
            const startHour = 8 + i;
            const start = new Date(date);
            start.setHours(startHour, 0, 0);
            const end = new Date(start.getTime() + 60 * 60 * 1000);
            tasks.push({
              id: `${child.id}-${date}-${i}`,
              instanceId: `${child.id}-${date}-${i}`,
              title,
              color: this.childColors[childIndex % this.childColors.length],
              start: start.toISOString(),
              end: end.toISOString(),
              done: false,
              doneAt: null,
              description: `Attività per ${child.name}`,
              childId: child.id,
              childName: child.name,
              icon: ''
            });
          });
        });
        const dayTasks = { [date]: tasks };
        this.tasksByDay.set(dayTasks);
        this.days = [date];
        console.log('✅ Calendario giornaliero mock FE:', dayTasks);
        this.loading.set(false);
        return;
      }
      // BE mode
      const kidTasks = await this.calendarService.loadDayCalendar(householdId, date);
      if (kidTasks) {
        const family = this.currentFamily();
        const tasks = kidTasks.map(kidTask => this.convertKidTaskToTaskInstance(kidTask, family));
        const dayTasks = { [date]: tasks };
        this.tasksByDay.set(dayTasks);
        this.days = [date];
        console.log('✅ Calendario giornaliero caricato dal BE:', dayTasks);
      }
    } catch (error) {
      console.error('❌ Errore caricamento calendario giornaliero:', error);
      this.error.set('Errore nel caricamento del calendario');
    } finally {
      this.loading.set(false);
    }
  }

  async loadCurrentTimeWindow(householdId: string) {
    this.loading.set(true);
    this.error.set(null);

    try {
      if (environment.useMockApi) {
        const family = this.activeFamily();
        if (!family) {
          this.error.set('Nessuna famiglia mock trovata');
          this.loading.set(false);
          return;
        }
        const activities = [
          "📚 Lettura",
          "🎨 Disegno",
          "🏃‍♂️ Esercizio",
          "🧠 Matematica",
          "🎵 Musica",
          "🧩 Puzzle",
          "🍝 Cena",
          "🚿 Igiene personale",
          "🧹 Riordina la cameretta",
          "🍎 Merenda"
        ];
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const startHour = now.getHours();
        const tasks: TaskInstance[] = [];
        family.children.forEach((child, childIndex) => {
          activities.slice(0, 3).forEach((title, i) => {
            const start = new Date(dateStr);
            start.setHours(startHour + i, 0, 0);
            const end = new Date(start.getTime() + 60 * 60 * 1000);
            tasks.push({
              id: `${child.id}-now-${i}`,
              instanceId: `${child.id}-now-${i}`,
              title,
              color: this.childColors[childIndex % this.childColors.length],
              start: start.toISOString(),
              end: end.toISOString(),
              done: false,
              doneAt: null,
              description: `Attività per ${child.name}`,
              childId: child.id,
              childName: child.name,
              icon: ''
            });
          });
        });
        this.timeWindowData = {
          currentTime: now.toISOString(),
          currentDate: dateStr,
          timeWindow: {
            start: new Date(now.setMinutes(0, 0, 0)).toISOString(),
            end: new Date(now.setHours(now.getHours() + 2)).toISOString()
          },
          tasks,
          summary: {
            total: tasks.length,
            current: tasks.length,
            completed: 0,
            pending: tasks.length,
            upcoming: 0
          }
        };
        console.log('✅ Vista "Ora corrente" mock FE:', this.timeWindowData);
        this.loading.set(false);
        return;
      }
      // BE mode
      const timeWindowData = await this.calendarService.loadCurrentTimeWindow(householdId);

      if (timeWindowData) {
        // Per la vista "now" non usiamo tasksByDay ma passiamo i dati direttamente al calendario
        this.timeWindowData = timeWindowData;
        console.log('✅ Vista "Ora corrente" caricata dal BE:', timeWindowData);
      }
    } catch (error) {
      console.error('❌ Errore caricamento vista "Ora corrente":', error);
      this.error.set('Errore nel caricamento della vista corrente');
    } finally {
      this.loading.set(false);
    }
  }

  // Converte KidTask in TaskInstance per compatibilità
  private convertKidTaskToTaskInstance(kidTask: any, family: Family | null): TaskInstance {
    const childId = kidTask.assigneeProfileId || kidTask.childId || 'unknown';
    let childName = 'Bambino';

    if (family) {
      const child = family.children.find((c: Child) => c.id === childId);
      if (child) {
        childName = child.name;
      }
    }

    return {
      id: kidTask.id,
      instanceId: kidTask.instanceId,
      title: kidTask.title,
      color: kidTask.color,
      start: kidTask.start,
      end: kidTask.end,
      done: kidTask.done,
      doneAt: kidTask.doneAt,
      description: kidTask.description,
      childId: childId,
      childName: childName,
      icon: kidTask.icon
    };
  }

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
    console.log(child?.name)
    return child ? child.name : null;

  }
}
