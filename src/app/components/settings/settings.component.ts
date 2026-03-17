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
  IonSegment, IonSegmentButton, IonBadge, IonAvatar,
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

  taskForm = {
    emoji: '🎯',
    title: '',
    description: '',
    duration: 5,
    reward: 15,
    color: '#4ECDC4'
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
    // Carica prima i bambini, poi task e routine
    this.settingService.getChildren().subscribe(childrenData => {
      this.children.set(childrenData);
      this.loadTasks();
      this.loadRoutines();
    });
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
    };
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
        const routinesArr = (rows ?? []).map((r: any) => ({
          id: r.id,
          childId: r.child_id ?? r.childId,
          name: r.nametask ?? r.name ?? 'Nuova routine',
          description: r.description,
          days: Array.isArray(r.days) && r.days.length > 0
            ? r.days
            : [this.dayNumberToCode(r.day_of_week)],
          startTime: r.start_time ?? r.startTime,
          endTime: r.end_time ?? r.endTime,
          tasks: Array.isArray(r.tasks)
            ? r.tasks.map((t: any) => this.normalizeRoutineTask(t))
            : [],
          isDone: !!r.isDone,
          isActive: typeof r.isActive === 'boolean' ? r.isActive : !r.isDone,
          category: 'custom',
          createdAt: r.created_at ?? r.createdAt
        })) as Routine[];

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
    if (!routine?.days?.includes(day) || !routine?.tasks) return [];
    return routine.tasks.filter(t => typeof t !== 'string');
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
      const taskIds = Array.from(new Set(
        Object.values(result.data.tasksByDay ?? {})
          .flatMap((dayTasks: any) => Array.isArray(dayTasks) ? dayTasks : [])
          .map((task: any) => String(task?.id ?? ''))
          .filter((id: string) => !!id)
      ));

      const payload = {
        childId,
        nametask: result.data.name ?? 'Nuova routine',
        description: result.data.description ?? '',
        day_of_week: dayNumber,
        start_time: result.data.startTime ?? '08:00',
        end_time: result.data.endTime ?? '',
        isDone: false,
        taskIds
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
      start_time: routine.startTime,
      end_time: routine.endTime,
      isDone: !routine.isActive
    }).subscribe(() => this.loadRoutines());
  }

  private dayCodeToNumber(day: string): number {
    const map: Record<string, number> = {
      sun: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6
    };
    return map[day] ?? 1;
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
      duration: 5,
      color: '#4ECDC4',
      reward: 10
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
      reward: task.reward
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

  removeTaskFromRoutine(routine: Routine, task: Task) {
    const confirmed = window.confirm(`Rimuovere "${task.title}" da questa routine?`);
    if (!confirmed) return;

    const remainingTasks = (routine.tasks ?? []).filter((t: any) => {
      const id = String(typeof t === 'string' ? t : t?.id);
      return id !== String(task.id);
    });

    this.settingService.updateRoutine(routine.id, {
      nametask: routine.name,
      isActive: routine.isActive,
      days: routine.days,
      taskIds: remainingTasks.map((t: any) => String(typeof t === 'string' ? t : t.id)),
      startTime: routine.startTime
    }).subscribe(() => this.loadRoutines());
  }

  saveTask() {
    const payload: TaskPayload = {
      title: this.taskForm.title,
      emoji: this.taskForm.emoji,
      color: this.taskForm.color,
      duration: this.taskForm.duration,
      description: this.taskForm.description,
      reward: this.taskForm.reward,
      isActive: this.editingTask()?.isActive ?? true
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
          // Add the new task to the routine's tasks and day if not present
          const updatedRoutine = { ...this.addingToRoutine };
          if (!updatedRoutine.tasks.map((t: any) => typeof t === 'string' ? t : t.id).includes(createdTask.id)) {
            updatedRoutine.tasks.push(createdTask);
          }
          if (!updatedRoutine.days.includes(this.addingToDay)) {
            updatedRoutine.days.push(this.addingToDay);
          }
          this.settingService.updateRoutine(updatedRoutine.id, {
            nametask: updatedRoutine.name,
            isActive: updatedRoutine.isActive,
            days: updatedRoutine.days,
            taskIds: updatedRoutine.tasks.map(t => String(typeof t === 'string' ? t : t.id)),
            startTime: updatedRoutine.startTime
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
    this.taskForm = {
      emoji: '🎯',
      title: '',
      description: '',
      duration: 5,
      color: '#4ECDC4',
      reward: 10
    };
    this.editingTask.set(null);
    this.showTaskModal.set(true);
    this.addingToRoutine = routine;
    this.addingToDay = day;
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