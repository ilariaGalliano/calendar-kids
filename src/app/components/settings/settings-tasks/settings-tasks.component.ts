import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonButton, IonInput, IonTextarea,
  IonToggle, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonContent
} from '@ionic/angular/standalone';
import { Task } from 'src/app/models/task.models';
import { SettingService } from '../../../services/setting.service';

@Component({
  selector: 'app-settings-tasks',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonButton, IonInput, IonTextarea,
    IonToggle, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonContent
  ],
  templateUrl: './settings-tasks.component.html',
  styleUrls: ['./settings-tasks.component.scss']
})
export class SettingsTasksComponent {
  tasks = input.required<Task[]>();
  tasksChanged = output<void>();

  /** Emitted when a new task is created while addingToRoutine context is set externally.
   *  Used by the routines component to hook into task creation. */
  taskCreated = output<Task>();

  private settingService = inject(SettingService);

  showTaskModal = signal(false);
  editingTask = signal<Task | null>(null);

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
    const confirmed = window.confirm('Sei sicuro di voler eliminare questo task?');
    if (confirmed) {
      this.settingService.deleteTask(task.id).subscribe(() => this.tasksChanged.emit());
    }
  }

  onToggleTask(task: Task, newState: boolean) {
    this.settingService.updateTask(task.id, { ...task, isActive: newState })
      .subscribe(() => this.tasksChanged.emit());
  }

  saveTask() {
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
      this.settingService.updateTask(editing.id, { ...editing, ...payload }).subscribe(() => {
        this.tasksChanged.emit();
        this.closeTaskModal();
      });
    } else {
      this.settingService.createTask(payload).subscribe((createdTask: Task) => {
        this.tasksChanged.emit();
        this.taskCreated.emit(createdTask);
        this.closeTaskModal();
      });
    }
  }

  closeTaskModal() {
    this.showTaskModal.set(false);
    this.editingTask.set(null);
  }

  /** Opens the modal pre-configured for creating a task (used by routines component). */
  openForRoutine() {
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
}
