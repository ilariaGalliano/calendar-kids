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
import { Child, Routine, Task, TaskPayload } from 'src/app/models/task.models';
import { AuthService } from '../../common/auth.service';
import { SettingService } from '../../services/setting.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
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
  // Opens the task modal to add a task to a specific routine and day
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
    // Store context for which routine and day the task is being added to
    this.addingToRoutine = routine;
    this.addingToDay = day;
  }

  // Helper properties to track context when adding a task to a routine/day
  addingToRoutine?: Routine;
  addingToDay?: string;

  // Update saveTask to handle adding to routine/day if context is set
  // Restituisce i task della routine per uno specifico giorno
  getTasksForRoutineDay(routine: any, day: string): any[] {
    // Se la routine ha tasks e days, mostra tutti i task se il giorno è presente
    if (!routine || !routine.tasks || !routine.days) return [];
    if (routine.days.includes(day)) {
      return routine.tasks;
    }
    return [];
  }
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

  loadRoutines() {
    // Carica le routine per tutti i bambini
    const children = this.children() ?? [];
    if (!Array.isArray(children) || children.length === 0) {
      this.routines.set([]);
      return;
    }
    // Carica tutte le routine per tutti i bambini e uniscile
    const routinesArr: Routine[] = [];
    let loaded = 0;
    children.forEach(child => {
      this.settingService.getRoutines(child.id).subscribe(data => {
        routinesArr.push(...data);
        loaded++;
        if (loaded === children.length) {
          this.routines.set(routinesArr);
        }
      });
    });
  }


  getRoutinesForChild(childId: string) {
    return this.routines().filter(r => r.childId === childId);
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

  getDayLabel(day: string) {
    const labels: Record<string, string> = {
      mon: 'L', tue: 'M', wed: 'M', thu: 'G',
      fri: 'V', sat: 'S', sun: 'D'
    };
    return labels[day] || day;
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
    const newChild = { name: 'Nuovo Bambino', age: 5 };
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
          this.settingService.updateRoutine(updatedRoutine.id, updatedRoutine).subscribe(() => {
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


  // Routine CRUD for per-child routines
  async openCreateRoutineModal(childId: string) {
  const modal = await this.modalCtrl.create({
    component: CreateRoutineModalComponent,
    componentProps: { childId }
  });

  modal.onDidDismiss().then(result => {
    if (result.data) {
      this.settingService.createRoutine(result.data)
        .subscribe(() => this.loadRoutines());
    }
  });

  await modal.present();
}


  editRoutine(routine: Routine) {
    // Example: update name
    const updated = { ...routine, name: routine.name + ' (modificata)' };
    this.settingService.updateRoutine(routine.id, updated).subscribe(() => this.loadRoutines());
  }

  updateRoutine(routine: Routine) {
    this.settingService.updateRoutine(routine.id, routine).subscribe(() => this.loadRoutines());
  }

  async deleteRoutine(routine: Routine) {
    const confirmed = window.confirm("Sei sicuro di voler eliminare questa routine?");
    if (confirmed) {
      this.settingService.deleteRoutine(routine.id).subscribe(() => this.loadRoutines());
    }
  }
}