import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel,
  IonButton, IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonList, IonToggle,
  IonFab, IonFabButton, IonModal,
  IonSegment, IonSegmentButton, IonBadge, IonAvatar, IonToast,
  ModalController
} from '@ionic/angular/standalone';
import { Routine, Task, TaskPayload } from 'src/app/models/task.models';
import { Child } from 'src/app/models/family.models';
import { AuthService } from '../../common/auth.service';
import { SettingService } from '../../services/setting.service';
import { AddChildModalComponent } from './add-child/add-child.component';
import { CreateRoutineModalComponent } from './create-routine-modal/create-routine-modal.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel,
    IonButton, IonInput, IonTextarea,
    IonList, IonToggle, IonFab, IonFabButton, IonModal, IonSegment, IonSegmentButton, IonAvatar
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  readonly weekDaysOrder: string[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  // Helper properties to track context when adding a task to a routine/day
  addingToRoutine?: Routine;
  addingToDay?: string;
  activeSegment = 'children';
  taskFilter = 'all';

  children = signal<Child[]>([]);
  tasks = signal<Task[]>([]);
  routines = signal<Routine[]>([]);

  showTaskModal = signal(false);
  editingTask = signal<Task | null>(null);

  // Time picker modal state
  showTimePickerModal = signal(false);
  timePickerTask: Task | null = null;
  timePickerDay = '';
  timePickerForm = { startTime: '08:00', endTime: '08:30' };
  private timePickerResolve: ((val: { startTime: string; endTime: string; duration: number } | null) => void) | null = null;

  confirmTimePicker() {
    const { startTime, endTime } = this.timePickerForm;
    const duration = this.calculateDurationFromTimes(startTime, endTime);
    this.timePickerResolve?.({ startTime, endTime, duration });
    this.timePickerResolve = null;
    this.showTimePickerModal.set(false);
  }

  cancelTimePicker() {
    this.timePickerResolve?.(null);
    this.timePickerResolve = null;
    this.showTimePickerModal.set(false);
  }

  taskForm = {
    emoji: '🎯',
    title: '',
    description: '',
    duration: 30,
    reward: 15,
    color: '#4ECDC4',
    startTime: '08:00',
    endTime: '08:30'
  };

  taskColors = [
    '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE'
  ];

  constructor(
    private router: Router,
    private authService: AuthService = inject(AuthService),
    private settingService: SettingService = inject(SettingService),
    private modalCtrl: ModalController
  ) { }

  ngOnInit() {
    // Carica solo i bambini all'inizio
    this.loadChildren();
    
    // Carica i dati della sezione attiva
    this.loadActiveSection();
  }

  private loadActiveSection() {
    switch (this.activeSegment) {
      case 'tasks':
        if (this.tasks().length === 0) {
          this.loadTasks();
        }
        break;
      case 'routines':
        if (this.routines().length === 0) {
          this.loadRoutines();
        }
        break;
    }
  }

  onSegmentChange(event: any) {
    this.activeSegment = event.detail.value;
    this.loadActiveSection();
  }

  loadChildren() {
    this.settingService.getChildren().subscribe(data => this.children.set(data));
  }

  loadTasks() {
    this.settingService.getTasks().subscribe(data => this.tasks.set(data));
  }

  private dayNumberToCode(day: number): string {
    const map: Record<number, string> = {
      0: 'sun',
      1: 'mon',
      2: 'tue',
      3: 'wed',
      4: 'thu',
      5: 'fri',
      6: 'sat'
    };
    return map[day] ?? 'mon';
  }

  private dayCodeToNumber(day: string): number {
    const map: Record<string, number> = {
      'sun': 0,
      'mon': 1,
      'tue': 2,
      'wed': 3,
      'thu': 4,
      'fri': 5,
      'sat': 6
    };
    return map[day] ?? 1;
  }

  private normalizeTasksByDay(tasksByDay: Record<number, any[]>): Record<number, any[]> {
    const result: Record<number, any[]> = {};
    for (const [dayNum, tasks] of Object.entries(tasksByDay)) {
      result[Number(dayNum)] = tasks.map((t: any) => this.normalizeRoutineTask(t));
    }
    return result;
  }

  private normalizeRoutineTask(task: any): Task {
    const id = String(task?.id ?? task?.activity_id ?? crypto.randomUUID());

    return {
      id,
      title: task?.title ?? task?.name_activity ?? task?.name ?? 'Attività',
      emoji: task?.emoji ?? task?.icon ?? (task?.value ? String(task.value) : '🎯'),
      duration: Number(task?.duration ?? task?.timer ?? 5),
      reward: Number(task?.reward ?? task?.value ?? 0),
      color: task?.color ?? '#4ECDC4',
      description: task?.description ?? '',
      isActive: task?.isActive ?? true,
      startTime: task?.startTime ?? null,
      endTime: task?.endTime ?? null,
    } as Task;
  }

  loadRoutines() {
    const children = this.children() ?? [];
    if (!Array.isArray(children) || children.length === 0) {
      this.routines.set([]);
      return;
    }

    const childIds = children.map(child => child.id).filter(Boolean);

    this.settingService.getRoutinesForChildren(childIds).subscribe({
      next: (rows: any[]) => {
        // Transform DB/mock shape to FE shape
        const routinesArr = (rows ?? []).map((r: any) => {
          // Normalize tasksByDay first
          const normalizedTasksByDay = r.tasksByDay ? this.normalizeTasksByDay(r.tasksByDay) : undefined;
          
          // Build days array from tasksByDay keys (which days have tasks)
          let daysArray: string[] = [];
          if (normalizedTasksByDay && Object.keys(normalizedTasksByDay).length > 0) {
            // Get all days that have tasks
            daysArray = Object.keys(normalizedTasksByDay)
              .map(dayNum => this.dayNumberToCode(Number(dayNum)));
          } else if (Array.isArray(r.days) && r.days.length > 0) {
            // Fallback to days field if present
            daysArray = r.days;
          } else {
            // Default to all weekdays if no data
            daysArray = ['mon', 'tue', 'wed', 'thu', 'fri'];
          }
          
          return {
            id: r.id,
            childId: r.child_id ?? r.childId,
            name: r.nametask ?? r.name ?? 'Nuova routine',
            description: r.description,
            days: daysArray,
            tasks: Array.isArray(r.tasks)
              ? r.tasks.map((t: any) => this.normalizeRoutineTask(t))
              : [],
            tasksByDay: normalizedTasksByDay,
            isActive: typeof r.isActive === 'boolean' ? r.isActive : true,
            category: 'custom',
            createdAt: r.created_at ?? r.createdAt
          };
        }) as Routine[];

        this.routines.set(routinesArr);
      },
      error: (err) => {
        console.error('Error loading routines:', err);
        this.routines.set([]);
      }
    });
  }

  getRoutinesForChild(childId: string) {
    return this.routines().filter(r => r.childId === childId);
  }

  getTasksForRoutineDay(routine: Routine, day: string): Task[] {
    // Get day number from day code
    const dayNumber = this.dayCodeToNumber(day);
    
    // Use tasksByDay if available (new structure)
    if (routine.tasksByDay && routine.tasksByDay[dayNumber]) {
      return routine.tasksByDay[dayNumber]
        .filter(t => typeof t !== 'string')
        .map((t: any) => this.normalizeRoutineTask(t));
    }
    
    // No tasks for this day
    return [];
  }

  getDayLabel(day: string) {
    const labels: Record<string, string> = {
      mon: 'Lunedì', tue: 'Martedì', wed: 'Mercoledì', thu: 'Giovedì',
      fri: 'Venerdì', sat: 'Sabato', sun: 'Domenica'
    };
    return labels[day] || day;
  }

  // --- Routine Actions ---
  async openCreateRoutineModal(childId: string) {
    const modal = await this.modalCtrl.create({
      component: CreateRoutineModalComponent,
      componentProps: { childId }
    });

    modal.onDidDismiss().then(result => {
      if (!result.data) return;

      // Transform FE shape back to DB shape
      const firstDay = Array.isArray(result.data.days) && result.data.days.length > 0
        ? result.data.days[0]
        : 'mon';

      const dayNumber = this.dayCodeToNumber(firstDay);
      
      // Convert tasksByDay from string keys to number keys
      const tasksByDayNumeric: Record<number, string[]> = {};
      if (result.data.tasksByDay && typeof result.data.tasksByDay === 'object') {
        for (const [dayKey, tasks] of Object.entries(result.data.tasksByDay)) {
          const dayNum = this.dayCodeToNumber(dayKey);
          const taskArray = Array.isArray(tasks) ? tasks : [];
          if (taskArray.length > 0) {
            tasksByDayNumeric[dayNum] = taskArray
              .map((task: any) => String(task?.id ?? ''))
              .filter((id: string) => !!id);
          }
        }
      }

      const payload = {
        childId,
        nametask: result.data.name ?? 'Nuova routine',
        description: result.data.description ?? '',
        day_of_week: dayNumber,
        tasksByDay: Object.keys(tasksByDayNumeric).length > 0 ? tasksByDayNumeric : undefined
      };

      this.settingService.createRoutine(payload).subscribe(() => this.loadRoutines());
    });

    await modal.present();
  }

  updateRoutine(routine: Routine) {
    const dayNumber = this.dayCodeToNumber(routine.days?.[0] ?? 'mon');

    this.settingService.updateRoutine(routine.id, {
      nametask: routine.name,
      description: routine.description,
      day_of_week: dayNumber,
      isActive: routine.isActive
    }).subscribe(() => this.loadRoutines());
  }

  editRoutine(routine: Routine) {
    const newName = window.prompt('Nome routine', routine.name);
    if (!newName) return;

    this.settingService.updateRoutine(routine.id, { nametask: newName })
      .subscribe(() => this.loadRoutines());
  }

  onRoutineToggle(routine: Routine, checked: boolean) {
    routine.isActive = checked;
    this.updateRoutine(routine);
  }

  async deleteRoutine(routine: Routine) {
    const confirmed = window.confirm('Sei sicuro di voler eliminare questa routine?');
    if (confirmed) {
      this.settingService.deleteRoutine(routine.id)
        .subscribe(() => this.loadRoutines());
    }
  }

  getCategoryColor(category: string) {
    const colors: Record<string, string> = {
      morning: 'warning',
      afternoon: 'primary',
      evening: 'secondary',
      custom: 'tertiary'
    };
    return colors[category] || 'medium';
  }

  getCategoryLabel(category: string) {
    const labels: Record<string, string> = {
      morning: 'Mattina',
      afternoon: 'Pomeriggio',
      evening: 'Sera',
      custom: 'Custom'
    };
    return labels[category] || category;
  }

  // Actions
  goBack() {
    this.router.navigate(['/home']);
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  addChild() {
    const newChild = { name: 'Nuovo Bambino', years: 5 };
    this.settingService.addChild(newChild).subscribe(() => this.loadChildren());
  }

  async editChild(child: Child) {

    const modal = await this.modalCtrl.create({
      component: AddChildModalComponent,
      componentProps: { child },
      backdropDismiss: false,
      breakpoints: [0, 0.7],
      initialBreakpoint: 0.7,
    });

    await modal.present();

    const { data: formValue } = await modal.onDidDismiss();

    if (!formValue) return;

    const updated: Child = {
      ...child,
      ...formValue
    };

    this.settingService.updateChild(child.id, updated)
      .subscribe(() => this.loadChildren());
  }

  deleteChild(child: Child) {
    const confirmed = window.confirm(`Vuoi eliminare ${child.name}?`);
    if (confirmed) {
      this.settingService.deleteChild(child.id).subscribe(() => this.loadChildren());
    }
  }

  addTask() {
    this.taskForm = {
      emoji: '🎯',
      title: '',
      description: '',
      duration: 30,
      color: '#4ECDC4',
      reward: 10,
      startTime: '08:00',
      endTime: '08:30'
    };
    this.editingTask.set(null);
    this.showTaskModal.set(true);
  }

  editTask(task: Task) {
    this.taskForm = {
      emoji: task.emoji,
      title: task.title,
      description: task.description ?? '',
      duration: task.duration,
      color: task.color ?? '#4ECDC4',
      reward: task.reward,
      startTime: (task as any).startTime || '08:00',
      endTime: (task as any).endTime || '08:30'
    };
    this.editingTask.set(task);
    this.showTaskModal.set(true);
  }

  deleteTask(task: Task) {
    const confirmed = window.confirm("Sei sicuro di voler eliminare questa routine?");
    if (confirmed) {
      this.settingService.deleteTask(task.id).subscribe(() => this.loadTasks());
    }
  }

  removeTaskFromRoutine(routine: Routine, day: string, task: Task) {
    const confirmed = window.confirm(`Rimuovere "${task.title}" da ${this.getDayLabel(day)}?`);
    if (!confirmed) return;

    const dayNumber = this.dayCodeToNumber(day);
    
    // Get current tasks for this specific day
    const currentTasksForDay = routine.tasksByDay?.[dayNumber] || [];
    const remainingTasks = currentTasksForDay.filter((t: any) => {
      const id = String(typeof t === 'string' ? t : t?.id);
      return id !== String(task.id);
    });

    // Update only this day's tasks — preserve startTime/endTime/duration for remaining tasks
    const tasksByDay: Record<number, any[]> = {
      [dayNumber]: remainingTasks.map((t: any) => ({
        id: typeof t === 'string' ? t : t.id,
        startTime: t.startTime || null,
        endTime: t.endTime || null,
        duration: t.duration || null
      }))
    };

    this.settingService.updateRoutine(routine.id, {
      nametask: routine.name,
      isActive: routine.isActive,
      tasksByDay
    }).subscribe(() => {
      this.loadRoutines();
      this.showToast(`🗑️ "${task.title}" rimosso da ${this.getDayLabel(day)}`);
    });
  }

  saveTask() {
    // Validazione
    if (!this.taskForm.title?.trim()) {
      alert('Inserisci il nome del task');
      return;
    }
    if (!this.taskForm.startTime || !this.taskForm.endTime) {
      alert('Inserisci ora di inizio e fine');
      return;
    }

    const payload = {
      title: this.taskForm.title,
      emoji: this.taskForm.emoji,
      color: this.taskForm.color,
      duration: this.taskForm.duration,
      description: this.taskForm.description,
      reward: this.taskForm.reward,
      isActive: this.editingTask()?.isActive ?? true,
      startTime: this.taskForm.startTime,
      endTime: this.taskForm.endTime
    };

    const editing = this.editingTask();

    if (editing) {
      // Mantieni tutte le proprietà originali del task
      const updatedTask = { ...editing, ...payload };
      this.settingService.updateTask(editing.id, updatedTask).subscribe(() => {
        this.loadTasks();
        this.closeTaskModal();
      });
    } else {
      this.settingService.createTask(payload).subscribe((createdTask: Task) => {
        // If adding to a routine/day, update the routine
        if (this.addingToRoutine && this.addingToDay) {
          const dayNumber = this.dayCodeToNumber(this.addingToDay);
          const currentTasksForDay = this.addingToRoutine.tasksByDay?.[dayNumber] || [];

          // Build task entries: preserve existing tasks + new task with time info
          const taskEntries = [
            ...currentTasksForDay.map((t: any) => ({
              id: typeof t === 'string' ? t : t.id,
              startTime: t.startTime || null,
              endTime: t.endTime || null,
              duration: t.duration || null
            })),
            {
              id: createdTask.id,
              startTime: this.taskForm.startTime,
              endTime: this.taskForm.endTime,
              duration: this.taskForm.duration
            }
          ];

          this.settingService.updateRoutine(this.addingToRoutine.id, {
            nametask: this.addingToRoutine.name,
            isActive: this.addingToRoutine.isActive,
            tasksByDay: {
              [dayNumber]: taskEntries
            }
          }).subscribe(() => {
            this.loadRoutines();
            this.closeTaskModal();
            this.addingToRoutine = undefined;
            this.addingToDay = undefined;
          });
        } else {
          this.loadTasks();
          this.closeTaskModal();
        }
      });
    }
  }

  async addTaskRoutine(routine: Routine, day: string) {
    // Forza il caricamento dei tasks anche se già caricati (per refresh)
    await new Promise<void>((resolve) => {
      this.settingService.getTasks().subscribe({
        next: (data) => {
          this.tasks.set(data);
          resolve();
        },
        error: (err) => {
          console.error('Error loading tasks:', err);
          resolve();
        }
      });
    });

    const existingTasks = this.tasks();
    
    if (existingTasks.length === 0) {
      // No tasks exist, create a new one
      this.createNewTaskForRoutine(routine, day);
      return;
    }

    // Use alert to show options
    const alert = document.createElement('ion-alert');
    alert.header = `Aggiungi Attività - ${this.getDayLabel(day)}`;
    alert.message = `Routine: ${routine.name}`;
    alert.buttons = [
      {
        text: 'Seleziona Esistente',
        handler: () => {
          this.selectExistingTaskForRoutine(routine, day);
        }
      },
      {
        text: 'Crea Nuova',
        handler: () => {
          this.createNewTaskForRoutine(routine, day);
        }
      },
      {
        text: 'Annulla',
        role: 'cancel'
      }
    ];
    document.body.appendChild(alert);
    await alert.present();
  }

  private createNewTaskForRoutine(routine: Routine, day: string) {
    this.taskForm = {
      emoji: '🎯',
      title: '',
      description: '',
      duration: 30,
      color: '#4ECDC4',
      reward: 10,
      startTime: '08:00',
      endTime: '08:30'
    };
    this.editingTask.set(null);
    this.showTaskModal.set(true);
    this.addingToRoutine = routine;
    this.addingToDay = day;
  }

  private async selectExistingTaskForRoutine(routine: Routine, day: string) {
    const existingTasks = this.tasks();
    
    // Get current tasks for this day to mark them as checked
    const dayNumber = this.dayCodeToNumber(day);
    const currentTasksForDay = routine.tasksByDay?.[dayNumber] || [];
    const currentTaskIds = currentTasksForDay.map(t => String(typeof t === 'string' ? t : t.id));
    
    const taskOptions = existingTasks.map(task => ({
      name: task.title,
      type: 'checkbox',
      label: `${task.emoji} ${task.title} (${task.duration}min, 🏆${task.reward})`,
      value: task.id,
      checked: currentTaskIds.includes(String(task.id))
    }));

    const alert = document.createElement('ion-alert');
    alert.header = `${this.getDayLabel(day)} - ${routine.name}`;
    alert.message = 'Seleziona le attività da aggiungere';
    alert.inputs = taskOptions as any;
    alert.buttons = [
      {
        text: 'Annulla',
        role: 'cancel'
      },
      {
        text: 'Avanti →',
        handler: (selectedTaskIds: string[]) => {
          if (!selectedTaskIds || selectedTaskIds.length === 0) {
            return;
          }
          // Show time picker for each new task
          this.promptTimesForTasks(routine, day, selectedTaskIds, currentTasksForDay);
        }
      }
    ];
    document.body.appendChild(alert);
    await alert.present();
  }

  private async promptTimesForTasks(routine: Routine, day: string, allTaskIds: string[], existingTasks: any[]) {
    const dayNumber = this.dayCodeToNumber(day);
    const existingTaskIds = existingTasks.map(t => String(typeof t === 'string' ? t : t.id));
    
    // Find newly added tasks (not in existing)
    const newTaskIds = allTaskIds.filter(id => !existingTaskIds.includes(id));
    
    if (newTaskIds.length === 0) {
      // No new tasks, just update
      this.finalizeTasksToRoutine(routine, day, existingTasks);
      return;
    }

    // Get task details for new tasks
    const allTasks = this.tasks();
    const tasksToAdd: any[] = [];
    
    for (const taskId of newTaskIds) {
      const task = allTasks.find(t => t.id === taskId);
      if (task) {
        // Prompt for time
        const times = await this.promptTimeForTask(task, day);
        if (times) {
          tasksToAdd.push({
            id: task.id,
            startTime: times.startTime,
            endTime: times.endTime,
            duration: times.duration
          });
        }
      }
    }

    // Combine existing tasks with new tasks (with times and duration)
    const finalTasks = [
      ...existingTasks.map(t => ({
        id: typeof t === 'string' ? t : t.id,
        startTime: t.startTime || null,
        endTime: t.endTime || null,
        duration: t.duration || null
      })),
      ...tasksToAdd
    ];

    this.finalizeTasksToRoutine(routine, day, finalTasks);
  }

  private promptTimeForTask(task: Task, day: string): Promise<{ startTime: string, endTime: string, duration: number } | null> {
    return new Promise((resolve) => {
      this.timePickerTask = task;
      this.timePickerDay = day;
      // Pre-fill with task's default times if available
      this.timePickerForm = {
        startTime: (task as any).startTime || '08:00',
        endTime: (task as any).endTime || '08:30'
      };
      this.timePickerResolve = resolve;
      this.showTimePickerModal.set(true);
    });
  }

  /**
   * Calcola la durata in minuti dalla differenza tra endTime e startTime
   */
  private calculateDurationFromTimes(startTime: string, endTime: string): number {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    let duration = endTotalMinutes - startTotalMinutes;
    
    // Se la durata è negativa (es. 23:00 - 01:00), aggiungi 24 ore
    if (duration < 0) {
      duration += 24 * 60;
    }
    
    // Minimo 1 minuto
    return Math.max(1, duration);
  }

  private finalizeTasksToRoutine(routine: Routine, day: string, tasks: any[]) {
    const dayNumber = this.dayCodeToNumber(day);
    
    // Build tasksByDay with task objects including times
    const tasksByDay: Record<number, any[]> = {
      [dayNumber]: tasks
    };
    
    this.settingService.updateRoutine(routine.id, {
      nametask: routine.name,
      isActive: routine.isActive,
      tasksByDay
    }).subscribe(() => {
      this.loadRoutines();
      this.showToast(`✅ Attività aggiornate per ${this.getDayLabel(day)}`);
    });
  }

  private async showToast(message: string) {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 2000;
    toast.position = 'bottom';
    toast.color = 'success';
    document.body.appendChild(toast);
    await toast.present();
  }

  closeTaskModal() {
    this.showTaskModal.set(false);
    this.editingTask.set(null);
  }

  onToggleTask(task: Task, newState: boolean) {
    const updated: Task = {
      ...task,
      isActive: newState
    };

    this.updateTask(updated);
  }

  updateTask(task: Task) {
    // Mantieni tutte le proprietà originali del task
    this.settingService.updateTask(task.id, { ...task }).subscribe(() => this.loadTasks());
  }

}