import { Component, inject, input, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonButton, IonInput, IonTextarea, IonToggle,
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonContent,
  ModalController
} from '@ionic/angular/standalone';
import { Routine, Task } from 'src/app/models/task.models';
import { Child } from 'src/app/models/family.models';
import { SettingService } from '../../../services/setting.service';
import { CreateRoutineModalComponent } from '../create-routine-modal/create-routine-modal.component';
import { LocalTimePipe } from '../../../pipes/local-time.pipe';
import { dayCodeToNumber, dayNumberToCode, getDayLabel } from '../../../utils/day.utils';

@Component({
  selector: 'app-settings-routines',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonButton, IonInput, IonTextarea, IonToggle,
    IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonContent,
    LocalTimePipe
  ],
  templateUrl: './settings-routines.component.html',
  styleUrls: ['./settings-routines.component.scss']
})
export class SettingsRoutinesComponent implements OnChanges {
  children = input.required<Child[]>();
  /** All tasks from the task library — passed from parent so we avoid double-fetching. */
  tasks = input<Task[]>([]);

  readonly weekDaysOrder: string[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  routines = signal<Routine[]>([]);

  /** Local cache populated when tasks input is empty (parent hasn't loaded them yet). */
  private localTasks = signal<Task[]>([]);
  private get availableTasks(): Task[] {
    const fromInput = this.tasks();
    return fromInput.length > 0 ? fromInput : this.localTasks();
  }

  // Task creation modal (create directly from within routines)
  showTaskModal = signal(false);
  private pendingRoutine: Routine | null = null;
  private pendingDay = '';
  taskForm = {
    emoji: '🎯', title: '', description: '', duration: 30,
    reward: 10, color: '#4ECDC4', startTime: '08:00', endTime: '08:30'
  };
  readonly taskColors = ['#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE'];

  // Time picker modal state
  showTimePickerModal = signal(false);
  timePickerTask: Task | null = null;
  timePickerDay = '';
  timePickerForm = { startTime: '08:00', endTime: '08:30' };
  private timePickerResolve: ((val: { startTime: string; endTime: string; duration: number } | null) => void) | null = null;

  private settingService = inject(SettingService);
  private modalCtrl = inject(ModalController);

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges) {
    if (changes['children'] && this.children().length > 0 && this.routines().length === 0) {
      this.loadRoutines();
    }
  }

  // ── Data Loading ───────────────────────────────────────────────────────────

