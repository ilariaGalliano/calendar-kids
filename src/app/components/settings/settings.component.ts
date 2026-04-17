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

  // Task select modal state (for adding to routine)
  showTaskSelectModal = signal(false);
  taskSelectRoutine: Routine | null = null;
  taskSelectDay = '';

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

  availableIcons = [
    '🎯', '📚', '🦷', '🛏️', '🧹', '🍽️', '🎨', '🎵',
    '⚽', '🏊', '🚿', '👕', '🎒', '✏️', '🧮', '🌿',
    '🐕', '🚶', '💤', '🧘', '🎮', '📖', '🧪', '🎭',
    '🏃', '🚴', '🧸', '🍳', '🧼', '💊', '🌅', '🌙'
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
  openCreateRoutineInline(childId: string) {
    this.settingService.createRoutine({
      childId,
      nametask: 'Nuova Routine',
      description: '',
      day_of_week: 1,
    }).subscribe(() => this.loadRoutines());
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
    this.router.navigate(['/home'], { queryParams: { mode: 'parent' } });
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  addChild() {
    const newChild = { name: 'Nuovo Bambino', birth_date: null };
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

    const { avatarFile, ...childData } = formValue;

    // Strip avatar from PUT body: it's handled separately via uploadChildAvatar
    const { avatar: _avatar, ...childWithoutAvatar } = child as any;
    const updated: Child = { ...childWithoutAvatar, ...childData };

    this.settingService.updateChild(child.id, updated).subscribe((savedChild) => {
      if (avatarFile) {
        this.settingService.uploadChildAvatar(child.id, avatarFile)
          .subscribe({
            next: () => this.loadChildren(),
            error: () => {
              alert('Caricamento foto fallito. Riprova con un file più piccolo (max 2 MB).');
              this.loadChildren();
            }
          });
      } else {
        this.loadChildren();
      }
    });
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
      emoji: task.emoji || '🎯',
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

  addTaskRoutine(routine: Routine, day: string) {
    // Load tasks then open select modal
    this.settingService.getTasks().subscribe(data => {
      this.tasks.set(data);
      this.taskSelectRoutine = routine;
      this.taskSelectDay = day;
      this.showTaskSelectModal.set(true);
    });
  }

  closeTaskSelectModal() {
    this.showTaskSelectModal.set(false);
    this.taskSelectRoutine = null;
    this.taskSelectDay = '';
  }

  editTaskInRoutine(routine: Routine, day: string, task: Task) {
    const dayNumber = this.dayCodeToNumber(day);
    this.timePickerTask = task;
    this.timePickerDay = day;
    this.timePickerForm = {
      startTime: (task as any).startTime || '08:00',
      endTime: (task as any).endTime || '08:30'
    };
    this.timePickerResolve = (times) => {
      if (!times) return;
      const currentTasksForDay = routine.tasksByDay?.[dayNumber] || [];
      const updatedTasks = currentTasksForDay.map((t: any) => {
        const tId = String(typeof t === 'string' ? t : t.id);
        if (tId === String(task.id)) {
          return { id: tId, startTime: times.startTime, endTime: times.endTime, duration: times.duration };
        }
        return { id: tId, startTime: t.startTime || null, endTime: t.endTime || null, duration: t.duration || null };
      });
      this.settingService.updateRoutine(routine.id, {
        nametask: routine.name,
        isActive: routine.isActive,
        tasksByDay: { [dayNumber]: updatedTasks }
      }).subscribe(() => {
        this.loadRoutines();
        this.showToast(`⏰ Orario aggiornato per "${task.title}"`);
      });
    };
    this.showTimePickerModal.set(true);
  }

  selectExistingTask(task: Task) {
    const routine = this.taskSelectRoutine!;
    const day = this.taskSelectDay;
    this.closeTaskSelectModal();
    this.timePickerTask = task;
    this.timePickerDay = day;
    this.timePickerForm = {
      startTime: (task as any).startTime || '08:00',
      endTime: (task as any).endTime || '08:30'
    };
    this.timePickerResolve = (times) => {
      if (!times) return;
      const dayNumber = this.dayCodeToNumber(day);
      const currentTasksForDay = routine.tasksByDay?.[dayNumber] || [];
      const taskEntries = [
        ...currentTasksForDay.map((t: any) => ({
          id: typeof t === 'string' ? t : t.id,
          startTime: t.startTime || null,
          endTime: t.endTime || null,
          duration: t.duration || null
        })),
        { id: task.id, startTime: times.startTime, endTime: times.endTime, duration: times.duration }
      ];
      this.settingService.updateRoutine(routine.id, {
        nametask: routine.name,
        isActive: routine.isActive,
        tasksByDay: { [dayNumber]: taskEntries }
      }).subscribe(() => {
        this.loadRoutines();
        this.showToast(`✅ "${task.title}" aggiunto a ${this.getDayLabel(day)}`);
      });
    };
    this.showTimePickerModal.set(true);
  }

  openCreateTaskFromRoutine() {
    const routine = this.taskSelectRoutine!;
    const day = this.taskSelectDay;
    this.closeTaskSelectModal();
    this.createNewTaskForRoutine(routine, day);
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

  copyTasksToAllDays(routine: Routine, day: string) {
    const sourceDayNumber = this.dayCodeToNumber(day);
    const sourceTasks = routine.tasksByDay?.[sourceDayNumber] || [];

    if (sourceTasks.length === 0) {
      this.showToast('⚠️ Nessuna attività in questo giorno da copiare');
      return;
    }

    // Normalize source tasks
    const normalizedSourceTasks = sourceTasks.map((t: any) => ({
      id: String(typeof t === 'string' ? t : t.id),
      startTime: t.startTime || null,
      endTime: t.endTime || null,
      duration: t.duration || null
    }));

    // For each other day, merge existing tasks with source tasks (additive)
    const tasksByDay: Record<number, any[]> = {};

    for (const d of this.weekDaysOrder) {
      if (d === day) continue; // skip the source day
      const dayNum = this.dayCodeToNumber(d);
      const existingTasks = routine.tasksByDay?.[dayNum] || [];
      const existingIds = existingTasks.map((t: any) => String(typeof t === 'string' ? t : t.id));

      // Only add source tasks not already present in this day
      const tasksToAdd = normalizedSourceTasks.filter((t) => !existingIds.includes(t.id));
      if (tasksToAdd.length === 0) continue;

      tasksByDay[dayNum] = [
        ...existingTasks.map((t: any) => ({
          id: typeof t === 'string' ? t : t.id,
          startTime: t.startTime || null,
          endTime: t.endTime || null,
          duration: t.duration || null
        })),
        ...tasksToAdd
      ];
    }

    if (Object.keys(tasksByDay).length === 0) {
      this.showToast('ℹ️ Le attività sono già presenti in tutti i giorni');
      return;
    }

    this.settingService.updateRoutine(routine.id, {
      nametask: routine.name,
      isActive: routine.isActive,
      tasksByDay
    }).subscribe(() => {
      this.loadRoutines();
      this.showToast(`✅ Attività di ${this.getDayLabel(day)} copiate su tutti i giorni`);
    });
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