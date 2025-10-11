import { Component, OnInit, signal } from '@angular/core';
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

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadMockData();
  }

  private loadMockData() {
    // Mock children
    this.children.set([
      { id: '1', name: 'Giulia', age: 7 },
      { id: '2', name: 'Marco', age: 5 }
    ]);

    // Mock tasks
    this.tasks.set([
      { id: '1', title: 'Colazione', emoji: '🍎', color: '#FFEAA7', duration: 15, category: 'morning', isActive: true },
      { id: '2', title: 'Lavare i denti', emoji: '🦷', color: '#45B7D1', duration: 5, category: 'morning', isActive: true },
      { id: '3', title: 'Compiti', emoji: '📚', color: '#96CEB4', duration: 30, category: 'afternoon', isActive: true },
      { id: '4', title: 'Bagno', emoji: '🛁', color: '#DDA0DD', duration: 20, category: 'evening', isActive: true }
    ]);

    // Mock routines
    this.routines.set([
      {
        id: '1',
        childId: '1',
        name: 'Routine Mattutina',
        tasks: [this.tasks()[0], this.tasks()[1]],
        days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        startTime: '07:00',
        isActive: true
      }
    ]);
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

  addChild() {
  }

  editChild(child: Child) {
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

  saveTask() {
    const newTask: Task = {
      id: this.editingTask()?.id || Date.now().toString(),
      title: this.taskForm.title,
      emoji: this.taskForm.emoji,
      color: this.taskForm.color,
      duration: this.taskForm.duration,
      description: this.taskForm.description,
      category: this.taskForm.category,
      isActive: true
    };

    const tasks = [...this.tasks()];
    const existingIndex = tasks.findIndex(t => t.id === newTask.id);
    
    if (existingIndex >= 0) {
      tasks[existingIndex] = newTask;
    } else {
      tasks.push(newTask);
    }
    
    this.tasks.set(tasks);
    this.closeTaskModal();
  }

  closeTaskModal() {
    this.showTaskModal.set(false);
    this.editingTask.set(null);
  }

  updateTask(task: Task) {
    const tasks = [...this.tasks()];
    const index = tasks.findIndex(t => t.id === task.id);
    if (index >= 0) {
      tasks[index] = task;
      this.tasks.set(tasks);
    }
  }

  deleteTask(task: Task) {
    const tasks = this.tasks().filter(t => t.id !== task.id);
    this.tasks.set(tasks);
  }

  addRoutine(childId: string) {
  }

  editRoutine(routine: Routine) {
  }

  updateRoutine(routine: Routine) {
    const routines = [...this.routines()];
    const index = routines.findIndex(r => r.id === routine.id);
    if (index >= 0) {
      routines[index] = routine;
      this.routines.set(routines);
    }
  }

  deleteRoutine(routine: Routine) {
    const routines = this.routines().filter(r => r.id !== routine.id);
    this.routines.set(routines);
  }
}