  loadRoutines() {
    const children = this.children() ?? [];
    if (!Array.isArray(children) || children.length === 0) {
      this.routines.set([]);
      return;
    }

    const childIds = children.map(c => c.id).filter(Boolean);

    this.settingService.getRoutinesForChildren(childIds).subscribe({
      next: (rows: any[]) => {
        const routinesArr = (rows ?? []).map((r: any) => {
          const normalizedTasksByDay = r.tasksByDay ? this.normalizeTasksByDay(r.tasksByDay) : undefined;

          let daysArray: string[] = [];
          if (normalizedTasksByDay && Object.keys(normalizedTasksByDay).length > 0) {
            daysArray = Object.keys(normalizedTasksByDay).map(d => this.dayNumberToCode(Number(d)));
          } else if (Array.isArray(r.days) && r.days.length > 0) {
            daysArray = r.days;
          } else {
            daysArray = ['mon', 'tue', 'wed', 'thu', 'fri'];
          }

          return {
            id: r.id,
            childId: r.child_id ?? r.childId,
            name: r.nametask ?? r.name ?? 'Nuova routine',
            description: r.description,
            days: daysArray,
            tasks: Array.isArray(r.tasks) ? r.tasks.map((t: any) => this.normalizeRoutineTask(t)) : [],
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

  // ── Helpers ────────────────────────────────────────────────────────────────

  getRoutinesForChild(childId: string) {
    return this.routines().filter(r => r.childId === childId);
  }

  getTasksForRoutineDay(routine: Routine, day: string): Task[] {
    const dayNumber = this.dayCodeToNumber(day);
    if (routine.tasksByDay && routine.tasksByDay[dayNumber]) {
      return routine.tasksByDay[dayNumber]
        .filter((t: any) => typeof t !== 'string')
        .map((t: any) => this.normalizeRoutineTask(t));
    }
    return [];
  }

  getDayLabel(day: string) {
    return getDayLabel(day);
  }

  private dayNumberToCode(day: number): string {
    return dayNumberToCode(day);
  }

  private dayCodeToNumber(day: string): number {
    return dayCodeToNumber(day);
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

  // ── Routine CRUD ───────────────────────────────────────────────────────────

  async openCreateRoutineModal(childId: string) {
    const modal = await this.modalCtrl.create({
      component: CreateRoutineModalComponent,
      componentProps: { childId }
    });

    modal.onDidDismiss().then(result => {
      if (!result.data) return;

      const firstDay = Array.isArray(result.data.days) && result.data.days.length > 0
        ? result.data.days[0]
        : 'mon';

      const dayNumber = this.dayCodeToNumber(firstDay);
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

  editRoutine(routine: Routine) {
    const newName = window.prompt('Nome routine', routine.name);
    if (!newName) return;
    this.settingService.updateRoutine(routine.id, { nametask: newName })
      .subscribe(() => this.loadRoutines());
  }

  onRoutineToggle(routine: Routine, checked: boolean) {
    routine.isActive = checked;
    const dayNumber = this.dayCodeToNumber(routine.days?.[0] ?? 'mon');
    this.settingService.updateRoutine(routine.id, {
      nametask: routine.name,
      description: routine.description,
      day_of_week: dayNumber,
      isActive: routine.isActive
    }).subscribe(() => this.loadRoutines());
  }

  async deleteRoutine(routine: Routine) {
    const confirmed = window.confirm('Sei sicuro di voler eliminare questa routine?');
    if (confirmed) {
      this.settingService.deleteRoutine(routine.id).subscribe(() => this.loadRoutines());
    }
  }

  // ── Task in Routine ────────────────────────────────────────────────────────

  async addTaskRoutine(routine: Routine, day: string) {
    // If parent hasn't loaded tasks yet, fetch them now and cache locally
    if (this.tasks().length === 0) {
      await new Promise<void>((resolve) => {
        this.settingService.getTasks().subscribe({
          next: (data) => { this.localTasks.set(data); resolve(); },
          error: () => resolve()
        });
      });
    }

    const existingTasks = this.availableTasks;

    if (existingTasks.length === 0) {
      // No tasks in library yet — open creation modal directly
      this.openNewTaskModal(routine, day);
      return;
    }

    const alert = document.createElement('ion-alert');
    alert.header = `Aggiungi Attività - ${this.getDayLabel(day)}`;
    alert.message = `Routine: ${routine.name}`;
    alert.buttons = [
      { text: 'Seleziona Esistente', handler: () => this.selectExistingTaskForRoutine(routine, day) },
      { text: '➕ Crea Nuova', handler: () => this.openNewTaskModal(routine, day) },
      { text: 'Annulla', role: 'cancel' }
    ];
    document.body.appendChild(alert);
    await alert.present();
  }

  private openNewTaskModal(routine: Routine, day: string) {
    this.pendingRoutine = routine;
    this.pendingDay = day;
    this.taskForm = { emoji: '🎯', title: '', description: '', duration: 30, color: '#4ECDC4', reward: 10, startTime: '08:00', endTime: '08:30' };
    this.showTaskModal.set(true);
  }

  closeTaskModal() {
    this.showTaskModal.set(false);
    this.pendingRoutine = null;
    this.pendingDay = '';
  }

  saveNewTask() {
    if (!this.taskForm.title?.trim()) { alert('Inserisci il nome del task'); return; }
    if (!this.taskForm.startTime || !this.taskForm.endTime) { alert('Inserisci ora di inizio e fine'); return; }

    const payload = {
      title: this.taskForm.title, emoji: this.taskForm.emoji, color: this.taskForm.color,
      duration: this.taskForm.duration, description: this.taskForm.description,
      reward: this.taskForm.reward, isActive: true,
      startTime: this.taskForm.startTime, endTime: this.taskForm.endTime
    };

    this.settingService.createTask(payload).subscribe((createdTask: Task) => {
      // Update local cache so future selects show the new task
      this.localTasks.update(tasks => [...tasks, createdTask]);

      if (this.pendingRoutine && this.pendingDay) {
        const routine = this.pendingRoutine;
        const day = this.pendingDay;
        const dayNumber = this.dayCodeToNumber(day);
        const currentTasksForDay = routine.tasksByDay?.[dayNumber] || [];
        const taskEntries = [
          ...currentTasksForDay.map((t: any) => ({
            id: typeof t === 'string' ? t : t.id,
            startTime: t.startTime || null, endTime: t.endTime || null, duration: t.duration || null
          })),
          { id: createdTask.id, startTime: this.taskForm.startTime, endTime: this.taskForm.endTime, duration: this.taskForm.duration }
        ];
        this.settingService.updateRoutine(routine.id, {
          nametask: routine.name, isActive: routine.isActive,
          tasksByDay: { [dayNumber]: taskEntries }
        }).subscribe(() => {
          this.loadRoutines();
          this.closeTaskModal();
          this.showToast('✅ Task creato e aggiunto alla routine!');
        });
      } else {
        this.closeTaskModal();
        this.showToast('✅ Task creato!');
      }
    });
  }

  private async selectExistingTaskForRoutine(routine: Routine, day: string) {
    const existingTasks = this.availableTasks;
    const dayNumber = this.dayCodeToNumber(day);
    const currentTasksForDay = routine.tasksByDay?.[dayNumber] || [];
    const currentTaskIds = currentTasksForDay.map((t: any) => String(typeof t === 'string' ? t : t.id));

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
      { text: 'Annulla', role: 'cancel' },
      {
        text: 'Avanti →',
        handler: (selectedTaskIds: string[]) => {
          if (!selectedTaskIds || selectedTaskIds.length === 0) return;
          this.promptTimesForTasks(routine, day, selectedTaskIds, currentTasksForDay);
        }
      }
    ];
    document.body.appendChild(alert);
    await alert.present();
  }

  private async promptTimesForTasks(routine: Routine, day: string, allTaskIds: string[], existingTasks: any[]) {
    const existingTaskIds = existingTasks.map((t: any) => String(typeof t === 'string' ? t : t.id));
    const newTaskIds = allTaskIds.filter(id => !existingTaskIds.includes(id));

    if (newTaskIds.length === 0) {
      this.finalizeTasksToRoutine(routine, day, existingTasks);
      return;
    }

    const allTasks = this.availableTasks;
    const tasksToAdd: any[] = [];

    for (const taskId of newTaskIds) {
      const task = allTasks.find(t => t.id === taskId);
      if (task) {
        const times = await this.promptTimeForTask(task, day);
        if (times) {
          tasksToAdd.push({ id: task.id, startTime: times.startTime, endTime: times.endTime, duration: times.duration });
        }
      }
    }

    const finalTasks = [
      ...existingTasks.map((t: any) => ({
        id: typeof t === 'string' ? t : t.id,
        startTime: t.startTime || null,
        endTime: t.endTime || null,
        duration: t.duration || null
      })),
      ...tasksToAdd
    ];

    this.finalizeTasksToRoutine(routine, day, finalTasks);
  }

  private promptTimeForTask(task: Task, day: string): Promise<{ startTime: string; endTime: string; duration: number } | null> {
    return new Promise((resolve) => {
      this.timePickerTask = task;
      this.timePickerDay = day;
      this.timePickerForm = {
        startTime: (task as any).startTime || '08:00',
        endTime: (task as any).endTime || '08:30'
      };
      this.timePickerResolve = resolve;
      this.showTimePickerModal.set(true);
    });
  }

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

  private calculateDurationFromTimes(startTime: string, endTime: string): number {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let duration = (eh * 60 + em) - (sh * 60 + sm);
    if (duration < 0) duration += 24 * 60;
    return Math.max(1, duration);
  }

  removeTaskFromRoutine(routine: Routine, day: string, task: Task) {
    const confirmed = window.confirm(`Rimuovere "${task.title}" da ${this.getDayLabel(day)}?`);
    if (!confirmed) return;

    const dayNumber = this.dayCodeToNumber(day);
    const currentTasksForDay = routine.tasksByDay?.[dayNumber] || [];
    const remainingTasks = currentTasksForDay.filter((t: any) => {
      const id = String(typeof t === 'string' ? t : t?.id);
      return id !== String(task.id);
    });

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

  private finalizeTasksToRoutine(routine: Routine, day: string, tasks: any[]) {
    const dayNumber = this.dayCodeToNumber(day);
    this.settingService.updateRoutine(routine.id, {
      nametask: routine.name,
      isActive: routine.isActive,
      tasksByDay: { [dayNumber]: tasks }
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
}
