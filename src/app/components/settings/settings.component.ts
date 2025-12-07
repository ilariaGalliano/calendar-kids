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
  IonSegment, IonSegmentButton, IonBadge, IonAvatar
} from '@ionic/angular/standalone';
import { Child, Routine, Task } from 'src/app/models/task.models';
import { AuthService } from '../../common/auth.service';
import { SettingService } from '../../services/setting.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel,
    IonButton, IonInput, IonTextarea, IonSelect, IonSelectOption,
    IonList, IonToggle,
    IonFab, IonFabButton, IonModal, IonSegment, IonSegmentButton, IonBadge, IonAvatar
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
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
    category: 'custom' as Task['category'],
    color: '#4ECDC4'
  };

  taskColors = [
    '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE'
  ];

  constructor(
    private router: Router,
    private authService: AuthService = inject(AuthService),
    private settingService: SettingService = inject(SettingService)
  ) {}

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

  filteredTasks() {
    const tasks = this.tasks();
    return this.taskFilter === 'all' ? tasks : tasks.filter(t => t.category === this.taskFilter);
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

  editChild(child: Child) {
    // Example: update name
    const updated = { ...child, name: child.name + ' (modificato)' };
    this.settingService.updateChild(child.id, updated).subscribe(() => this.loadChildren());
  }

  addTask() {
    this.taskForm = {
      emoji: '🎯',
      title: '',
      description: '',
      duration: 5,
      category: 'custom',
      color: '#4ECDC4'
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
      category: task.category ?? 'custom',
      color: task.color ?? '#4ECDC4'
    };
    this.editingTask.set(task);
    this.showTaskModal.set(true);
  }

  deleteTask(task: Task) {
    this.settingService.deleteTask(task.id).subscribe(() => this.loadTasks());
  }

  saveTask() {
    const newTask: any = {
      title: this.taskForm.title,
      emoji: this.taskForm.emoji,
      color: this.taskForm.color,
      duration: this.taskForm.duration,
      description: this.taskForm.description,
      category: this.taskForm.category,
      isActive: true
    };
    if (this.editingTask()) {
      this.settingService.updateTask(this.editingTask()!.id, newTask).subscribe(() => {
        this.loadTasks();
        this.closeTaskModal();
      });
    } else {
      this.settingService.createTask(newTask).subscribe(() => {
        this.loadTasks();
        this.closeTaskModal();
      });
    }
  }

  closeTaskModal() {
    this.showTaskModal.set(false);
    this.editingTask.set(null);
  }

  updateTask(task: Task) {
    this.settingService.updateTask(task.id, task).subscribe(() => this.loadTasks());
  }

  // Routine CRUD for per-child routines
  createRoutine(childId: string) {
    const newRoutine = {
      childId,
      name: 'Nuova Routine',
      description: '',
      tasks: [],
      days: ['mon'],
      startTime: '07:00',
      isActive: true
    };
  this.settingService.createRoutine(newRoutine).subscribe(() => this.loadRoutines());
  }

  editRoutine(routine: Routine) {
    // Example: update name
    const updated = { ...routine, name: routine.name + ' (modificata)' };
  this.settingService.updateRoutine(routine.id, updated).subscribe(() => this.loadRoutines());
  }

  updateRoutine(routine: Routine) {
  this.settingService.updateRoutine(routine.id, routine).subscribe(() => this.loadRoutines());
  }

  deleteRoutine(routine: Routine) {
  this.settingService.deleteRoutine(routine.id).subscribe(() => this.loadRoutines());
  }
}