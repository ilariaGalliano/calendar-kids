import { Component, Input, OnInit } from '@angular/core';
import { NgForOf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { IonButton, IonItem, IonButtons, IonHeader, IonTitle, IonToolbar, IonContent, IonLabel, IonInput, IonCheckbox, IonList, IonModal, IonTextarea } from "@ionic/angular/standalone";

@Component({
  selector: 'app-create-routine-modal',
  templateUrl: './create-routine-modal.component.html',
  styleUrls: ['./create-routine-modal.component.scss'],
  imports: [IonButton, IonItem, IonButtons, IonHeader, IonTitle, IonToolbar, IonContent, IonLabel, IonInput, IonCheckbox, IonList, FormsModule, NgForOf, IonModal, IonTextarea],
  providers: [ModalController],
  standalone: true
})
export class CreateRoutineModalComponent implements OnInit {
  // --- MODAL STATE & LOGIC FOR ADD/EDIT TASK ---
  showTaskModalSignal = false;
  showTaskModal() { return this.showTaskModalSignal; }

  editingTaskObj: any = null;
  editingTask() { return this.editingTaskObj; }

  taskForm = {
    emoji: '🎯',
    title: '',
    description: '',
    duration: 30,
    reward: 10,
    color: '#4ECDC4',
    startTime: '08:00',
    endTime: '08:30'
  };
  taskColors = [
    '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE'
  ];
  addingToDay: string | null = null;

  // Open modal for adding a new task to a specific day
  openTaskModal(day: string) {
    this.addingToDay = day;
    this.editingTaskObj = null;
    this.taskForm = {
      emoji: '🎯',
      title: '',
      description: '',
      duration: 30,
      reward: 10,
      color: '#4ECDC4',
      startTime: '08:00',
      endTime: '08:30'
    };
    this.showTaskModalSignal = true;
  }

  // Open modal for editing an existing task
  openEditTaskModal(day: string, task: any) {
    this.addingToDay = day;
    this.editingTaskObj = task;
    this.taskForm = { 
      ...task,
      startTime: task.startTime || '08:00',
      endTime: task.endTime || '08:30'
    };
    this.showTaskModalSignal = true;
  }

  closeTaskModal() {
    this.showTaskModalSignal = false;
    this.editingTaskObj = null;
    this.addingToDay = null;
  }

  saveTask() {
    // Validazione obbligatoria
    if (!this.taskForm.title?.trim()) {
      alert('Inserisci il nome del task');
      return;
    }
    if (!this.taskForm.startTime || !this.taskForm.endTime) {
      alert('Inserisci ora di inizio e fine');
      return;
    }
    
    if (this.addingToDay) {
      const taskData = {
        ...this.taskForm,
        startTime: this.taskForm.startTime,
        endTime: this.taskForm.endTime,
      };
      
      if (this.editingTaskObj) {
        // Update existing task
        const idx = this.tasksByDay[this.addingToDay].findIndex((t: any) => t.id === this.editingTaskObj.id);
        if (idx > -1) {
          this.tasksByDay[this.addingToDay][idx] = { ...taskData, id: this.editingTaskObj.id };
        }
      } else {
        // Add new task
        this.tasksByDay[this.addingToDay].push({ ...taskData, id: crypto.randomUUID() });
      }
    }
    this.closeTaskModal();
  }
  // Toggle a day in selectedDays array
  toggleDay(day: string, checked: boolean) {
    if (checked) {
      if (!this.selectedDays.includes(day)) {
        this.selectedDays.push(day);
      }
    } else {
      this.selectedDays = this.selectedDays.filter(d => d !== day);
    }
  }

  constructor(private modalCtrl: ModalController) { }

  ngOnInit() { }
  @Input() childId!: string;

  name = 'Nuova Routine';
  selectedDays = ['mon', 'tue', 'wed', 'thu', 'fri'];
  tasksByDay: any = {
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
    sun: []
  };

  daysList = [
    { key: 'mon', label: 'Lunedì' },
    { key: 'tue', label: 'Martedì' },
    { key: 'wed', label: 'Mercoledì' },
    { key: 'thu', label: 'Giovedì' },
    { key: 'fri', label: 'Venerdì' },
    { key: 'sat', label: 'Sabato' },
    { key: 'sun', label: 'Domenica' }
  ];

onDayToggle(dayKey: string, checked: boolean) {
  if (checked) {
    if (!this.selectedDays.includes(dayKey)) {
      this.selectedDays.push(dayKey);
    }
  } else {
    this.selectedDays = this.selectedDays.filter(d => d !== dayKey);
  }
}

  addTask(day: string) {
    this.openTaskModal(day);
  }

  save() {
    const routinePayload = {
      childId: this.childId,
      name: this.name,
      days: this.selectedDays,
      tasksByDay: this.tasksByDay,
      isActive: true,
      description: ''
    };
    // Call createRoutine API via parent SettingService
    if ((window as any).settingService) {
      (window as any).settingService.createRoutine(routinePayload).subscribe(() => {
        this.modalCtrl.dismiss();
      });
    } else {
      // fallback: just dismiss and return payload
      this.modalCtrl.dismiss(routinePayload);
    }
  }

  close() {
    this.modalCtrl.dismiss();
  }

}
